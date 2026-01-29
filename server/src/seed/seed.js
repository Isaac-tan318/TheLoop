import dotenv from 'dotenv';
dotenv.config();
import Event from '../models/Event.js';
import mongoose from 'mongoose';

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function futureDate(daysAhead, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// Curated real image URLs (Unsplash)
const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1551836022-5dc58f6a07fe?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1556103255-444b32036fc7?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1543128639-b5d14b6dc5cf?auto=format&fit=crop&w=1200&q=60',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=60'
];

function makeMockEvents(count = 3) {
  const locations = ['Main Hall A', 'Student Center', 'Auditorium B', 'Lab 3', 'Online', 'Campus Green', 'City Park Pavilion'];
  const EVENT_TEMPLATES = [
    {
      title: 'Community Garden Day',
      description: 'Join neighbors to plant, compost, and swap tips for a greener block.',
      interests: ['community', 'sustainability', 'food'],
    },
    {
      title: 'Wellness & Yoga Retreat',
      description: 'Restore your energy with guided yoga flows, breathwork, and healthy bites.',
      interests: ['wellness', 'social', 'community'],
    },
    {
      title: 'Film Appreciation Night',
      description: 'Screen indie shorts, then dive into a lively discussion with local critics.',
      interests: ['arts', 'culture', 'social'],
    },
    {
      title: 'Jazz & Poetry Evening',
      description: 'Experience smooth jazz sets paired with spoken-word performances.',
      interests: ['music', 'arts', 'culture'],
    },
    {
      title: 'Sustainability Summit',
      description: 'Hear innovators share practical climate solutions for campuses and cities.',
      interests: ['sustainability', 'science', 'business'],
    },
    {
      title: 'Charity Fun Run',
      description: 'Run, jog, or cheer to raise funds for local youth programs.',
      interests: ['sports', 'community', 'social'],
    },
    {
      title: 'Artisan Food Market',
      description: 'Taste small-batch treats and learn from chefs behind the flavors.',
      interests: ['food', 'culture', 'business'],
    },
    {
      title: 'Esports Showdown',
      description: 'Compete in bracketed tournaments with shoutcasters and prizes.',
      interests: ['gaming', 'technology', 'social'],
    },
    {
      title: 'Photography Walk',
      description: 'Capture golden-hour shots with coaching from pro photographers.',
      interests: ['arts', 'community', 'social'],
    },
    {
      title: 'Cultural Heritage Fair',
      description: 'Celebrate traditions through dance, food, and storytelling booths.',
      interests: ['culture', 'community', 'food'],
    },
    {
      title: 'Outdoor Adventure Clinic',
      description: 'Learn trail basics, gear essentials, and safety tips before a mini hike.',
      interests: ['sports', 'wellness', 'sustainability'],
    },
    {
      title: 'Mindfulness & Meditation Workshop',
      description: 'Practice grounding techniques to manage stress between semesters.',
      interests: ['wellness', 'social', 'community'],
    },
    {
      title: 'Street Food Fiesta',
      description: 'Sample global bites while local DJs keep the plaza moving.',
      interests: ['food', 'culture', 'social'],
    },
    {
      title: 'Indie Game Showcase',
      description: 'Test unreleased titles and chat with developers about their creative process.',
      interests: ['gaming', 'technology', 'arts'],
    },
    {
      title: 'Latin Dance Social',
      description: 'Pick up salsa footwork, then stay for the open-floor dance party.',
      interests: ['music', 'culture', 'social'],
    },
    {
      title: 'STEM for Kids Expo',
      description: 'Families explore hands-on science booths and kid-friendly demos.',
      interests: ['science', 'technology', 'community'],
    },
    {
      title: 'Local Makers Pop-Up',
      description: 'Support artisans selling prints, ceramics, textiles, and zines.',
      interests: ['arts', 'business', 'community'],
    },
    {
      title: 'Creative Writing Circle',
      description: 'Workshop short pieces with peers and leave with fresh prompts.',
      interests: ['arts', 'social', 'community'],
    },
    {
      title: 'Sustainable Fashion Swap',
      description: 'Refresh your closet by trading garments and learning upcycling tips.',
      interests: ['sustainability', 'culture', 'community'],
    },
    {
      title: 'International Potluck Picnic',
      description: 'Share a favorite dish and the story behind it on the campus green.',
      interests: ['food', 'culture', 'community'],
    },
  ];

  const events = [];
  for (let i = 0; i < count; i++) {
    const start = futureDate(randomInt(3, 30), randomInt(9, 18));
    const end = new Date(start.getTime() + randomInt(1, 4) * 60 * 60 * 1000);
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];

    // Build additionalFields consistent with frontend
    const additionalFields = [
      {
        id: 'experience',
        label: 'Experience Level',
        type: 'select',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced'].join(',')
      },
      {
        id: 'dietary',
        label: 'Dietary Requirements',
        type: 'select',
        required: false,
        options: ['None', 'Vegetarian', 'Vegan', 'Halal'].join(',')
      },
      {
        id: 'notes',
        label: 'Notes for organiser',
        type: 'textarea',
        required: false
      }
    ];

    events.push({
      title: `${template.title} ${new Date().getFullYear()}`,
      description: template.description,
      location: randomItem(locations),
      startDate: start,
      endDate: end,
      organiserId: 'user-2',
      organiserName: 'Jane Smith',
      interests: template.interests.slice(0, 2),
      capacity: randomInt(30, 150),
      signupCount: 0,
      imageUrl: IMAGE_URLS[i % IMAGE_URLS.length],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return events;
}

async function run() {
  const MONGO_URI = process.env.MONGO_URI;
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB, ', mongoose.connection.name);

  // Ensure we are working with a standard collection (not time-series)
  const eventsCollectionName = Event.collection.name;
  const existingCollection = await mongoose.connection.db.listCollections({ name: eventsCollectionName }).next();
  if (existingCollection?.options?.timeseries) {
    console.warn('Events collection is time-series; dropping so it can be recreated as a standard collection.');
    await mongoose.connection.db.dropCollection(eventsCollectionName);
    await mongoose.connection.db.createCollection(eventsCollectionName);
  }

  console.log('Clearing events...');
  await Event.deleteMany({});

  const mockEvents = makeMockEvents(10);
  console.log(`Inserting ${mockEvents.length} mock events...`);
  await Event.insertMany(mockEvents, { ordered: false });

  console.log('Seeding complete: events only');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
