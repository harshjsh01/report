# 🚀 GitPulse — GitHub Project Progress & Completion Hub

> An automated GitHub portfolio progress tracker, completion hub, and community directory. Connect your GitHub repositories, inspect **all markdown specs (`TODO.md`, `CONTEXT.md`, `ERRORS.md`, `LOGS.md`, `README.md`)**, audit all **Pull Requests & Issues**, detect whether you have committed to each project, and drive every repository to **"Complete"** or **"Version 1.0 Complete"**!

---

## 🌟 Key Capabilities

### 1. 📂 Complete Multi-Markdown Scanner
- Discovers and reads **every `.md` file** in your repository (root, `docs/`, `.github/`, `notes/`):
  - 📋 **TODO / Tasks**: `TODO.md`, `TASKS.md` — extracts markdown `- [ ]` and `- [x]` checkboxes.
  - 💡 **Context & Architecture**: `CONTEXT.md`, `NOTES.md` — parses outlines and technical specifications.
  - ⚠️ **Errors & Bugs**: `ERRORS.md`, `BUGS.md` — tracks known issues and resolution status.
  - 📜 **Logs & History**: `LOGS.md`, `CHANGELOG.md` — historical release notes and updates.
  - 🗺️ **Roadmap**: `ROADMAP.md` — project milestones.
  - 📖 **Documentation**: `README.md`, `CONTRIBUTING.md`.
- Read and inspect the full content of any discovered document directly from the dashboard!

### 2. 👥 Community Progress Directory & Peer Checks
- **Community Hub**: Browse and search all tracked developers and team members.
- **Peer Check Requests**: 1-click audit of any peer or collaborator's public repositories, computing completion percentage and technology stack in real time.
- **Activity Feed**: View recent progress checks logged across the community.

### 3. 🎨 System Theme & Light Theme Support
- **Automatic OS Detection**: Detects your operating system's color scheme (`prefers-color-scheme: light/dark`) by default.
- **Light Theme**: Clean, accessible high-contrast palette with soft backgrounds and emerald accents.
- **Dark Theme**: Midnight palette designed for low-light coding sessions.
- **Theme Switcher**: 1-click toggle in the navbar between **System**, **Light**, and **Dark** modes.

### 4. 🔍 Comprehensive PR & Issue Audit
- **Pull Requests**: Inspects all open, merged, and closed PRs with review status, author avatars, and links.
- **Issues**: Tracks all open and closed issues, labels (bugs, enhancements), and discussion comment counts.
- **Milestones**: Monitors GitHub Milestones with percentage completion progress bars.

### 5. 💻 Contribution & Commit Verification
- **"Committed by You" Detector**:
  - Automatically identifies whether you have committed to each repository.
  - Discovers repositories you own, collaborate on, or contributed to externally.
  - Filter by:
    - 🟢 **Committed by You** (active contributions)
    - ⚪ **No Commits by You Yet** (unstarted or scaffolded repos)
    - 🤝 **External Contributions & Collaborations**

### 6. 🏆 Drive to Completion & Version 1.0
- **Project Statuses**:
  - 🚀 **In Progress**
  - 🔍 **Needs Polish**
  - ⏸️ **Paused / On Hold**
  - 🏆 **Version 1.0 Complete**
  - ✅ **Completed (100% Done)**
  - 📦 **Archived**
- **Custom Completion Checklist**: Add bespoke sub-tasks per project to close the gap between 90% and 100%.
- **1-Click Official GitHub v1.0.0 Release**: Tag and publish an official GitHub Release with release notes and attach the `v1-completed` repo topic.
- **Celebration Fireworks**: Confetti bursts when marking projects as v1 Complete or Done!

---

## 🛠️ Quick Start

### 1. Install & Run
```bash
# Clone the repository
git clone https://github.com/harshjsh01/report.git
cd report

# Install dependencies for root, server, and client
npm run install-all

# Start both backend and frontend concurrently
npm run dev
```

- **Vite Dev Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

### 2. Build for Production
```bash
# Build frontend
npm run build

# Start production server (serves frontend + API on single port)
npm start
```
Open `http://localhost:5000`.

---

## 🚀 Deployment

GitPulse can be deployed to any cloud provider in minutes with **zero hardcoding**:

- **Render**: One-click blueprint with `render.yaml` (free tier supported).
- **Railway**: Automatic Dockerfile detection.
- **Fly.io**: Global microVM deploy via `fly launch`.
- **Docker**: Containerized deployment with multi-stage `Dockerfile` and `docker-compose.yml`.
- **VPS (Ubuntu/Debian)**: PM2 + Nginx reverse proxy.

👉 See the complete [Deployment & Community Distribution Guide](docs/DEPLOYMENT.md) for full instructions.

---

## 📁 Project Architecture

```
.
├── client/                     # Vite + React 18 + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header, search, tabs, sync, settings & theme
│   │   │   ├── ThemeToggle.jsx         # System / Light / Dark mode switcher
│   │   │   ├── StatsOverview.jsx       # Portfolio KPIs & completion rate
│   │   │   ├── ProgressGraph.jsx       # Interactive SVG donut, matrix & stack
│   │   │   ├── ProjectCard.jsx         # Card with commit badge & quick status
│   │   │   ├── ProjectDetailModal.jsx  # Tabs: Specs, PRs, Issues, Commits, CI, v1
│   │   │   ├── KanbanView.jsx          # Stage-based Kanban board
│   │   │   ├── UserDirectory.jsx       # Community progress directory
│   │   │   ├── RequestProgressModal.jsx# Peer progress inspection modal
│   │   │   ├── SettingsModal.jsx       # GitHub username & PAT setup
│   │   │   └── GithubIcon.jsx          # Crisp GitHub mark
│   │   ├── utils/
│   │   │   ├── confetti.js             # Confetti celebration bursts
│   │   │   └── theme.js                # System theme detection & OS listener
│   │   ├── App.jsx                     # State coordination & filtering
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── index.js            # Express API & unified static server
│   │   ├── github.js           # Multi-MD scanner, PR/Issue auditor, commit checker
│   │   └── storage.js          # Local JSON database engine
│   ├── data/                   # Persistent runtime data (gitignored)
│   ├── .env.example
│   └── package.json
│
├── docs/                       # Complete Technical Documentation
│   ├── ARCHITECTURE.md
│   ├── COMMUNITY_DIRECTORY.md
│   ├── COMPLETION_DETECTION.md
│   ├── DEPLOYMENT.md
│   ├── INTERACTIVE_GRAPHS.md
│   ├── MULTI_MARKDOWN_SCANNER.md
│   └── SETUP_AND_USAGE.md
│
├── Dockerfile                  # Multi-stage production container
├── docker-compose.yml          # Container orchestration
├── render.yaml                 # Render.com blueprint configuration
└── package.json                # Root orchestration scripts
```

---

## 🔒 Security & Privacy

- **Zero Hardcoded Secrets**: All authentication tokens and handles are dynamically provided at runtime.
- **Gitignored Credentials**: `.env` and `server/data/*.json` are excluded from version control.
- **Dynamic Multi-Tenant**: Anyone can clone and self-host for their own personal or organization portfolio.
