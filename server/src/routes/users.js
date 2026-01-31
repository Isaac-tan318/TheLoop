import express from 'express';
import { authenticateToken, requireSelfOrForbid } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const filter = { ...req.query };
    const docs = await User.find(filter).lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const doc = await User.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// Create user
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const created = await User.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Update user
router.put('/:id', authenticateToken, requireSelfOrForbid, async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, overwrite: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Partial update user
router.patch('/:id', authenticateToken, requireSelfOrForbid, async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete user
router.delete('/:id', authenticateToken, requireSelfOrForbid, async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
