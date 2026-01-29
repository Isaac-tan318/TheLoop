import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import authRoutes from './auth.js';
import analyticsRoutes from './analytics.js';
import suggestionsRoutes from './suggestions.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Signup from '../models/Signup.js';
import Interest from '../models/Interest.js';

const router = express.Router();

// ========== AUTH ROUTES (public) ==========
router.use('/auth', authRoutes);

// ========== ANALYTICS ROUTES (tracking user behavior) ==========
router.use('/analytics', analyticsRoutes);

// ========== SUGGESTIONS ROUTES (AI recommendations) ==========
router.use('/suggestions', suggestionsRoutes);

// ========== EVENTS (public reads, protected writes) ==========
router.get('/events', async (req, res, next) => {
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

router.get('/events/:id', async (req, res, next) => {
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

router.post('/events', authenticateToken, async (req, res, next) => {
  try {
    const created = await Event.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/events/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/events/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/events/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ========== INTERESTS (public reads, protected writes) ==========
router.get('/interests', async (req, res, next) => {
  try {
    const docs = await Interest.find({}).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/interests/:id', async (req, res, next) => {
  try {
    const doc = await Interest.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.post('/interests', authenticateToken, async (req, res, next) => {
  try {
    const created = await Interest.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/interests/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Interest.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/interests/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Interest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/interests/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Interest.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ========== USERS (fully protected) ==========
router.get('/users', authenticateToken, async (req, res, next) => {
  try {
    const filter = { ...req.query };
    const docs = await User.find(filter).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const doc = await User.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.post('/users', authenticateToken, async (req, res, next) => {
  try {
    const created = await User.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ========== SIGNUPS (fully protected) ==========
router.get('/signups', authenticateToken, async (req, res, next) => {
  try {
    const filter = { ...req.query };
    const docs = await Signup.find(filter).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/signups/:id', authenticateToken, async (req, res, next) => {
  try {
    const doc = await Signup.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.post('/signups', authenticateToken, async (req, res, next) => {
  try {
    const created = await Signup.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/signups/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Signup.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/signups/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await Signup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/signups/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Signup.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
