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
