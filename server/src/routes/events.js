import express from 'express';
import { authenticateToken, requireOrganiser } from '../middleware/auth.js';
import Event from '../models/Event.js';
import { getEmbedding, buildEventText } from '../utils/gemini.js';

const router = express.Router();

// Generate embedding for an event (non-blocking)
async function generateEmbedding(eventId, eventData) {
  try {
    const text = buildEventText(eventData);
    const embedding = await getEmbedding(text);
    await Event.findByIdAndUpdate(eventId, { embedding });
  } catch (err) {
    console.error(`Failed to generate embedding for event ${eventId}:`, err.message);
  }
}

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: organiserId
 *         schema:
 *           type: string
 *         description: Filter by organiser ID
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
// Get all events (public)
router.get('/', async (req, res, next) => {
  try {
    const filter = { ...req.query };
    const docs = await Event.find(filter).populate('organiserId', 'name').lean();
    // Map organiser name to organiserName for frontend compatibility
    const result = docs.map(doc => ({
      ...doc,
      organiserName: doc.organiserId?.name || 'Unknown Organiser',
      organiserId: doc.organiserId?._id || doc.organiserId,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
// Get single event (public)
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Event.findById(req.params.id).populate('organiserId', 'name').lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    // Map organiser name to organiserName for frontend compatibility
    const result = {
      ...doc,
      organiserName: doc.organiserId?.name || 'Unknown Organiser',
      organiserId: doc.organiserId?._id || doc.organiserId,
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (organiser only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - organiserId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *               capacity:
 *                 type: number
 *               imageUrl:
 *                 type: string
 *               additionalFields:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Organiser role required
 */
// Create event (organiser only)
router.post('/', authenticateToken, requireOrganiser, async (req, res, next) => {
  try {
    const created = await Event.create(req.body);
    // Generate embedding in background (non-blocking)
    generateEmbedding(created._id, created);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event (full replace, organiser only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Can only edit your own events
 *       404:
 *         description: Event not found
 */
// Update event 
router.put('/:id', authenticateToken, requireOrganiser, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Not found' });
    if (event.organiserId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    // Regenerate embedding in background (non-blocking)
    generateEmbedding(req.params.id, updated);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Partially update an event (organiser only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               signupsOpen:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Can only edit your own events
 *       404:
 *         description: Event not found
 */
// Partial update event 
router.patch('/:id', authenticateToken, requireOrganiser, async (req, res, next) => {
  try {
    // Verify the user owns this event
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Not found' });
    if (event.organiserId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    // Regenerate embedding if content fields changed (non-blocking)
    if (req.body.title || req.body.description || req.body.interests || req.body.location) {
      generateEmbedding(req.params.id, updated);
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (organiser only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       403:
 *         description: Can only delete your own events
 *       404:
 *         description: Event not found
 */
// Delete event 
router.delete('/:id', authenticateToken, requireOrganiser, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: 'Not found' });
    if (event.organiserId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
