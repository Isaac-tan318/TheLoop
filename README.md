The Loop is An event discovery platform that helps students find events they'll actually enjoy, powered by AI-driven personalized recommendations.


## Additional Feature: AI Event Recommendations

TheLoop learns what each user likes and recommends events tailored to their preferences. The more a user interacts with the platform, the smarter recommendations become.

### How It Works

The recommendation system works in three stages:

### Stage 1: Understanding the User

The system builds a picture of each user's preferences by looking at:

- **Their Interests** – The topics they selected when signing up (e.g., "Python", "Networking", "Career Development")
- **Events They've Signed Up For** – If a user keeps signing up for hackathons, they probably want to see more hackathons
- **Good reviews** – Events they gave 4-5 stars show strong interest in those topics
- **Recent Searches** – If they searched for "machine learning", they're likely interested in more ML events
- **Events They've Viewed** – Browsing behavior shows what catches their attention

All of this information is combined into a single text that describes what the user is looking for.

### Stage 2: Finding Matching Events

Using Google's Gemini AI (Gemini-embedding-001), the user text profile and every event are converted into embeddings, vectors with thousands of dimensions that are numerical representations that capture meaning. Events with similar meanings to the user's profile will have similar embeddings.

Using MongoDB Atlas Vector Search, the similarity between the user's vector and the events' vectors are calcualted using cosine similarity. This is semantic matching, as it understands that someone interested in "web development" might also enjoy a "React workshop" even if those exact words weren't used.

Only upcoming events with open signups are calculated.

### Stage 3: Fine-tuning with boosts

The AI results are then adjusted based on specific user behaviors:

**Matching Interests** - Events tagged with the user's interests get a boost 
**Familiar Organizers** - If a user enjoyed an organiser's events before, the organiser's new events rank higher 
**Recent Searches** - Events matching what the user just searched for appear higher 
**Recently Viewed** - Events the user looked at recently get a small boost 

### When AI Isn't Available

If the AI service is unavailable, or if a new user hasn't provided enough information yet, the system falls back to simpler methods:

- **Users with interests**: Events are ranked by how well their tags match the user's selected interests
- **New users**: Popular events (those with more signups) and upcoming events are shown first