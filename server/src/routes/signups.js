import express from 'express';
import { authenticateToken, requireOrganiser } from '../middleware/auth.js';
import Signup from '../models/Signup.js';
import Event from '../models/Event.js';

const router = express.Router();

/**
 * @swagger
 * /api/signups/reminders/due:
 *   get:
 *     summary: Get due reminders for a user
 *     tags: [Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of due reminders
 *       400:
 *         description: userId required
 */
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

/**
 * @swagger
 * /api/signups:
 *   get:
 *     summary: Get all signups
 *     tags: [Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Filter by event ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of signups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Signup'
 */
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

/**
 * @swagger
 * /api/signups/{id}:
 *   get:
 *     summary: Get a single signup by ID
 *     tags: [Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Signup ID
 *     responses:
 *       200:
 *         description: Signup details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Signup'
 *       404:
 *         description: Signup not found
 */
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

/**
 * @swagger
 * /api/signups:
 *   post:
 *     summary: Create a new signup for an event
 *     tags: [Signups]
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
 *               - userId
 *             properties:
 *               eventId:
 *                 type: string
 *               userId:
 *                 type: string
 *               additionalInfo:
 *                 type: object
 *                 description: Answers to additional fields
 *               reminder:
 *                 type: object
 *                 properties:
 *                   time:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       201:
 *         description: Signup created successfully
 *       400:
 *         description: Signups closed or missing required fields
 *       404:
 *         description: Event not found
 */
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
    
    // Validate required additional fields if the event has them
    const additionalFields = event.additionalFields || [];
    const additionalInfo = req.body.additionalInfo || {};
    
    if (additionalFields.length > 0) {
      const missingRequired = additionalFields
        .filter(field => field.required && !String(additionalInfo[field._id] ?? '').trim())
        .map(field => field.label);
      
      if (missingRequired.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missingRequired.join(', ')}`,
          code: 'MISSING_REQUIRED_FIELDS',
          requiredFields: missingRequired
        });
      }
    }
    
    // If event has no additional fields, ignore any submitted additionalInfo
    const signupData = {
      ...req.body,
      additionalInfo: additionalFields.length > 0 ? additionalInfo : null
    };
    
    const created = await Signup.create(signupData);
    
    // Increment event signup count
    await Event.findByIdAndUpdate(req.body.eventId, { $inc: { signupCount: 1 } });
    
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/signups/{id}:
 *   put:
 *     summary: Update a signup (full replace)
 *     tags: [Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Signup ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Signup'
 *     responses:
 *       200:
 *         description: Signup updated successfully
 *       404:
 *         description: Signup not found
 */
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

/**
 * @swagger
 * /api/signups/{id}:
 *   patch:
 *     summary: Partially update a signup (e.g., dismiss reminder)
 *     tags: [Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Signup ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reminder:
 *                 type: object
 *                 properties:
 *                   dismissed:
 *                     type: boolean
 *                   sent:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Signup updated successfully
 *       404:
 *         description: Signup not found
 */
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

// Mark attendance (organiser only)
router.patch('/:id/attendance', authenticateToken, requireOrganiser, async (req, res, next) => {
  try {
    const { attended } = req.body;
    if (typeof attended !== 'boolean') {
      return res.status(400).json({ message: 'attended must be a boolean' });
    }

    const signup = await Signup.findById(req.params.id).lean();
    if (!signup) return res.status(404).json({ message: 'Not found' });

    const event = await Event.findById(signup.eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organiserId.toString() !== req.user._id) {
      return res.status(403).json({ message: 'You can only mark attendance for your own events' });
    }

    const updated = await Signup.findByIdAndUpdate(
      req.params.id,
      {
        attendedEvent: attended,
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email').lean();

    // Map user data to userName/userEmail for frontend compatibility
    const result = {
      ...updated,
      userName: updated.userId?.name || 'Unknown User',
      userEmail: updated.userId?.email || '',
      userId: updated.userId?._id || updated.userId,
    };

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/signups/{id}:
 *   delete:
 *     summary: Cancel a signup
 *     tags: [Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Signup ID
 *     responses:
 *       204:
 *         description: Signup cancelled successfully
 *       404:
 *         description: Signup not found
 */
// Delete signup
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Signup.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    
    // Decrement event signup count
    await Event.findByIdAndUpdate(deleted.eventId, { $inc: { signupCount: -1 } });
    
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
