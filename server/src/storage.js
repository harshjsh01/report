import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state structure
const defaultState = {
  settings: {
    githubUsername: '',
    githubToken: '',
    lastSync: null
  },
  projects: {} // keyed by repo full_name, e.g. "owner/repo"
};

function readDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return defaultState;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading storage database, returning fallback state:', err.message);
    return defaultState;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing storage database:', err.message);
  }
}

export const Storage = {
  getSettings() {
    const db = readDb();
    return db.settings || defaultState.settings;
  },

  updateSettings(newSettings) {
    const db = readDb();
    db.settings = { ...db.settings, ...newSettings };
    writeDb(db);
    return db.settings;
  },

  getAllRepoData() {
    const db = readDb();
    return db.projects || {};
  },

  getRepoData(repoFullName) {
    const db = readDb();
    return db.projects?.[repoFullName] || null;
  },

  updateRepoData(repoFullName, updates) {
    const db = readDb();
    if (!db.projects) {
      db.projects = {};
    }

    const existing = db.projects[repoFullName] || {
      status: 'in_progress', // in_progress | needs_polish | paused | v1_complete | completed | archived
      priority: 'medium', // low | medium | high
      targetDate: null,
      notes: '',
      customTasks: [],
      completedAt: null,
      v1ReleaseTag: null
    };

    // If status changed to v1_complete or completed, set completedAt timestamp if not set
    if ((updates.status === 'v1_complete' || updates.status === 'completed') && !existing.completedAt) {
      updates.completedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'v1_complete' && updates.status !== 'completed') {
      updates.completedAt = null;
    }

    db.projects[repoFullName] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    writeDb(db);
    return db.projects[repoFullName];
  },

  addCustomTask(repoFullName, taskText) {
    const db = readDb();
    if (!db.projects) db.projects = {};
    const repo = db.projects[repoFullName] || {
      status: 'in_progress',
      priority: 'medium',
      customTasks: []
    };

    const newTask = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(repo.customTasks)) {
      repo.customTasks = [];
    }
    repo.customTasks.push(newTask);
    repo.updatedAt = new Date().toISOString();
    db.projects[repoFullName] = repo;
    writeDb(db);
    return newTask;
  },

  toggleCustomTask(repoFullName, taskId) {
    const db = readDb();
    const repo = db.projects?.[repoFullName];
    if (!repo || !Array.isArray(repo.customTasks)) return null;

    const task = repo.customTasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      repo.updatedAt = new Date().toISOString();
      writeDb(db);
      return task;
    }
    return null;
  },

  deleteCustomTask(repoFullName, taskId) {
    const db = readDb();
    const repo = db.projects?.[repoFullName];
    if (!repo || !Array.isArray(repo.customTasks)) return false;

    repo.customTasks = repo.customTasks.filter(t => t.id !== taskId);
    repo.updatedAt = new Date().toISOString();
    writeDb(db);
    return true;
  }
};
