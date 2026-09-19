# 🚀 GitPulse — GitHub Project Progress & Completion Hub

> An automated GitHub portfolio progress tracker and completion hub. Connect your GitHub repositories, inspect **all markdown specs (`TODO.md`, `CONTEXT.md`, `ERRORS.md`, `LOGS.md`, `README.md`)**, audit all **Pull Requests & Issues**, detect whether you have committed to each project, and drive every repository to **"Complete"** or **"Version 1.0 Complete"**!

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

### 2. 🔍 Comprehensive PR & Issue Audit
- **Pull Requests**: Inspects all open, merged, and closed PRs with review status, author avatars, and links.
- **Issues**: Tracks all open and closed issues, labels (bugs, enhancements), and discussion comment counts.
- **Milestones**: Monitors GitHub Milestones with percentage completion progress bars.

### 3. 💻 Contribution & Commit Verification
- **"Committed by You" Detector**:
  - Automatically identifies whether you have committed to each repository.
  - Discovers repositories you own, collaborate on, or contributed to externally.
  - Filter by:
    - 🟢 **Committed by You** (active contributions)
    - ⚪ **No Commits by You Yet** (unstarted or scaffolded repos)
    - 🤝 **External Contributions & Collaborations**

### 4. ⚙️ CI Workflows & Language Breakdown
- **GitHub Actions**: Real-time status of CI workflow runs (Passing / Failing / In Progress).
- **Code Composition**: Byte-accurate language breakdown bars (e.g. 70% TypeScript, 20% Python, 10% CSS).

### 5. 🏆 Drive to Completion & Version 1.0
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

### 1. Launch the Application
The full-stack application is pre-built and running at:
- **Web App**: [http://localhost:5000](http://localhost:5000)

To start development mode with hot-reloading:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Vite Dev Frontend**: `http://localhost:3000`

### 2. Configure GitHub
1. Open the web interface at `http://localhost:5000`.
2. Click **Connect GitHub** in the top navigation bar.
3. Enter your **GitHub Username**.
4. *(Optional)* Paste a **Personal Access Token (PAT)** with `repo` scope to inspect private repos and publish releases directly from the UI.

---

## 📁 Architecture

```
.
├── client/                     # Vite + React 18 + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header, search, sync & credentials
│   │   │   ├── StatsOverview.jsx       # Portfolio KPIs & completion rate
│   │   │   ├── ProjectCard.jsx         # Card with commit badge & quick status
│   │   │   ├── ProjectDetailModal.jsx  # Tabs: Specs, PRs, Issues, Commits, CI, v1
│   │   │   ├── KanbanView.jsx          # Stage-based Kanban board
│   │   │   ├── SettingsModal.jsx       # GitHub username & PAT setup
│   │   │   └── GithubIcon.jsx          # Crisp GitHub mark
│   │   ├── utils/confetti.js           # Confetti celebration bursts
│   │   ├── App.jsx                     # State coordination & filtering
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── index.js            # Express API & static frontend server
│   │   ├── github.js           # Multi-MD scanner, PR/Issue auditor, commit checker
│   │   └── storage.js          # Local JSON database engine
│   ├── data/                   # Persistent storage (projects.json)
│   └── package.json
│
└── package.json                # Unified workspace scripts
```
