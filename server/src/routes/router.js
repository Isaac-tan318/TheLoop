import express from 'express';
import authRoutes from './auth.js';
import analyticsRoutes from './analytics.js';
import suggestionsRoutes from './suggestions.js';
import eventsRoutes from './events.js';
import usersRoutes from './users.js';
import signupsRoutes from './signups.js';
import reviewsRoutes from './reviews.js';

const router = express.Router();

// AUTH ROUTES (public)
router.use('/auth', authRoutes);

// ANALYTICS ROUTES (tracking user behavior)
router.use('/analytics', analyticsRoutes);

// SUGGESTIONS ROUTES (ai recommendations)
router.use('/suggestions', suggestionsRoutes);

// EVENTS (public reads, protected writes)
router.use('/events', eventsRoutes);

// USERS (fully protected)
router.use('/users', usersRoutes);

// SIGNUPS (fully protected)
router.use('/signups', signupsRoutes);

// REVIEWS (public reads, protected writes)
router.use('/reviews', reviewsRoutes);

export default router;
