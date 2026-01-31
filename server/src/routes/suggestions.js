
//  AI powered event suggestions
//  Uses Google Gemini embeddings to rank events by relevance to user profile

import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Signup from '../models/Signup.js';
import SearchHistory from '../models/SearchHistory.js';
import ViewHistory from '../models/ViewHistory.js';
import {
  buildUserProfileText,
  buildEventText,
  getEmbedding,
  cosineSimilarity,
} from '../utils/gemini.js';

const router = express.Router();


//  GET /api/suggestions
//  Returns personalized event suggestions for the authenticated user
 
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const includeSignedUp = req.query.includeSignedUp === 'true';

    // Build context needed for ranking
    const context = await buildUserContext(userId, includeSignedUp);
    if (!context.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get candidate events
    const candidateEvents = await getCandidateEvents(context.signedUpEventIds, includeSignedUp);
    if (!candidateEvents.length) {
      return res.json({ events: [], recommendationType: 'popular' });
    }

    // Determine ranking strategy
    const hasInterests = context.user.interests?.length > 0;
    const hasBehaviorSignals = context.searchHistory.length > 0 || context.viewHistory.length > 0 || context.signups.length > 0;
    const hasGeminiKey = process.env.GEMINI_API_KEY?.trim().length > 0;

    let rankedEvents;
    let recommendationType;

    // Try AI ranking, fall back to rule-based if it fails or isn't available
    if (hasGeminiKey && (hasInterests || hasBehaviorSignals)) {
      try {
        rankedEvents = await aiRanking(context.enhancedUser, candidateEvents, limit);
        recommendationType = 'personalized';
      } catch (aiErr) {
        console.error('AI ranking failed, using fallback:', aiErr.message);
        rankedEvents = null;
      }
    }

    // Use fallback if AI ranking wasn't attempted or failed
    if (!rankedEvents) {
      rankedEvents = fallbackRanking(context.enhancedUser, candidateEvents, {
        signedUpEventIds: context.signedUpEventIds,
        usePopularityOnly: !hasInterests && !hasBehaviorSignals,
      });
      recommendationType = hasInterests || hasBehaviorSignals ? 'personalized' : 'popular';
    }

    // Apply activity-based boosts to final scores
    const boostedEvents = applyBoosts(
      rankedEvents.slice(0, limit),
      context
    );

    res.json({
      events: boostedEvents,
      recommendationType,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Build user context with all data needed for ranking
 */
async function buildUserContext(userId, includeSignedUp) {
  const user = await User.findById(userId).lean({ virtuals: true });
  if (!user) return { user: null };

  // Only consider signups from the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [signups, searchHistory, viewHistory] = await Promise.all([
    Signup.find({ userId, createdAt: { $gte: sixMonthsAgo } }).lean({ virtuals: true }),
    SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
    ViewHistory.find({ userId }).sort({ timestamp: -1 }).limit(15).lean(),
  ]);

  const signedUpEventIds = new Set(
    signups.map((s) => (s.eventId?.toString ? s.eventId.toString() : String(s.eventId)))
  );

  const { weights: signupInterestWeights, orderedList: pastSignupInterests } = 
    await buildSignupInterestInsights(Array.from(signedUpEventIds));

  const enhancedUser = {
    ...user,
    activitySignals: { signupCount: signups.length },
    pastSignupInterests,
    signupInterestWeights,
    searchHistory: searchHistory.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    viewHistory: viewHistory.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
  };

  return {
    user,
    enhancedUser,
    signups,
    signedUpEventIds,
    searchHistory,
    viewHistory,
    signupInterestWeights,
  };
}

/**
 * Get candidate events for suggestions
 */
async function getCandidateEvents(signedUpEventIds, includeSignedUp) {
  const eventFilter = { startDate: { $gte: new Date() } };

  if (!includeSignedUp && signedUpEventIds.size > 0) {
    const excludeObjectIds = Array.from(signedUpEventIds)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (excludeObjectIds.length) {
      eventFilter._id = { $nin: excludeObjectIds };
    }
  }

  // Fetch events with pre-computed embeddings
  return Event.find(eventFilter)
    .select('+embedding')
    .sort({ startDate: 1 })
    .limit(100)
    .lean({ virtuals: true });
}

/**
 * AI-powered ranking using embeddings
 * Only generates user embedding; uses pre-stored event embeddings
 */
async function aiRanking(enhancedUser, candidateEvents, limit) {
  // Generate user profile embedding
  const userProfileText = buildUserProfileText(enhancedUser);
  const userEmbedding = await getEmbedding(userProfileText);

  // Separate events with/without embeddings
  const eventsWithEmbedding = [];
  const eventsWithoutEmbedding = [];

  for (const event of candidateEvents) {
    if (event.embedding?.length > 0) {
      eventsWithEmbedding.push(event);
    } else {
      eventsWithoutEmbedding.push(event);
    }
  }

  // Score events with pre-computed embeddings using in-memory cosine similarity
  const scoredWithEmbedding = eventsWithEmbedding.map((event) => ({
    ...event,
    similarityScore: cosineSimilarity(userEmbedding, event.embedding),
  }));

  // For events without embeddings, generate on the fly (and optionally cache)
  let scoredWithoutEmbedding = [];
  if (eventsWithoutEmbedding.length > 0) {
    const eventTexts = eventsWithoutEmbedding.map(buildEventText);
    const embeddings = await Promise.all(eventTexts.map((text) => getEmbedding(text)));

    scoredWithoutEmbedding = eventsWithoutEmbedding.map((event, i) => {
      // Cache the embedding for future requests 
      Event.updateOne({ _id: event._id }, { embedding: embeddings[i] }).catch(() => {});
      return {
        ...event,
        similarityScore: cosineSimilarity(userEmbedding, embeddings[i]),
      };
    });
  }

  // Combine and sort
  const allScored = [...scoredWithEmbedding, ...scoredWithoutEmbedding];
  allScored.sort((a, b) => b.similarityScore - a.similarityScore);

  return allScored.slice(0, limit);
}

/**
 * Apply activity-based boosts to ranked events
 */
function applyBoosts(rankedEvents, context) {
  const { user, enhancedUser, signups, signedUpEventIds } = context;
  const userInterestsSet = new Set(user.interests || []);
  const signupInterestWeights = enhancedUser.signupInterestWeights || {};
  const searchHistory = enhancedUser.searchHistory || [];
  const viewHistory = enhancedUser.viewHistory || [];

  // Build organizer affinity from past signups
  const previousOrganizerIds = new Set();
  for (const signup of signups) {
    const match = rankedEvents.find(
      (e) => (e._id?.toString?.() || String(e._id)) === (signup.eventId?.toString?.() || String(signup.eventId))
    );
    if (match?.organiserId) previousOrganizerIds.add(match.organiserId?.toString?.() || String(match.organiserId));
  }

  return rankedEvents.map((event) => {
    let boost = 0;
    const eventId = event._id?.toString?.() || String(event._id);
    const eventOrganiserId = event.organiserId?.toString?.() || String(event.organiserId);

    // Interest overlap boost (0-0.25)
    if (userInterestsSet.size > 0 && Array.isArray(event.interests)) {
      const overlapCount = event.interests.filter((interest) => userInterestsSet.has(interest)).length;
      const overlapRatio = overlapCount / userInterestsSet.size;
      boost += Math.min(overlapRatio * 0.25, 0.25);
    }

    // Signup interest affinity boost (0-0.25)
    if (event.interests?.length) {
      const signupAffinity = event.interests.reduce(
        (sum, interest) => sum + (signupInterestWeights[interest] || 0),
        0
      );
      boost += Math.min(signupAffinity * 0.25, 0.25);
    }

    // Organizer affinity boost (0.05)
    if (previousOrganizerIds.has(eventOrganiserId)) {
      boost += 0.05;
    }

    // Search history recency decay boost (0-0.15)
    // If event matches a recent search query, apply exponential decay boost
    if (searchHistory.length > 0) {
      const eventText = `${event.title} ${event.description} ${(event.interests || []).join(' ')}`.toLowerCase();
      for (const search of searchHistory) {
        const query = (search.query || '').toLowerCase();
        if (query && eventText.includes(query)) {
          const daysSinceSearch = (Date.now() - new Date(search.timestamp).getTime()) / (1000 * 60 * 60 * 24);
          boost += 0.15 * Math.exp(-0.1 * daysSinceSearch);
          break; // Only apply once per event
        }
      }
    }

    // View history recency decay boost (0-0.10)
    // If user recently viewed this event, apply exponential decay boost
    if (viewHistory.length > 0) {
      for (const view of viewHistory) {
        const viewedEventId = view.eventId?.toString?.() || String(view.eventId);
        if (viewedEventId === eventId) {
          const daysSinceView = (Date.now() - new Date(view.timestamp).getTime()) / (1000 * 60 * 60 * 24);
          boost += 0.10 * Math.exp(-0.1 * daysSinceView);
          break; // Only apply once per event
        }
      }
    }

    return {
      ...event,
      embedding: undefined, // Don't send embedding to client
      similarityScore: Math.min((event.similarityScore || 0) + boost, 1.0),
      isSignedUp: signedUpEventIds.has(eventId),
    };
  }).sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Fallback rule-based ranking when Gemini API is unavailable
 * When usePopularityOnly is true (user has no interests), ranks purely by popularity + recency
 */
function fallbackRanking(user, events, { signedUpEventIds, usePopularityOnly = false }) {
  const userInterests = new Set(user.interests || []);
  const signupInterestWeights = user.signupInterestWeights || {};
  const hasSignupInterestWeights = Object.keys(signupInterestWeights).length > 0;

  return events
    .map((event) => {
      let score = 0;
      const eventInterests = new Set(event.interests || []);

      if (usePopularityOnly) {
        // Popularity-based scoring for users without interests
        // Popularity (0-0.5) - higher weight when no interests
        const maxSignups = Math.max(...events.map(e => e.signupCount || 0), 1);
        score += ((event.signupCount || 0) / maxSignups) * 0.5;

        // Recency boost (0-0.3) - closer events score higher
        const daysUntil = (new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntil <= 7) score += 0.3;
        else if (daysUntil <= 14) score += 0.2;
        else if (daysUntil <= 30) score += 0.1;

        // Capacity availability (0-0.2)
        if (event.capacity && event.signupCount < event.capacity) {
          const availabilityRatio = 1 - event.signupCount / event.capacity;
          score += availabilityRatio * 0.2;
        }
      } else {
        // Interest-based scoring
        // Interest overlap (0-0.7)
        const overlap = [...userInterests].filter((i) => eventInterests.has(i)).length;
        if (userInterests.size > 0) {
          score += (overlap / userInterests.size) * 0.7;
        }

        if (hasSignupInterestWeights && event.interests?.length) {
          const signupAffinity = event.interests.reduce(
            (sum, interest) => sum + (signupInterestWeights[interest] || 0),
            0
          );
          if (signupAffinity > 0) {
            score += Math.min(signupAffinity * 0.3, 0.3);
          }
        }

        // Recency boost (0-0.15) - closer events score higher
        const daysUntil = (new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntil <= 7) score += 0.15;
        else if (daysUntil <= 14) score += 0.1;
        else if (daysUntil <= 30) score += 0.05;

        // Capacity availability (0-0.1)
        if (event.capacity && event.signupCount < event.capacity) {
          const availabilityRatio = 1 - event.signupCount / event.capacity;
          score += availabilityRatio * 0.1;
        }

        // Popularity (0-0.05) - some signups indicate interest
        if (event.signupCount > 0 && event.signupCount < (event.capacity || 100)) {
          score += Math.min(event.signupCount / 50, 0.05);
        }
      }

      return {
        ...event,
        similarityScore: Math.min(score, 1.0),
        isSignedUp:
          signedUpEventIds?.has(event._id?.toString?.() || String(event._id)) || false,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

async function buildSignupInterestInsights(eventIds = []) {
  if (!eventIds.length) {
    return { weights: {}, orderedList: [] };
  }

  const validObjectIds = eventIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!validObjectIds.length) {
    return { weights: {}, orderedList: [] };
  }

  const pastEvents = await Event.find({ _id: { $in: validObjectIds } }, { interests: 1 }).lean();
  const freqMap = new Map();

  pastEvents.forEach((event) => {
    (event.interests || []).forEach((interest) => {
      freqMap.set(interest, (freqMap.get(interest) || 0) + 1);
    });
  });

  if (!freqMap.size) {
    return { weights: {}, orderedList: [] };
  }

  const sortedEntries = [...freqMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = sortedEntries[0][1];

  return {
    weights: Object.fromEntries(
      sortedEntries.map(([interest, count]) => [interest, count / maxCount])
    ),
    orderedList: sortedEntries.map(([interest]) => interest),
  };
}

export default router;
