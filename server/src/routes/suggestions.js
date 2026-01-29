
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
  rankEventsByUserProfile,
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

    // Get user with full profile
    const user = await User.findById(userId).lean({ virtuals: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's activity for enhanced personalization
    const [signups, searchHistory, viewHistory] = await Promise.all([
      Signup.find({ userId }).lean({ virtuals: true }),
      SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
      ViewHistory.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
    ]);

    const signedUpEventIds = new Set(
      signups.map((s) => (s.eventId?.toString ? s.eventId.toString() : String(s.eventId)))
    );
    const {
      weights: signupInterestWeights,
      orderedList: pastSignupInterests,
    } = await buildSignupInterestInsights(Array.from(signedUpEventIds));

    // Build enhanced user profile with activity info
    const enhancedUser = {
      ...user,
      // Add interests from previously signed-up events for richer profile
      activitySignals: {
        signupCount: signups.length,
      },
      pastSignupInterests,
      signupInterestWeights,
      searchHistory: searchHistory.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      viewHistory: viewHistory.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    };

    // Get candidate events (upcoming only)
    let eventFilter = {
      startDate: { $gte: new Date() },
    };

    // exclude already signed-up events
    if (!includeSignedUp && signedUpEventIds.size > 0) {
      const excludeObjectIds = Array.from(signedUpEventIds)
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (excludeObjectIds.length) {
        eventFilter._id = { $nin: excludeObjectIds };
      }
    }

    const candidateEvents = await Event.find(eventFilter)
      .sort({ startDate: 1 })
      .limit(100) // Cap candidates to avoid excessive API usage
      .lean({ virtuals: true });

    if (!candidateEvents.length) {
      return res.json([]);
    }

    // Check if user signals exist for personalization
    const hasInterests = user.interests && user.interests.length > 0;
    const hasBehaviorSignals =
      searchHistory.length > 0 ||
      viewHistory.length > 0 ||
      signups.length > 0;
    const hasGeminiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;

    const shouldUseFallback = !hasGeminiKey || (!hasInterests && !hasBehaviorSignals);

    if (shouldUseFallback) {
      const fallbackResults = fallbackRanking(enhancedUser, candidateEvents, {
        signedUpEventIds,
        usePopularityOnly: !hasInterests && !hasBehaviorSignals,
      });
      const recommendationType = hasInterests || hasBehaviorSignals ? 'personalized' : 'popular';
      return res.json({
        events: fallbackResults.slice(0, limit),
        recommendationType,
      });
    }

    // Use AI ranking
    const rankedEvents = await rankEventsByUserProfile(
      enhancedUser,
      candidateEvents,
      limit
    );

    const userInterestsSet = new Set(user.interests || []);
    const signupInterestWeightsMap = enhancedUser.signupInterestWeights || {};

    // Add activity- and interest-based boosts to AI scores
    const boostedEvents = rankedEvents.map((event) => {
      let boost = 0;

      if (userInterestsSet.size > 0 && Array.isArray(event.interests)) {
        const overlapCount = event.interests.filter((interest) => userInterestsSet.has(interest)).length;
        const overlapRatio = overlapCount / userInterestsSet.size;
        boost += Math.min(overlapRatio * 0.25, 0.25);
      }

      if (event.interests?.length) {
        const signupAffinity = event.interests.reduce(
          (sum, interest) => sum + (signupInterestWeightsMap[interest] || 0),
          0
        );
        boost += Math.min(signupAffinity * 0.25, 0.25);
      }

      // Boost events from organizers user has signed up with before
      const previousOrganizerIds = signups
        .map((s) => {
          const match = candidateEvents.find(
            (e) => (e._id?.toString?.() || String(e._id)) === (s.eventId?.toString?.() || String(s.eventId))
          );
          return match?.organiserId;
        })
        .filter(Boolean);
      if (previousOrganizerIds.includes(event.organiserId)) {
        boost += 0.05;
      }

      return {
        ...event,
        similarityScore: Math.min(event.similarityScore + boost, 1.0),
        isSignedUp: signedUpEventIds.has(event._id?.toString?.() || String(event._id)),
      };
    });

    // Re-sort after boosts
    boostedEvents.sort((a, b) => b.similarityScore - a.similarityScore);

    res.json({
      events: boostedEvents,
      recommendationType: 'personalized',
    });
  } catch (err) {
    // If Gemini API fails, fall back to rule-based
    if (err.message?.includes('Gemini API')) {
      console.error('Gemini API error, falling back to rule-based:', err.message);
      try {
        const userId = req.user._id;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        
        const user = await User.findById(userId).lean({ virtuals: true });
        const [signups, searchHistory, viewHistory] = await Promise.all([
          Signup.find({ userId }).lean({ virtuals: true }),
          SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
          ViewHistory.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
        ]);
        
        const signedUpEventIds = new Set(
          signups.map((s) => (s.eventId?.toString ? s.eventId.toString() : String(s.eventId)))
        );
        const {
          weights: signupInterestWeights,
          orderedList: pastSignupInterests,
        } = await buildSignupInterestInsights(Array.from(signedUpEventIds));

        const enhancedUser = {
          ...user,
          activitySignals: {
            signupCount: signups.length,
          },
          pastSignupInterests,
          signupInterestWeights,
          searchHistory: searchHistory.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
          viewHistory: viewHistory.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        };

        const candidateEvents = await Event.find({
          startDate: { $gte: new Date() },
        }).sort({ startDate: 1 }).limit(100).lean({ virtuals: true });

        const hasInterests = user.interests && user.interests.length > 0;
        const hasBehaviorSignals =
          searchHistory.length > 0 ||
          viewHistory.length > 0 ||
          signups.length > 0;
        const results = fallbackRanking(
          enhancedUser,
          candidateEvents,
          {
            signedUpEventIds,
            usePopularityOnly: !hasInterests && !hasBehaviorSignals,
          }
        );

        const recommendationType = hasInterests || hasBehaviorSignals ? 'personalized' : 'popular';
        return res.json({
          events: results.slice(0, limit),
          recommendationType,
        });
      } catch (fallbackErr) {
        return next(fallbackErr);
      }
    }
    next(err);
  }
});

