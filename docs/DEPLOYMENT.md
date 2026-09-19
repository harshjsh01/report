# Deployment & Community Distribution Guide

GitPulse is architected as a **zero-hardcoding**, self-contained full-stack application. It can be deployed in under 2 minutes to any modern cloud platform (Render, Railway, Fly.io, Vercel, Docker, or self-hosted VPS).

---

## Table of Contents
1. [Architecture & Production Model](#1-architecture--production-model)
2. [Zero-Hardcoding Guarantee](#2-zero-hardcoding-guarantee)
3. [One-Click Cloud Deployments](#3-one-click-cloud-deployments)
   - [Option A: Deploy to Render (Recommended / Free Tier)](#option-a-deploy-to-render)
   - [Option B: Deploy to Railway](#option-b-deploy-to-railway)
   - [Option C: Deploy to Fly.io](#option-c-deploy-to-flyio)
   - [Option D: Docker / Docker Compose](#option-d-docker--docker-compose)
   - [Option E: Self-Hosted VPS (Ubuntu + PM2 + Nginx)](#option-e-self-hosted-vps)
4. [Community Self-Onboarding Flow](#4-community-self-onboarding-flow)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Theme & System Preferences](#6-theme--system-preferences)

---

## 1. Architecture & Production Model

In production, GitPulse runs as a **single unified process**:
- **Backend**: Express REST API (`/api/*`) running on Node.js.
- **Frontend**: Vite React SPA pre-compiled into static HTML, CSS, and JS (`client/dist`).
- **Unified Port**: The Express server automatically serves the static frontend assets from `client/dist` and handles client-side routing. This means you only need **one port and one service instance** to host the entire system!

```
[ Visitor / Community Member ]
             │
             ▼
   https://your-gitpulse-domain.com
             │
   ┌─────────┴───────────────────────┐
   │ Express Server (PORT: 5000)     │
   ├────────────────┬────────────────┤
   │ Static Assets  │ API Endpoints  │
   │ (/client/dist) │ (/api/*)       │
   └────────────────┴────────────────┘
             │
             ▼
   GitHub REST API v3
   (Dynamic, Per-User Token/Username)
```

---

## 2. Zero-Hardcoding Guarantee

The entire codebase is strictly parameter-free:
- **No Personal Credentials**: There are no hardcoded GitHub tokens, passwords, or secrets anywhere in source code or git history.
- **No Fixed Usernames**: The app does not assume any default GitHub account. When a new user lands on the dashboard, it greets them with an onboarding modal to enter their own handle.
- **Local Data Isolation**: `server/data/*.json` and `.env` are protected by `.gitignore` so your private or test data is never committed to GitHub.
- **Multi-Tenant Friendly**: Any community developer can inspect their own repositories, search other developers in the Community Directory, and submit progress checks.

---

## 3. One-Click Cloud Deployments

### Option A: Deploy to Render
Render provides free web service hosting and natively supports our `render.yaml` blueprint.

1. Fork or push the repository to GitHub: `https://github.com/<your-username>/report`
2. Log into [Render.com](https://render.com) and click **New +** → **Blueprint**.
3. Connect your repository. Render will automatically read `render.yaml`:
   - **Build Command**: `npm run install-all && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variable**: `PORT=10000` (Render assigns dynamic PORT automatically)
4. Click **Apply**. Within 2 minutes, your live URL will be active (e.g. `https://gitpulse-xxxx.onrender.com`)!

---

### Option B: Deploy to Railway
Railway automatically detects the root `Dockerfile` or Node environment.

1. Go to [Railway.app](https://railway.app) and click **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. Railway will build the included multi-stage `Dockerfile` automatically.
4. Go to **Settings** → **Networking** → Click **Generate Domain**.
5. Your live app is ready!

---

### Option C: Deploy to Fly.io
Fly.io runs the app globally near your users via lightweight microVMs.

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh` (or `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`)
2. Log in: `fly auth login`
3. Launch app in root directory:
   ```bash
   fly launch
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

### Option D: Docker / Docker Compose
A multi-stage production `Dockerfile` and `docker-compose.yml` are included.

**Using Docker CLI:**
```bash
# Build production image
docker build -t gitpulse .

# Run container on port 5000
docker run -d -p 5000:5000 --name gitpulse-app gitpulse
```

**Using Docker Compose:**
```bash
docker-compose up -d
```
Visit `http://localhost:5000` in your browser.

---

### Option E: Self-Hosted VPS (Ubuntu + PM2 + Nginx)

For developers deploying on an AWS EC2, DigitalOcean Droplet, Hetzner, or Linode instance:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harshjsh01/report.git /var/www/gitpulse
   cd /var/www/gitpulse
   ```

2. **Install dependencies and compile:**
   ```bash
   npm run install-all
   npm run build
   ```

3. **Start the backend with PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start server/src/index.js --name "gitpulse"
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/gitpulse`):**
   ```nginx
   server {
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
5. **Enable SSL with Certbot:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## 4. Community Self-Onboarding Flow

When you share your public GitPulse URL with colleagues, teammates, or friends:

1. **Landing & First Visit**:
   - The user opens your link.
   - If no default account is configured on the instance, the **GitHub Connection Modal** opens automatically.
2. **Enter GitHub Handle**:
   - The user enters their handle (e.g. `torvalds` or their personal username).
   - GitPulse queries the GitHub API directly, indexes public repositories, scans documentation (`TODO.md`, `CONTEXT.md`, etc.), computes completion percentages, and displays their personal dashboard.
3. **Optional Personal Access Token**:
   - Users who want to track **private repositories** or make **1-click GitHub v1.0.0 Releases** can paste their token into the settings modal.
   - The token is stored in the local server runtime and is never exposed in git.
4. **Community Progress Directory**:
   - Visitors can navigate to the **Community** tab to discover other active developers, check out their tech stacks, and request progress milestone audits.

---

## 5. Environment Variables Reference

Create a `.env` file in the root or `server/` directory:

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `5000` | Port where Express serves API & frontend |
| `NODE_ENV` | String | `development` | Set to `production` in deployment |
| `GITHUB_TOKEN` | String | *(None)* | Optional GitHub Personal Access Token for the server to increase unauthenticated rate limits from 60 to 5,000 requests/hr |

---

## 6. Theme & System Preferences

GitPulse supports **System Theme Detection** by default:
- Automatically reads the visitor's operating system setting (`prefers-color-scheme: dark/light`).
- If the visitor's system is in **Light Mode**, GitPulse renders a clean, high-contrast light theme with soft slate backgrounds and emerald accents.
- If the visitor's system is in **Dark Mode**, GitPulse renders a sleek midnight dark theme.
- Visitors can manually change their preference at any time using the theme toggle in the top navigation bar (System, Light, or Dark).
