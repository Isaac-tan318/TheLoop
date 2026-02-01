import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import Review from '../models/Review.js';
import Event from '../models/Event.js';
import Signup from '../models/Signup.js';

const router = express.Router();

// Get reviews (optionally filtered by eventId/userId)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) {
      filter.eventId = new mongoose.Types.ObjectId(req.query.eventId);
    }
    if (req.query.userId) {
      filter.userId = new mongoose.Types.ObjectId(req.query.userId);
    }
    
    const docs = await Review.find(filter)
      .populate('userId', 'name')
      .lean();

    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// Create review (only if signed up, present, and event is over)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { eventId, rating, comment } = req.body;
    if (!eventId || !rating) {
      return res.status(400).json({ message: 'eventId and rating are required' });
    }

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const eventStart = event.startDate ? new Date(event.startDate) : null;
    if (eventStart && eventStart > new Date()) {
      return res.status(400).json({ message: 'You can only review once the event has started' });
    }

    const signup = await Signup.findOne({ eventId, userId: req.user._id }).lean();
    if (!signup) {
      return res.status(403).json({ message: 'You must be signed up to review this event' });
    }

    if (!signup.attendedEvent) {
      return res.status(403).json({ message: 'Only attendees marked as present can review this event' });
    }

    const created = await Review.create({
      eventId,
      userId: req.user._id,
      rating,
      comment: comment || '',
    });

    res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already reviewed this event' });
    }
    next(err);
  }
});

// Update review (only owner can update)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    review.rating = rating;
    review.comment = comment || '';
    await review.save();

    res.json(review);
  } catch (err) {
    next(err);
  }
});

// Delete review (only owner can delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
