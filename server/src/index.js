import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Storage } from './storage.js';
import { GitHubService } from './github.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory cache for fast repo browsing
let cachedRepos = null;
let cachedUser = null;
let lastFetchTime = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

// Helper to get GitHubService instance
function getService(userToken = null) {
  const settings = Storage.getSettings();
  const token = userToken || settings.githubToken || process.env.GITHUB_TOKEN || null;
  return new GitHubService(token);
}

// -------------------------------------------------------------
// SETTINGS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/settings', (req, res) => {
  const settings = Storage.getSettings();
  res.json({
    githubUsername: settings.githubUsername || '',
    hasToken: Boolean(settings.githubToken || process.env.GITHUB_TOKEN),
    lastSync: settings.lastSync
  });
});

app.post('/api/settings', (req, res) => {
  const { githubUsername, githubToken } = req.body;
  const updates = {};
  if (githubUsername !== undefined) updates.githubUsername = githubUsername.trim();
  if (githubToken !== undefined) updates.githubToken = githubToken.trim();
  updates.lastSync = new Date().toISOString();

  const updated = Storage.updateSettings(updates);
  // Clear cache on credentials change
  cachedRepos = null;
  cachedUser = null;
  res.json({
    githubUsername: updated.githubUsername,
    hasToken: Boolean(updated.githubToken),
    lastSync: updated.lastSync
  });
});

// Helper function to calculate aggregate portfolio progress statistics
function calculatePortfolioStats(repos = [], localProjects = {}) {
  const totalRepos = repos.length;
  let inProgress = 0;
  let needsPolish = 0;
  let paused = 0;
  let v1Complete = 0;
  let completed = 0;
  let archived = 0;
  let totalStars = 0;
  let totalForks = 0;

  repos.forEach(repo => {
    totalStars += repo.stars || 0;
    totalForks += repo.forks || 0;
    const local = localProjects[repo.full_name];
    const status = local?.status || repo.status || repo.autoStatus || (repo.archived ? 'archived' : 'in_progress');

    switch (status) {
      case 'v1_complete':
        v1Complete++;
        break;
      case 'completed':
        completed++;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'needs_polish':
        needsPolish++;
        break;
      case 'paused':
        paused++;
        break;
      case 'archived':
        archived++;
        break;
      default:
        inProgress++;
    }
  });

  const totalFinished = v1Complete + completed;
  const completionPercentage = totalRepos > 0 ? Math.round((totalFinished / totalRepos) * 100) : 0;

  return {
    totalRepos,
    inProgress,
    needsPolish,
    paused,
    v1Complete,
    completed,
    archived,
    totalFinished,
    completionPercentage,
    totalStars,
    totalForks
  };
}

