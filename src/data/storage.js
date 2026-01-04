/**
 * Local Storage Data Layer
 * Handles all persistent data storage operations
 */

const STORAGE_KEYS = {
  USERS: 'theloop_users',
  EVENTS: 'theloop_events',
  SIGNUPS: 'theloop_signups',
  CURRENT_USER: 'theloop_current_user',
  REMINDERS: 'theloop_reminders',
  INTERESTS: 'theloop_interests',
};

// Helper functions for localStorage
const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

// Initialize default data
const initializeStorage = () => {
  if (!getItem(STORAGE_KEYS.USERS)) {
    setItem(STORAGE_KEYS.USERS, []);
  }
  if (!getItem(STORAGE_KEYS.EVENTS)) {
    // Sample events for demonstration
    setItem(STORAGE_KEYS.EVENTS, [
      {
        id: '1',
        title: 'SMU Hackathon',
        description: 'Head down to SMU to compete in this exclusive hackathon and stand a chance to win attractive prizes!',
        location: 'Singapore Management University',
        startDate: '2025-12-25T09:00:00',
        endDate: '2025-12-27T18:00:00',
        organiserId: 'organiser1',
        organiserName: 'SMU Tech Club',
        interests: ['Technology', 'Programming', 'Competition'],
        capacity: 100,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Tech Industry Networking event',
        description: 'Join us for an exclusive Tech Industry Networking event on 20 November 2025 at Temasek Polytechnic from 4:15 PM – 6:30 PM!',
        location: 'Temasek Polytechnic',
        startDate: '2025-11-28T16:15:00',
        endDate: '2025-11-28T18:30:00',
        organiserId: 'organiser1',
        organiserName: 'TP Career Services',
        interests: ['Networking', 'Technology', 'Career'],
        capacity: 50,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'PayPal visit',
        description: 'Curious about how FinTech is applied in real companies such as PayPal? Find out by signing up for this company visit',
        location: 'Suntec City Tower 5',
        startDate: '2025-11-14T10:00:00',
        endDate: '2025-11-14T12:00:00',
        organiserId: 'organiser2',
        organiserName: 'FinTech Association',
        interests: ['FinTech', 'Finance', 'Technology'],
        capacity: 30,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
  if (!getItem(STORAGE_KEYS.SIGNUPS)) {
    setItem(STORAGE_KEYS.SIGNUPS, []);
  }
  if (!getItem(STORAGE_KEYS.REMINDERS)) {
    setItem(STORAGE_KEYS.REMINDERS, []);
  }
  if (!getItem(STORAGE_KEYS.INTERESTS)) {
    setItem(STORAGE_KEYS.INTERESTS, [
      'Technology',
      'Programming',
      'Competition',
      'Networking',
      'Career',
      'FinTech',
      'Finance',
      'Sports',
      'Music',
      'Art',
      'Business',
      'Entrepreneurship',
      'Design',
      'Marketing',
      'Data Science',
      'AI/ML',
      'Cybersecurity',
      'Healthcare',
      'Environment',
      'Social Impact',
    ]);
  }
};

// User operations
const userStorage = {
  getAll: () => getItem(STORAGE_KEYS.USERS) || [],
  
  getById: (id) => {
    const users = getItem(STORAGE_KEYS.USERS) || [];
    return users.find(user => user.id === id) || null;
  },
  
  getByEmail: (email) => {
    const users = getItem(STORAGE_KEYS.USERS) || [];
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  },
  
  create: (user) => {
    const users = getItem(STORAGE_KEYS.USERS) || [];
    users.push(user);
    return setItem(STORAGE_KEYS.USERS, users);
  },
  
  update: (id, updates) => {
    const users = getItem(STORAGE_KEYS.USERS) || [];
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return false;
    users[index] = { ...users[index], ...updates };
    return setItem(STORAGE_KEYS.USERS, users);
  },
  
  delete: (id) => {
    const users = getItem(STORAGE_KEYS.USERS) || [];
    const filtered = users.filter(user => user.id !== id);
    return setItem(STORAGE_KEYS.USERS, filtered);
  },
};

// Session operations
const sessionStorage = {
  getCurrentUser: () => getItem(STORAGE_KEYS.CURRENT_USER),
  
  setCurrentUser: (user) => setItem(STORAGE_KEYS.CURRENT_USER, user),
  
  clearCurrentUser: () => removeItem(STORAGE_KEYS.CURRENT_USER),
};

// Event operations
const eventStorage = {
  getAll: () => getItem(STORAGE_KEYS.EVENTS) || [],
  
  getById: (id) => {
    const events = getItem(STORAGE_KEYS.EVENTS) || [];
    return events.find(event => event.id === id) || null;
  },
  
  getByOrganiser: (organiserId) => {
    const events = getItem(STORAGE_KEYS.EVENTS) || [];
    return events.filter(event => event.organiserId === organiserId);
  },
  
  getByInterests: (interests) => {
    if (!interests || interests.length === 0) {
      return getItem(STORAGE_KEYS.EVENTS) || [];
    }
    const events = getItem(STORAGE_KEYS.EVENTS) || [];
    return events.filter(event => 
      event.interests.some(interest => interests.includes(interest))
    );
  },
  
  create: (event) => {
    const events = getItem(STORAGE_KEYS.EVENTS) || [];
    events.push(event);
    return setItem(STORAGE_KEYS.EVENTS, events);
  },
  
  update: (id, updates) => {
    const events = getItem(STORAGE_KEYS.EVENTS) || [];
    const index = events.findIndex(event => event.id === id);
    if (index === -1) return false;
    events[index] = { ...events[index], ...updates };
    return setItem(STORAGE_KEYS.EVENTS, events);
  },
  
  delete: (id) => {
    const events = getItem(STORAGE_KEYS.EVENTS) || [];
    const filtered = events.filter(event => event.id !== id);
    return setItem(STORAGE_KEYS.EVENTS, filtered);
  },
};

// Signup operations
const signupStorage = {
  getAll: () => getItem(STORAGE_KEYS.SIGNUPS) || [],
  
  getByUser: (userId) => {
    const signups = getItem(STORAGE_KEYS.SIGNUPS) || [];
    return signups.filter(signup => signup.userId === userId);
  },
  
  getByEvent: (eventId) => {
    const signups = getItem(STORAGE_KEYS.SIGNUPS) || [];
    return signups.filter(signup => signup.eventId === eventId);
  },
  
  getByUserAndEvent: (userId, eventId) => {
    const signups = getItem(STORAGE_KEYS.SIGNUPS) || [];
    return signups.find(signup => signup.userId === userId && signup.eventId === eventId) || null;
  },
  
  create: (signup) => {
    const signups = getItem(STORAGE_KEYS.SIGNUPS) || [];
    signups.push(signup);
    return setItem(STORAGE_KEYS.SIGNUPS, signups);
  },
  
  delete: (userId, eventId) => {
    const signups = getItem(STORAGE_KEYS.SIGNUPS) || [];
    const filtered = signups.filter(
      signup => !(signup.userId === userId && signup.eventId === eventId)
    );
    return setItem(STORAGE_KEYS.SIGNUPS, filtered);
  },
};

// Reminder operations
const reminderStorage = {
  getAll: () => getItem(STORAGE_KEYS.REMINDERS) || [],
  
  getByUser: (userId) => {
    const reminders = getItem(STORAGE_KEYS.REMINDERS) || [];
    return reminders.filter(reminder => reminder.userId === userId);
  },
  
  getPending: (userId) => {
    const reminders = getItem(STORAGE_KEYS.REMINDERS) || [];
    return reminders.filter(
      reminder => reminder.userId === userId && !reminder.dismissed && !reminder.sent
    );
  },
  
  create: (reminder) => {
    const reminders = getItem(STORAGE_KEYS.REMINDERS) || [];
    reminders.push(reminder);
    return setItem(STORAGE_KEYS.REMINDERS, reminders);
  },
  
  update: (id, updates) => {
    const reminders = getItem(STORAGE_KEYS.REMINDERS) || [];
    const index = reminders.findIndex(reminder => reminder.id === id);
    if (index === -1) return false;
    reminders[index] = { ...reminders[index], ...updates };
    return setItem(STORAGE_KEYS.REMINDERS, reminders);
  },
  
  markAsSent: (id) => {
    return reminderStorage.update(id, { sent: true, sentAt: new Date().toISOString() });
  },
  
  dismiss: (id) => {
    return reminderStorage.update(id, { dismissed: true });
  },
  
  deleteByEvent: (eventId) => {
    const reminders = getItem(STORAGE_KEYS.REMINDERS) || [];
    const filtered = reminders.filter(reminder => reminder.eventId !== eventId);
    return setItem(STORAGE_KEYS.REMINDERS, filtered);
  },
};

// Interest operations
const interestStorage = {
  getAll: () => getItem(STORAGE_KEYS.INTERESTS) || [],
  
  add: (interest) => {
    const interests = getItem(STORAGE_KEYS.INTERESTS) || [];
    if (!interests.includes(interest)) {
      interests.push(interest);
      return setItem(STORAGE_KEYS.INTERESTS, interests);
    }
    return true;
  },
};

export {
  STORAGE_KEYS,
  initializeStorage,
  userStorage,
  sessionStorage,
  eventStorage,
  signupStorage,
  reminderStorage,
  interestStorage,
};
