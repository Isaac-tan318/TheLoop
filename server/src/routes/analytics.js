/**
 * Analytics routes for tracking user behavior
 * Used to improve personalized recommendations
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Event from '../models/Event.js';
import SearchHistory from '../models/SearchHistory.js';
import ViewHistory from '../models/ViewHistory.js';

const router = express.Router();

const MAX_HISTORY_ITEMS = 20;

async function pruneHistory(Model, userId) {
  const count = await Model.countDocuments({ userId });
  if (count <= MAX_HISTORY_ITEMS) return;

  const excess = count - MAX_HISTORY_ITEMS;
  const oldest = await Model.find({ userId })
    .sort({ timestamp: 1 })
    .limit(excess)
    .select('_id');

  if (oldest.length) {
    await Model.deleteMany({ _id: { $in: oldest.map((doc) => doc._id) } });
  }
}

/**
 * POST /api/analytics/search
 * Record a search query for the authenticated user
 * Body: { query: string }
 */
router.post('/search', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchEntry = await SearchHistory.create({
      userId,
      query: query.trim(),
    });

    await pruneHistory(SearchHistory, userId);

    res.json({ message: 'Search recorded', entry: searchEntry });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/analytics/view
 * Record an event view/click for the authenticated user
 * Body: { eventId: string }
 */
router.post('/view', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Get event title for richer embedding context
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const viewEntry = await ViewHistory.create({
      userId,
      eventId,
      eventTitle: event.title,
    });

    await pruneHistory(ViewHistory, userId);

    res.json({ message: 'View recorded', entry: viewEntry });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/history
 * Get the authenticated user's search and view history
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [searchHistory, viewHistory] = await Promise.all([
      SearchHistory.find({ userId })
        .sort({ timestamp: -1 })
        .limit(MAX_HISTORY_ITEMS)
        .lean(),
      ViewHistory.find({ userId })
        .sort({ timestamp: -1 })
        .limit(MAX_HISTORY_ITEMS)
        .lean(),
    ]);

    res.json({
      searchHistory,
      viewHistory,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/analytics/history
 * Clear the authenticated user's search and view history
 */
router.delete('/history', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      SearchHistory.deleteMany({ userId }),
      ViewHistory.deleteMany({ userId }),
    ]);

    res.json({ message: 'History cleared' });
  } catch (err) {
    next(err);
  }
});

export default router;
