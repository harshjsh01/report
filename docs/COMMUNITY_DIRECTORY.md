# Community User Directory & Peer Progress Check

GitPulse provides a multi-developer **Community Directory** and **Peer Progress Check** engine that allows developers, team members, and open-source collaborators to explore each other's project completion status, inspect detailed project metrics, and request progress reviews in real-time.

---

## 🌟 Key Features

### 1. Centralized Community User Directory
- Located under the **Community** tab in the main navigation.
- Shows all tracked developers with:
  - GitHub Avatar, Name, and `@username`.
  - Portfolio Completion Rate % (e.g., 61%, 80%, 100%).
  - Total Repositories, Version 1.0 Shipped Count, and Fully Completed Count.
  - Top Programming Languages used across their public projects.
  - **Inspect Progress Dashboard**: 1-click button to view any developer's full interactive portfolio, status donut chart, and project cards.

### 2. Request / Inspect Progress
- Any user can enter a target GitHub username (e.g., a peer, team lead, or open-source contributor) and their own name.
- GitPulse connects live to GitHub:
  - Fetches the user profile (`avatar_url`, `bio`, `public_repos`).
  - Fetches all their repositories.
  - Evaluates every repository against the **Automatic Intelligence Detection Engine** (`v1_complete`, `completed`, `needs_polish`, `in_progress`).
  - Computes their overall completion rate.
  - Adds or updates the developer in the shared Community Directory.
  - Logs the request in the **Recent Progress Check Activity** feed.

### 3. Peer Viewing Mode & Return Action
- When inspecting another user's dashboard, an active indicator banner appears at the top:
  `"Inspecting portfolio for @username — [Return to My Dashboard]"`
- Clicking **Return to My Dashboard** instantly restores your own project dashboard.

---

## 🔌 API Endpoints

### `GET /api/users`
Returns list of all tracked developers sorted by completion percentage and total projects.
```json
{
  "users": [
    {
      "username": "harshjsh01",
      "name": "Harsh Joshi",
      "avatar_url": "https://avatars.githubusercontent.com/u/99012205?v=4",
      "totalRepos": 36,
      "v1Complete": 12,
      "completed": 10,
      "inProgress": 12,
      "needsPolish": 2,
      "completionPercentage": 61,
      "topLanguages": ["JavaScript", "TypeScript", "Python", "Plain Text"]
    }
  ]
}
```

### `POST /api/users/request-check`
Submits a peer progress inspection request.
**Request Body**:
```json
{
  "targetUsername": "harshjsh01",
  "requesterName": "Tech Lead",
  "message": "Reviewing progress for version 1.0 milestone"
}
```
**Response**:
```json
{
  "success": true,
  "user": { ... },
  "request": {
    "id": "req_1a2b3c",
    "targetUsername": "harshjsh01",
    "requesterName": "Tech Lead",
    "message": "Reviewing progress for version 1.0 milestone",
    "status": "completed",
    "createdAt": "2026-09-20T00:28:30.000Z",
    "resultsSnapshot": {
      "totalRepos": 36,
      "v1Complete": 12,
      "completed": 10,
      "completionPercentage": 61
    }
  },
  "stats": { ... }
}
```

### `GET /api/progress-requests`
Returns the recent feed of progress check requests.
