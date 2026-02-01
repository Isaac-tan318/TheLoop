
//  AI powered event suggestions
//  Uses Google Gemini embeddings with MongoDB Atlas Vector Search

import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Signup from '../models/Signup.js';
import SearchHistory from '../models/SearchHistory.js';
import ViewHistory from '../models/ViewHistory.js';
import Review from '../models/Review.js';
import {
  buildUserProfileText,
  getEmbedding,
} from '../utils/gemini.js';

const router = express.Router();


/**
 * @swagger
 * /api/suggestions:
 *   get:
 *     summary: Get personalized event recommendations
 *     description: Returns AI-powered event suggestions based on user interests, search history, and view history. Falls back to popular events if user has no activity.
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of recommendations to return
 *       - in: query
 *         name: includeSignedUp
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include events the user has already signed up for
 *     responses:
 *       200:
 *         description: List of recommended events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Event'
 *                       - type: object
 *                         properties:
 *                           similarityScore:
 *                             type: number
 *                             description: Match score (0-1)
 *                           isSignedUp:
 *                             type: boolean
 *                 recommendationType:
 *                   type: string
 *                   enum: [personalized, personalized_vector, popular]
 *                   description: Type of recommendations returned
 *       404:
 *         description: User not found
 */
//  GET /api/suggestions
//  Returns personalized event suggestions for the authenticated user
 
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const includeSignedUp = req.query.includeSignedUp === 'true';

    // Build context for ranking
    const context = await buildUserContext(userId, includeSignedUp);
    if (!context.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough data for personalized recommendations
    const hasInterests = context.user.interests?.length > 0;
    const hasBehaviorSignals = context.searchHistory.length > 0 || context.viewHistory.length > 0 || context.signups.length > 0;
    const hasReviewData = context.reviewInsights?.positiveTopicsList?.length > 0 || context.reviewInsights?.negativeTopicsList?.length > 0;
    const hasGeminiKey = process.env.GEMINI_API_KEY?.trim().length > 0;
    const canUseVectorSearch = hasGeminiKey && (hasInterests || hasBehaviorSignals || hasReviewData);

    let vectorResults = [];
    let recommendationType = 'popular';

    // Use vector search if user has enough data
    if (canUseVectorSearch) {
      try {
        const userProfileText = buildUserProfileText(context.enhancedUser, {
          positiveReviewTopics: context.reviewInsights?.positiveTopicsList || [],
          negativeReviewTopics: context.reviewInsights?.negativeTopicsList || [],
        });
        const userEmbedding = await getEmbedding(userProfileText);

        // Run Vector Search Pipeline
        const pipeline = [
          {
            $vectorSearch: {
              index: 'default',
              path: 'embedding',
              queryVector: userEmbedding,
              numCandidates: 100,
              limit: 50,
              filter: {
                $and: [
                  { startDate: { $gte: new Date() } },
                  { signupsOpen: { $eq: true } }
                ]
              }
            }
          },
          {
            $project: {
              title: 1,
              description: 1,
              location: 1,
              startDate: 1,
              endDate: 1,
              organiserId: 1,
              interests: 1,
              capacity: 1,
              signupCount: 1,
              signupsOpen: 1,
              imageUrl: 1,
              additionalFields: 1,
              similarityScore: { $meta: 'vectorSearchScore' }
            }
          }
        ];

        vectorResults = await Event.aggregate(pipeline);
        if (vectorResults.length > 0) {
          // scale vector scores by 0.7x so boosts can be applied to events
          vectorResults = vectorResults.map(event => ({
            ...event,
            similarityScore: (event.similarityScore || 0) * 0.7
          }));
          recommendationType = 'personalized_vector';
        }
      } catch (err) {
        console.error('Vector search failed, falling back:', err.message);
      }
    }

    // Fallback if Vector Search returns nothing or wasn't attempted
    let candidates = vectorResults;
    if (candidates.length === 0) {
      candidates = await getCandidateEvents(context.signedUpEventIds, includeSignedUp);
      candidates = fallbackRanking(context.enhancedUser, candidates, {
        signedUpEventIds: context.signedUpEventIds,
        usePopularityOnly: !hasInterests && !hasBehaviorSignals,
      });
      recommendationType = hasInterests || hasBehaviorSignals ? 'personalized' : 'popular';
    }

    // Filter out signed-up events
    if (!includeSignedUp && context.signedUpEventIds.size > 0) {
      candidates = candidates.filter(e => !context.signedUpEventIds.has(e._id.toString()));
    }

    // Apply boosts
    const boostedEvents = applyBoosts(candidates.slice(0, limit), context);

    res.json({
      events: boostedEvents,
      recommendationType,
    });
  } catch (err) {
    next(err);
  }
});

