import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Middleware to check if user is modifying their own resource
export function requireSelfOrForbid(req, res, next) {
  if (req.user._id !== req.params.id) {
    return res.status(403).json({ message: 'You can only modify your own account' });
  }
  next();
}

// Middleware to check if user has organiser role
export function requireOrganiser(req, res, next) {
  if (req.user.role !== 'organiser') {
    return res.status(403).json({ message: 'Only organisers can perform this action' });
  }
  next();
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '72h' });
}
