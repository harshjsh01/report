# 🚀 Setup, Installation & Sharing Guide

GitPulse is built to be completely generic and shareable with anyone. There are zero hardcoded usernames, tokens, or personal identifiers in the source code.

---

## 💻 Prerequisites

- **Node.js**: v18 or higher (Node v20+ recommended)
- **npm**: v8 or higher
- **Git**: v2.20 or higher

---

## 📦 Quick Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshjsh01/report.git
   cd report
   ```

2. **Install all dependencies** (installs root, server, and client packages):
   ```bash
   npm run install-all
   ```

---

## 🏃 Running the Application

### Production Full-Stack Mode (Single Command)
```bash
npm run build
npm start
```
- Starts the Express backend on `http://localhost:5000` which also serves the production React frontend.

### Development Mode (Hot-Reloading)
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Vite Dev Server**: `http://localhost:3000` (with live hot module replacement)

---

## 🔑 GitHub Connection Modes

### Mode 1: Public Mode (No Token Required)
1. Open the web interface.
2. Click **Connect GitHub** in the top navigation.
3. Enter your **GitHub Username** (e.g. `your-username`) and click **Save & Sync**.
4. All your public repositories will be fetched, audited, and categorized immediately.

### Mode 2: Personal Access Token Mode (Full Power)
1. Generate a GitHub Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=repo&description=GitPulse).
2. Paste the token into the **Settings Modal** (or add `GITHUB_TOKEN=your_token` in `server/.env`).
3. **Benefits**:
   - Discovers **100% of repositories** (public, private, collaborated, and organization).
   - Higher GitHub API rate limits (5,000 requests/hour).
   - Enables **1-click official v1.0.0 GitHub release creation** directly from the UI.
