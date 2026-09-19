# 🏛️ GitPulse Architecture & System Design

GitPulse is a full-stack developer portfolio intelligence platform designed to audit, track, and drive GitHub repositories toward **Version 1.0 Production Completion**.

---

## 📐 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GitPulse Frontend (React 18)                     │
│  ┌───────────────────────────┐  ┌───────────────────────────────────┐  │
│  │   Interactive Graphs      │  │        Kanban & Grid Views        │  │
│  │  - Status Donut (Filter)  │  │  - Real-time Stage Progression    │  │
│  │  - Project Matrix (Click) │  │  - "Committed by You" Indicators  │  │
│  │  - Tech Stack Breakdown   │  │  - Live App Deployment Links      │  │
│  └─────────────┬─────────────┘  └─────────────────┬─────────────────┘  │
│                │                                  │                    │
│  ┌─────────────▼──────────────────────────────────▼─────────────────┐  │
│  │                 Project Deep-Dive Modal Drawer                   │  │
│  │  - Multi-Markdown Reader (TODO, CONTEXT, ERRORS, LOGS, README)   │  │
│  │  - Pull Requests (Merged, Open, Closed)                          │  │
│  │  - Issues with Labels & Comments                                 │  │
│  │  - GitHub Actions CI Status & Language Breakdown                 │  │
│  │  - 1-Click v1.0 Release Engine with Fireworks                    │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ REST API (/api/*)
┌────────────────────────────────────▼───────────────────────────────────┐
│                     GitPulse Backend (Express.js)                      │
│  ┌───────────────────────────┐  ┌───────────────────────────────────┐  │
│  │      GitHub Service       │  │   Auto-Completion Engine (AI)     │  │
│  │  - Dynamic Auth (/user)   │  │  - Live URL Deployment Check      │  │
│  │  - Multi-page Pagination  │  │  - v1.0+ Tag & Release Validator  │  │
│  │  - Markdown Tree Scanner  │  │  - Checkbox Task Ratio Analyzer   │  │
│  │  - Rate-limit Resilience  │  │  - Issue Closure & Recency Audit  │  │
│  └─────────────┬─────────────┘  └─────────────────┬─────────────────┘  │
│                │                                  │                    │
│  ┌─────────────▼──────────────────────────────────▼─────────────────┐  │
│  │                  Local Storage Engine (JSON)                     │  │
│  │  - Preserves user custom tasks, priorities, notes, & overrides   │  │
│  │  - Zero hardcoding: works dynamically for any user account       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS
┌────────────────────────────────────▼───────────────────────────────────┐
│                           GitHub REST API v3                           │
│     /user, /user/repos, /repos/{owner}/{repo}/contents, /pulls, etc.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Modules

### 1. GitHub Service (`server/src/github.js`)
- **Dynamic Authentication**: Queries `/user` to dynamically resolve the authenticated user's login and profile without hardcoding.
- **Repository Aggregator**: Combines direct user repositories, private repositories, organization repositories (`/user/orgs`), and external contributions from public events.
- **Tree Scanner**: Recursively scans repository file trees for markdown documents (`.md`).
- **Activity Inspector**: Checks commits authored by the user to populate the "Committed by you" indicator.

### 2. Auto-Completion Engine (`server/src/github.js` & `server/src/index.js`)
- Runs rule-based heuristics on every repository to automatically classify its status into:
  - 🏆 `v1_complete`
  - ✅ `completed`
  - 🔍 `needs_polish`
  - 🚀 `in_progress`
  - 📦 `archived`
- Computes weighted health scores (0-100%) taking into account documentation, issue closure rate, CI build passing status, and deployment availability.

### 3. Local Storage Manager (`server/src/storage.js`)
- Persists user notes, completion checklists, target dates, and custom statuses locally in `server/data/projects.json`.
- Separates runtime user data from source code, ensuring the project can be cloned and shared with anyone without sharing personal tokens or projects.

### 4. Reactive Web Dashboard (`client/`)
- Built with **React 18**, **Vite**, and **Tailwind CSS**.
- Pure SVG reactive charts that propagate filters and selections to the repository list.
- Stage-based Kanban drag-and-drop workflow.
