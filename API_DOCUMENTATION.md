# TheLoop Backend API Documentation

Base URL: `http://localhost:3001/api` (configurable via `VITE_API_URL` env variable)

## Authentication

All authenticated routes require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Auth Routes

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "student",
  "interests": ["technology", "career", "networking"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password (min 6 characters) |
| name | string | Yes | User's display name |
| role | string | Yes | Either "student" or "organiser" |
| interests | string[] | No | Array of interest tags |

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "interests": ["technology", "career"],
    "createdAt": "2026-01-04T10:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

---

### POST /api/auth/login
Login an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "interests": ["technology", "career"],
    "createdAt": "2026-01-04T10:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

---

### POST /api/auth/logout
Logout the current user. (Auth required)

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
Get current user profile. (Auth required)

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "interests": ["technology", "career"],
  "eventsSignedUp": ["event-id-1", "event-id-2"],
  "createdAt": "2026-01-04T10:00:00.000Z"
}
```

---

### PUT /api/auth/profile
Update user profile. (Auth required)

**Request Body:**
```json
{
  "name": "Updated Name",
  "interests": ["technology", "career", "sports"]
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Updated Name",
  "role": "student",
  "interests": ["technology", "career", "sports"],
  "createdAt": "2026-01-04T10:00:00.000Z",
  "updatedAt": "2026-01-04T12:00:00.000Z"
}
```

---

### PUT /api/auth/password
Change user password. (Auth required)

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

---

## Events Routes

### GET /api/events
Get all events with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| interests | string | Comma-separated interest tags |
| searchQuery | string | Search in title, description, location |
| startDate | string | ISO date - filter events starting after |
| endDate | string | ISO date - filter events starting before |

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Event Title",
    "description": "Event description",
    "location": "Event Location",
    "startDate": "2026-01-15T09:00:00.000Z",
    "endDate": "2026-01-15T17:00:00.000Z",
    "organiserId": "organiser-uuid",
    "organiserName": "Organiser Name",
    "interests": ["technology", "career"],
    "capacity": 100,
    "signupCount": 45,
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": "2026-01-01T10:00:00.000Z"
  }
]
```

---

### GET /api/events/:id
Get a single event by ID.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Event Title",
  "description": "Event description",
  "location": "Event Location",
  "startDate": "2026-01-15T09:00:00.000Z",
  "endDate": "2026-01-15T17:00:00.000Z",
  "organiserId": "organiser-uuid",
  "organiserName": "Organiser Name",
  "interests": ["technology", "career"],
  "capacity": 100,
  "signupCount": 45,
  "isFull": false,
  "isSignedUp": true,
  "imageUrl": "https://example.com/image.jpg",
  "createdAt": "2026-01-01T10:00:00.000Z"
}
```

---

### GET /api/events/organiser
Get events created by the current organiser. (Auth required - Organiser only)

**Response (200):** Array of event objects

---

### POST /api/events
Create a new event. (Auth required - Organiser only)

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "location": "Event Location",
  "startDate": "2026-01-15T09:00:00.000Z",
  "endDate": "2026-01-15T17:00:00.000Z",
  "interests": ["technology", "career"],
  "capacity": 100,
  "imageUrl": "https://example.com/image.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Event title |
| description | string | Yes | Event description |
| location | string | Yes | Event location |
| startDate | string | Yes | ISO date - Event start time |
| endDate | string | Yes | ISO date - Event end time |
| interests | string[] | No | Interest tags for filtering |
| capacity | number | No | Max attendees (default: 50) |
| imageUrl | string | No | Event image URL |

**Response (201):** Created event object

---

### PUT /api/events/:id
Update an event. (Auth required - Organiser owner only)

**Request Body:** Any event fields to update

**Response (200):** Updated event object

---

### DELETE /api/events/:id
Delete an event. (Auth required - Organiser owner only)

**Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

---

### POST /api/events/:id/signup
Sign up for an event. (Auth required)

**Response (201):**
```json
{
  "id": "signup-uuid",
  "eventId": "event-uuid",
  "userId": "user-uuid",
  "signedUpAt": "2026-01-04T10:00:00.000Z"
}
```

---

### DELETE /api/events/:id/signup
Cancel signup for an event. (Auth required)

**Response (200):**
```json
{
  "message": "Signup cancelled successfully"
}
```

---

### GET /api/events/signups
Get current user's signed up events. (Auth required)

**Response (200):** Array of event objects with `signedUpAt` field

---

### GET /api/events/:id/signup/status
Check if current user is signed up for an event. (Auth required)

**Response (200):**
```json
{
  "isSignedUp": true
}
```

---

### GET /api/events/:id/signups
Get all signups for an event. (Auth required - Organiser owner only)

**Response (200):**
```json
[
  {
    "id": "signup-uuid",
    "eventId": "event-uuid",
    "userId": "user-uuid",
    "userName": "User Name",
    "userEmail": "user@example.com",
    "signedUpAt": "2026-01-04T10:00:00.000Z"
  }
]
```

---

## Reminders Routes

### GET /api/reminders
Get all reminders for current user. (Auth required)

**Response (200):**
```json
[
  {
    "id": "reminder-uuid",
    "eventId": "event-uuid",
    "userId": "user-uuid",
    "eventTitle": "Event Title",
    "eventStart": "2026-01-15T09:00:00.000Z",
    "reminderTime": "2026-01-14T09:00:00.000Z",
    "sent": false,
    "dismissed": false,
    "event": { }
  }
]
```

---

### GET /api/reminders/pending
Get pending reminders that should be shown now. (Auth required)

**Response (200):** Array of reminder objects

---

### PUT /api/reminders/:id/sent
Mark a reminder as sent. (Auth required)

**Response (200):**
```json
{
  "message": "Reminder marked as sent"
}
```

---

### PUT /api/reminders/:id/dismiss
Dismiss a reminder. (Auth required)

**Response (200):**
```json
{
  "message": "Reminder dismissed"
}
```

---

## Interests Routes

### GET /api/interests
Get all available interests.

**Response (200):**
```json
[
  "technology",
  "career",
  "networking",
  "sports",
  "arts",
  "music",
  "business",
  "science",
  "health",
  "social"
]
```

---

### POST /api/interests
Add a new interest. (Auth required - Admin/Organiser)

**Request Body:**
```json
{
  "name": "new-interest"
}
```

**Response (201):** Updated array of all interests

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error
