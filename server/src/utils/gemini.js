
//  Google Gemini API integration for text embeddings
//  Used for AI-powered event suggestions

//  Free tier: 60 requests/min, 1,500 requests/day
//  Model: gemini-embedding-001 (768 dimensions)
 
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';


// Get embedding vector for text

export async function getEmbedding(text) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const response = await fetch(
    `${API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// Get embeddings for multiple texts in batch
// Actual calling of gemini API
 
export async function getBatchEmbeddings(texts) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const response = await fetch(
    `${API_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
        })),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.embeddings.map((e) => e.values);
}


 // Calculate cosine similarity between two vectors

export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}


// Build a text representation of a user's profile for embedding

export function buildUserProfileText(user) {
  const parts = [];
  
  if (user.interests?.length) {
    parts.push(`Interested in: ${user.interests.join(', ')}`);
  }
  
  if (user.role) {
    parts.push(`Role: ${user.role}`);
  }

  if (user.pastSignupInterests?.length) {
    const uniqueSignupTopics = [...new Set(user.pastSignupInterests)].slice(0, 5);
    parts.push(`Recently signed up for events about: ${uniqueSignupTopics.join(', ')}`);
  }

  // Add recent search history (last 5 queries)

  if (user.searchHistory?.length) {
    const recentSearches = user.searchHistory
      .slice(-5)
      .map(h => h.query)
      .join(', ');
    parts.push(`Recently searched for: ${recentSearches}`);
  }

  // Add recent view history (last 5 event titles)
  if (user.viewHistory?.length) {
    const recentViews = user.viewHistory
      .slice(-5)
      .map(h => h.eventTitle)
      .filter(Boolean)
      .join(', ');
    if (recentViews) {
      parts.push(`Recently viewed events: ${recentViews}`);
    }
  }

  return parts.join('. ') || 'General user looking for events';
}

// Build a text representation of an event for embedding

export function buildEventText(event) {
  const parts = [];
  
  if (event.title) {
    parts.push(event.title);
  }
  
  if (event.description) {
    parts.push(event.description);
  }
  
  if (event.interests?.length) {
    parts.push(`Topics: ${event.interests.join(', ')}`);
  }
  
  if (event.location) {
    parts.push(`Location: ${event.location}`);
  }

  return parts.join('. ') || 'Event';
}

// Rank events by similarity to user profile

export async function rankEventsByUserProfile(user, events, topN = 10) {
  if (!events.length) return [];

  // Build text representations
  const userText = buildUserProfileText(user);
  const eventTexts = events.map(buildEventText);

  // Get embeddings (user + all events in one batch for efficiency)
  const allTexts = [userText, ...eventTexts];

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Gemini] User profile text:', userText);
    console.log('[Gemini] Event texts sample:', eventTexts.slice(0, 3));
  }

  const embeddings = await getBatchEmbeddings(allTexts);

  const userEmbedding = embeddings[0];
  const eventEmbeddings = embeddings.slice(1);

  // Calculate similarity scores
  const scoredEvents = events.map((event, i) => ({
    ...event,
    similarityScore: cosineSimilarity(userEmbedding, eventEmbeddings[i]),
  }));

  // Sort by similarity (highest first) and return top N
  scoredEvents.sort((a, b) => b.similarityScore - a.similarityScore);
  return scoredEvents.slice(0, topN);
}

export default {
  getEmbedding,
  getBatchEmbeddings,
  cosineSimilarity,
  buildUserProfileText,
  buildEventText,
  rankEventsByUserProfile,
};
