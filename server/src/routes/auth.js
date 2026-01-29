import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role, interests } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'student',
      interests: interests || [],
    });

    const token = generateToken({ _id: user._id.toString(), email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ _id: user._id.toString(), email: user.email, role: user.role });
    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// Get current user (protected)
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
});

function sanitizeUser(user) {
  if (!user) return null;
  return {
    _id: user._id?.toString?.() || user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    interests: user.interests,
    createdAt: user.createdAt,
  };
}

export default router;