// Build user context with all data needed for ranking
async function buildUserContext(userId, includeSignedUp) {
  const user = await User.findById(userId).lean({ virtuals: true });
  if (!user) return { user: null };

  // Only consider signups from the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [signups, searchHistory, viewHistory, reviews] = await Promise.all([
    Signup.find({ userId, createdAt: { $gte: sixMonthsAgo } }).lean({ virtuals: true }),
    SearchHistory.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ViewHistory.find({ userId }).sort({ createdAt: -1 }).limit(15).populate('eventId', 'title').lean(),
    Review.find({ userId }).populate('eventId', 'interests title').lean(),
  ]);

  const signedUpEventIds = new Set(
    signups.map((s) => (s.eventId?.toString ? s.eventId.toString() : String(s.eventId)))
  );

  const { weights: signupInterestWeights, orderedList: pastSignupInterests } = 
    await buildSignupInterestInsights(Array.from(signedUpEventIds));

  // Build review insights - extract topics from positive and negative reviews
  const reviewInsights = buildReviewInsights(reviews);

  const enhancedUser = {
    ...user,
    activitySignals: { signupCount: signups.length },
    pastSignupInterests,
    signupInterestWeights,
    searchHistory: searchHistory.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    viewHistory: viewHistory.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  };

  return {
    user,
    enhancedUser,
    signups,
    signedUpEventIds,
    searchHistory,
    viewHistory,
    signupInterestWeights,
    reviewInsights,
  };
}

// Build insights from user reviews - extract positive and negative topic weights
function buildReviewInsights(reviews) {
  const positiveTopics = new Map(); // topics from 4-5 star reviews
  const negativeTopics = new Map(); // topics from 1-2 star reviews

  for (const review of reviews) {
    const interests = review.eventId?.interests || [];
    if (!interests.length) continue;

    if (review.rating >= 4) {
      // Positive review - weight by rating (4 = 0.8, 5 = 1.0)
      const weight = review.rating / 5;
      for (const interest of interests) {
        positiveTopics.set(interest, Math.max(positiveTopics.get(interest) || 0, weight));
      }
    } else if (review.rating <= 2) {
      // Negative review - weight by how bad (1 = 1.0, 2 = 0.5)
      const weight = (3 - review.rating) / 2;
      for (const interest of interests) {
        negativeTopics.set(interest, Math.max(negativeTopics.get(interest) || 0, weight));
      }
    }
  }

  return {
    positiveTopics: Object.fromEntries(positiveTopics),
    negativeTopics: Object.fromEntries(negativeTopics),
    positiveTopicsList: [...positiveTopics.keys()],
    negativeTopicsList: [...negativeTopics.keys()],
  };
}

// Get candidate events for suggestions (fallback only)
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

  return Event.find(eventFilter)
    .sort({ startDate: 1 })
    .limit(100)
    .lean({ virtuals: true });
}

// Apply boosts to ranked events
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

    // Interest overlap boost (0-0.10)
    if (userInterestsSet.size > 0 && Array.isArray(event.interests)) {
      const overlapCount = event.interests.filter((interest) => userInterestsSet.has(interest)).length;
      const overlapRatio = overlapCount / userInterestsSet.size;
      boost += Math.min(overlapRatio * 0.10, 0.10);
    }

    // Signup interest affinity boost (0-0.10)
    if (event.interests?.length) {
      const signupAffinity = event.interests.reduce(
        (sum, interest) => sum + (signupInterestWeights[interest] || 0),
        0
      );
      boost += Math.min(signupAffinity * 0.10, 0.10);
    }

    // Organizer affinity boost (0.02)
    if (previousOrganizerIds.has(eventOrganiserId)) {
      boost += 0.02;
    }

    // Search history recency decay boost (0-0.05)
    // If event matches a recent search query, apply exponential decay boost
    if (searchHistory.length > 0) {
      const eventText = `${event.title} ${event.description} ${(event.interests || []).join(' ')}`.toLowerCase();
      for (const search of searchHistory) {
        const query = (search.query || '').toLowerCase();
        if (query && eventText.includes(query)) {
          const searchDate = new Date(search.createdAt);
          if (!isNaN(searchDate.getTime())) {
            const daysSinceSearch = (Date.now() - searchDate.getTime()) / (1000 * 60 * 60 * 24);
            boost += 0.05 * Math.exp(-0.1 * daysSinceSearch);
          }
          break; // Only apply once per event
        }
      }
    }

    // View history recency decay boost (0-0.03)
    // If user recently viewed this event, apply exponential decay boost
    if (viewHistory.length > 0) {
      for (const view of viewHistory) {
        const viewedEventId = view.eventId?._id?.toString?.() || view.eventId?.toString?.() || String(view.eventId);
        if (viewedEventId === eventId) {
          const viewDate = new Date(view.createdAt);
          if (!isNaN(viewDate.getTime())) {
            const daysSinceView = (Date.now() - viewDate.getTime()) / (1000 * 60 * 60 * 24);
            boost += 0.03 * Math.exp(-0.1 * daysSinceView);
          }
          break; // Only apply once per event
        }
      }
    }

    const finalScore = Math.min((event.similarityScore || 0) + boost, 1.0);
    return {
      ...event,
      embedding: undefined, // to not send embedding to client
      similarityScore: finalScore,
      similarityPercentage: Math.round(finalScore * 100),
      isSignedUp: signedUpEventIds.has(eventId),
    };
  }).sort((a, b) => b.similarityScore - a.similarityScore);
}

// Fallback rule-based ranking when Gemini API is unavailable
// When usePopularityOnly is true (user has no interests), ranks purely by popularity + recency
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