// -------------------------------------------------------------
// REPOSITORIES & PROGRESS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/repos', async (req, res) => {
  try {
    const { username, forceRefresh } = req.query;
    const settings = Storage.getSettings();
    const targetUser = username || settings.githubUsername;

    if (!targetUser && !settings.githubToken && !process.env.GITHUB_TOKEN) {
      return res.status(400).json({
        error: 'Please configure your GitHub username or Personal Access Token in Settings.'
      });
    }

    const now = Date.now();
    const gh = getService();

    if (!forceRefresh && cachedRepos && cachedUser === targetUser && lastFetchTime && (now - lastFetchTime < CACHE_TTL_MS)) {
      const localProjects = Storage.getAllRepoData();
      const enriched = cachedRepos.map(repo => {
        const local = localProjects[repo.full_name] || {};
        const auto = repo.autoStatus ? { status: repo.autoStatus, reason: repo.autoReason } : gh.autoDetectCompletionStatus(repo);
        const assignedStatus = local.status || auto.status;

        let progressPercent = 50;
        if (assignedStatus === 'v1_complete' || assignedStatus === 'completed') progressPercent = 100;
        else if (assignedStatus === 'needs_polish') progressPercent = 85;
        else if (assignedStatus === 'paused') progressPercent = 40;
        else if (assignedStatus === 'archived') progressPercent = 100;
        else if (assignedStatus === 'in_progress') progressPercent = 60;

        return {
          ...repo,
          autoStatus: auto.status,
          autoReason: auto.reason,
          progressPercent,
          status: assignedStatus,
          priority: local.priority || 'medium',
          targetDate: local.targetDate || null,
          notes: local.notes || '',
          customTasks: local.customTasks || [],
          completedAt: local.completedAt || (assignedStatus === 'v1_complete' || assignedStatus === 'completed' ? repo.pushed_at || repo.updated_at : null),
          v1ReleaseTag: local.v1ReleaseTag || (assignedStatus === 'v1_complete' ? 'v1.0.0' : null)
        };
      });
      const stats = calculatePortfolioStats(enriched, localProjects);
      return res.json({ repos: enriched, stats, cached: true });
    }

    const rawRepos = await gh.getRepositories(targetUser || null);
    const localProjects = Storage.getAllRepoData();

    // Map and enrich repositories with automatic completion detection
    const enriched = rawRepos.map(repo => {
      const local = localProjects[repo.full_name] || {};
      const auto = gh.autoDetectCompletionStatus(repo);
      const assignedStatus = local.status || auto.status;

      let progressPercent = 50;
      if (assignedStatus === 'v1_complete' || assignedStatus === 'completed') progressPercent = 100;
      else if (assignedStatus === 'needs_polish') progressPercent = 85;
      else if (assignedStatus === 'paused') progressPercent = 40;
      else if (assignedStatus === 'archived') progressPercent = 100;
      else if (assignedStatus === 'in_progress') progressPercent = 60;

      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner.login,
        description: repo.description || '',
        html_url: repo.html_url,
        homepage: repo.homepage || '',
        language: repo.language || 'Plain Text',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        is_private: repo.private,
        is_fork: repo.fork,
        is_contributed: Boolean(repo.is_contributed),
        user_committed: Boolean(
          (targetUser || '').toLowerCase().includes(repo.owner?.login?.toLowerCase() || '') ||
          repo.is_contributed
        ),
        archived: repo.archived,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        topics: repo.topics || [],
        license: repo.license?.spdx_id || null,
        // Auto-detection attributes
        autoStatus: auto.status,
        autoReason: auto.reason,
        progressPercent,
        // Local tracker attributes
        status: assignedStatus,
        priority: local.priority || 'medium',
        targetDate: local.targetDate || null,
        notes: local.notes || '',
        customTasks: local.customTasks || [],
        completedAt: local.completedAt || (assignedStatus === 'v1_complete' || assignedStatus === 'completed' ? repo.pushed_at || repo.updated_at : null),
        v1ReleaseTag: local.v1ReleaseTag || (assignedStatus === 'v1_complete' ? 'v1.0.0' : null)
      };
    });

    cachedRepos = enriched;
    cachedUser = targetUser;
    lastFetchTime = now;
    Storage.updateSettings({ lastSync: new Date().toISOString() });

    const stats = calculatePortfolioStats(enriched, localProjects);
    res.json({ repos: enriched, stats, cached: false });
  } catch (error) {
    console.error('Error fetching repos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Deep inspection of a single repository
app.get('/api/repos/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  const settings = Storage.getSettings();
  const username = req.query.username || settings.githubUsername;

  try {
    const gh = getService();

    const [
      readmeData, 
      releaseData, 
      commits, 
      prData, 
      issueData, 
      milestones, 
      workflows, 
      languages,
      userCommitData
    ] = await Promise.all([
      gh.getReadmeTasks(owner, repo),
      gh.getReleasesAndTags(owner, repo),
      gh.getRecentCommits(owner, repo, 15),
      gh.getPullRequests(owner, repo),
      gh.getIssues(owner, repo),
      gh.getMilestones(owner, repo),
      gh.getWorkflows(owner, repo),
      gh.getLanguages(owner, repo),
      gh.getUserCommitActivity(owner, repo, username)
    ]);

    const local = Storage.getRepoData(fullName) || {
      status: releaseData.hasV1Release ? 'v1_complete' : 'in_progress',
      priority: 'medium',
      targetDate: null,
      notes: '',
      customTasks: [],
      completedAt: null
    };

    // Calculate total checklist: README tasks + custom tasks
    const allTasks = [
      ...readmeData.tasks,
      ...(local.customTasks || [])
    ];
    const completedTasksCount = allTasks.filter(t => t.completed).length;
    const taskCompletionRatio = allTasks.length > 0
      ? Math.round((completedTasksCount / allTasks.length) * 100)
      : (local.status === 'v1_complete' || local.status === 'completed' ? 100 : 50);

    const healthScore = gh.calculateHealthScore(
      { pushed_at: new Date().toISOString(), ...local },
      readmeData,
      releaseData,
      prData,
      issueData,
      workflows
    );

    res.json({
      full_name: fullName,
      owner,
      repo,
      readme: readmeData,
      releases: releaseData,
      commits,
      prs: prData,
      issues: issueData,
      milestones,
      workflows,
      languages,
      userCommitActivity: userCommitData,
      tasks: allTasks,
      stats: {
        totalTasks: allTasks.length,
        completedTasks: completedTasksCount,
        taskCompletionRatio,
        healthScore
      },
      localData: local
    });
  } catch (error) {
    console.error(`Error inspecting repo ${fullName}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update project status, priority, notes, or target date
app.post('/api/repos/:owner/:repo/status', (req, res) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  const { status, priority, targetDate, notes, v1ReleaseTag } = req.body;

  const updates = {};
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (targetDate !== undefined) updates.targetDate = targetDate;
  if (notes !== undefined) updates.notes = notes;
  if (v1ReleaseTag !== undefined) updates.v1ReleaseTag = v1ReleaseTag;

  const updated = Storage.updateRepoData(fullName, updates);

  // Update in cachedRepos if present
  if (cachedRepos) {
    const item = cachedRepos.find(r => r.full_name === fullName);
    if (item) {
      Object.assign(item, updated);
    }
  }

  res.json({ success: true, project: updated });
});

// Add a custom task to a repo
app.post('/api/repos/:owner/:repo/tasks', (req, res) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Task text is required' });
  }

  const newTask = Storage.addCustomTask(fullName, text.trim());
  res.json({ success: true, task: newTask });
});

// Toggle a custom task
app.patch('/api/repos/:owner/:repo/tasks/:taskId', (req, res) => {
  const { owner, repo, taskId } = req.params;
  const fullName = `${owner}/${repo}`;

  const updatedTask = Storage.toggleCustomTask(fullName, taskId);
  if (!updatedTask) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ success: true, task: updatedTask });
});

// Delete a custom task
app.delete('/api/repos/:owner/:repo/tasks/:taskId', (req, res) => {
  const { owner, repo, taskId } = req.params;
  const fullName = `${owner}/${repo}`;

  const success = Storage.deleteCustomTask(fullName, taskId);
  res.json({ success });
});

// Mark Version 1 Complete & optionally publish release on GitHub
app.post('/api/repos/:owner/:repo/release-v1', async (req, res) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  const { tag = 'v1.0.0', title = 'v1.0.0 - Production Release', notes = 'Version 1.0 complete!', publishToGithub = false } = req.body;

  let githubRelease = null;
  const gh = getService();

  if (publishToGithub) {
    try {
      githubRelease = await gh.createV1Release(owner, repo, tag, title, notes);
      await gh.addRepoTopic(owner, repo, 'v1-completed');
    } catch (err) {
      return res.status(400).json({
        error: `GitHub Release Failed: ${err.message}. You can still mark it as v1 complete locally.`
      });
    }
  }

  // Update local status to v1_complete
  const updated = Storage.updateRepoData(fullName, {
    status: 'v1_complete',
    v1ReleaseTag: tag,
    completedAt: new Date().toISOString()
  });

  if (cachedRepos) {
    const item = cachedRepos.find(r => r.full_name === fullName);
    if (item) {
      Object.assign(item, updated);
    }
  }

  res.json({
    success: true,
    status: 'v1_complete',
    project: updated,
    githubRelease
  });
});

// Overall portfolio progress statistics
app.get('/api/stats', (req, res) => {
  const localProjects = Storage.getAllRepoData();
  const repos = cachedRepos || [];
  const stats = calculatePortfolioStats(repos, localProjects);
  res.json(stats);
});

// Serve frontend if built
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GitPulse Server running on http://localhost:${PORT}`);
});
