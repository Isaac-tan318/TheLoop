
//  Google Gemini API integration for text embeddings
//  Used for AI-powered event suggestions

//  Free tier: 60 requests/min, 1,500 requests/day
//  Model: gemini-embedding-001 (3072 dimensions)
 
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


// Build a text representation of a user's profile for embedding

export function buildUserProfileText(user, options = {}) {
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

  // Add topics from highly rated events (4-5 stars)
  if (options.positiveReviewTopics?.length) {
    parts.push(`User highly enjoyed: ${options.positiveReviewTopics.join(', ')}`);
  }

  

  // Add recent search history (last 5 queries)

  if (user.searchHistory?.length) {
    const recentSearches = user.searchHistory
      .slice(-5)
      .map(h => h.query)
      .join(', ');
    parts.push(`Recently searched for: ${recentSearches}`);
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

export default {
  getEmbedding,
  buildUserProfileText,
  buildEventText,
};
