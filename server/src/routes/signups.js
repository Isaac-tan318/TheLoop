import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Signup from '../models/Signup.js';
import Event from '../models/Event.js';

const router = express.Router();

// Get due reminders for a user (uses index for efficient query)
router.get('/reminders/due', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const now = new Date();
    const docs = await Signup.find({
      userId,
      'reminder.time': { $lte: now },
      'reminder.sent': { $ne: true },
      'reminder.dismissed': { $ne: true },
    })
      .populate('userId', 'name email')
      .populate('eventId', 'title startDate location')
      .lean();

    // Map to enriched reminder format
    const result = docs.map(doc => ({
      _id: doc._id,
      signupId: doc._id,
      userId: doc.userId?._id || doc.userId,
      eventId: doc.eventId?._id || doc.eventId,
      eventTitle: doc.eventId?.title || 'Unknown Event',
      eventStart: doc.eventId?.startDate,
      eventLocation: doc.eventId?.location,
      reminderTime: doc.reminder?.time,
      sent: doc.reminder?.sent || false,
      dismissed: doc.reminder?.dismissed || false,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get all signups
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const filter = { ...req.query };
    const docs = await Signup.find(filter).populate('userId', 'name email').lean();
    // Map user data to userName/userEmail for frontend compatibility
    const result = docs.map(doc => ({
      ...doc,
      userName: doc.userId?.name || 'Unknown User',
      userEmail: doc.userId?.email || '',
      userId: doc.userId?._id || doc.userId,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get single signup
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const doc = await Signup.findById(req.params.id).populate('userId', 'name email').lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    // Map user data for frontend compatibility
    const result = {
      ...doc,
      userName: doc.userId?.name || 'Unknown User',
      userEmail: doc.userId?.email || '',
      userId: doc.userId?._id || doc.userId,
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Create signup
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Validate that signups are open for this event
    const event = await Event.findById(req.body.eventId).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.signupsOpen === false) {
      return res.status(400).json({ message: 'Signups are closed for this event' });
    }
    
    const created = await Signup.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Update signup
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Signup.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Partial update signup
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Signup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete signup
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Signup.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
