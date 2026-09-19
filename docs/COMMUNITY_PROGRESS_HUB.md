# Community Progress Hub & Multi-User Tracking

GitPulse includes a full **Community & Team Progress Directory** enabling developers to explore and compare project milestone progress across multiple GitHub users, switch between developer portfolios in real time, and request progress inspections for any GitHub account.

---

## 1. Overview & Architecture

### Key Capabilities
1. **Multi-User Directory**:
   - A dedicated **"Community"** view displays all tracked developers in a visual leaderboard ranked by portfolio completion rate.
   - Shows live statistics: Total Repositories, Version 1.0 Shipped, Completed Milestones, Overall Completion Rate %, and Primary Tech Stack tags.
2. **Instant Portfolio Switching**:
   - Click **"View Dashboard"** on any developer in the directory to instantly load their repositories, interactive SVG donut charts, and task checklists.
   - A contextual **Guest Mode Banner** indicates whose portfolio is currently loaded, with a 1-click button to return to your personal projects.
3. **"Request / Inspect User Progress"**:
   - Anyone can input any GitHub username (e.g. a teammate, contributor, or collaborator).
   - Enter your name and an optional note (e.g., *"Checking your project completion rate"*).
   - GitPulse queries GitHub's API live, scans all public repositories and markdown files, executes the auto-detection engine, records the progress request, and adds them to the directory.
4. **Instant Reactive Stats Sync**:
   - Fixes metric card lag: All top-level KPI cards (`StatsOverview`) are reactively derived using `useMemo` from the loaded repository collection.
   - Eliminates race conditions so metrics match the donut graph with 100% mathematical consistency without async delay.

---

## 2. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users` | Returns list of all tracked developers, sorted by completion percentage. |
| `POST` | `/api/users/track` | Body: `{ username }`. Fetches profile and repos, runs auto-detection, and saves user to directory. |
| `GET` | `/api/users/requests` | Returns recent progress check requests. |
| `POST` | `/api/users/requests` | Body: `{ targetUsername, requesterName, message }`. Logs progress check request, auto-inspects target user, and returns progress summary. |
| `GET` | `/api/repos?username={user}` | Returns `{ repos, stats, cached }` for the specified user and auto-saves them to the directory. |

---

## 3. Storage Model (`data/projects.json`)

```json
{
  "settings": {
    "githubUsername": "harshjsh01",
    "githubToken": "...",
    "lastSync": "2026-09-19T18:12:44.637Z"
  },
  "trackedUsers": {
    "harshjsh01": {
      "username": "harshjsh01",
      "name": "Harsh Joshi",
      "avatar_url": "https://avatars.githubusercontent.com/u/99012205?v=4",
      "bio": "B.Tech CS student | Passionate about Python, C++...",
      "totalRepos": 36,
      "v1Complete": 12,
      "completed": 10,
      "completionPercentage": 61,
      "topLanguages": ["JavaScript", "TypeScript", "Python"],
      "lastInspected": "2026-09-19T18:12:44.637Z"
    }
  },
  "progressRequests": [
    {
      "id": "req_mu8ph4bnux12",
      "targetUsername": "harshjsh02",
      "requesterName": "Harsh Joshi",
      "message": "Checking your project progress",
      "status": "completed",
      "createdAt": "2026-09-19T18:13:18.755Z"
    }
  ]
}
```

---

## 4. UI Components

- **`client/src/components/UserDirectory.jsx`**: Leaderboard grid, search filter, and recent requests feed.
- **`client/src/components/RequestProgressModal.jsx`**: Interactive modal to submit a progress check request for any GitHub handle.
- **`client/src/components/Navbar.jsx`**: View switch tabs (Projects vs Community), user switcher dropdown, and Request Progress button.
- **`client/src/App.jsx`**: Reactive state management, guest mode banner, and seamless user switching.