/**
 * GET /api/suggestions/similar/:eventId
 * Returns events similar to a specific event
 * Useful for "You might also like" sections
 */
router.get('/similar/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const targetEvent = await Event.findById(eventId).lean({ virtuals: true });
    if (!targetEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get other upcoming events
    const candidateEvents = await Event.find({
      _id: { $ne: eventId },
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(50)
      .lean({ virtuals: true });

    if (!candidateEvents.length) {
      return res.json([]);
    }

    // Check if Gemini API is configured
    const hasGeminiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
    if (!hasGeminiKey) {
      // Fallback: match by interests overlap
      const targetInterests = new Set(targetEvent.interests || []);
      const scored = candidateEvents.map((event) => {
        const eventInterests = new Set(event.interests || []);
        const overlap = [...targetInterests].filter((i) => eventInterests.has(i)).length;
        const total = new Set([...targetInterests, ...eventInterests]).size;
        return {
          ...event,
          similarityScore: total > 0 ? overlap / total : 0,
        };
      });
      scored.sort((a, b) => b.similarityScore - a.similarityScore);
      return res.json(scored.slice(0, limit));
    }

    // Use embeddings for similarity
    const targetText = buildEventText(targetEvent);
    const candidateTexts = candidateEvents.map(buildEventText);

    const [targetEmbedding, ...candidateEmbeddings] = await Promise.all([
      getEmbedding(targetText),
      ...candidateTexts.map((text) => getEmbedding(text)),
    ]);

    const scored = candidateEvents.map((event, i) => ({
      ...event,
      similarityScore: cosineSimilarity(targetEmbedding, candidateEmbeddings[i]),
    }));

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    res.json(scored.slice(0, limit));
  } catch (err) {
    next(err);
  }
});

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
