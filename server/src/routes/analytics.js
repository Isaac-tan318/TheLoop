// Analytics routes for tracking user behavior
// Used to improve personalized recommendations

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
 * @swagger
 * /api/analytics/search:
 *   post:
 *     summary: Record a search query for recommendations
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The search query
 *     responses:
 *       200:
 *         description: Search recorded successfully
 *       400:
 *         description: Search query is required
 */
// POST /api/analytics/search
// Record a search query for the authenticated user
// Body: { query: string }
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
 * @swagger
 * /api/analytics/view:
 *   post:
 *     summary: Record an event view for recommendations
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: The event ID that was viewed
 *     responses:
 *       200:
 *         description: View recorded successfully
 *       400:
 *         description: Event ID is required
 *       404:
 *         description: Event not found
 */
// POST /api/analytics/view
// Record an event view/click for the authenticated user
// Body: { eventId: string }
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
    });

    await pruneHistory(ViewHistory, userId);

    res.json({ message: 'View recorded', entry: viewEntry });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/analytics/history:
 *   get:
 *     summary: Get user's search and view history
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 searchHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       query:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 viewHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       eventId:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */
// GET /api/analytics/history
// Get the authenticated user's search and view history
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
 * @swagger
 * /api/analytics/history:
 *   delete:
 *     summary: Clear user's search and view history
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History cleared successfully
 */
// DELETE /api/analytics/history
// Clear the authenticated user's search and view history
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
