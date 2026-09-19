import axios from 'axios';

export class GitHubService {
  constructor(token = null) {
    this.token = token;
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-Progress-Tracker',
        ...(token ? { Authorization: `token ${token}` } : {})
      },
      timeout: 15000
    });
  }

  setToken(token) {
    this.token = token;
    this.client.defaults.headers.Authorization = token ? `token ${token}` : undefined;
  }

  /**
   * Dynamically fetch authenticated user profile from GitHub
   */
  async getAuthenticatedUser() {
    if (!this.token) return null;
    try {
      const res = await this.client.get('/user');
      return res.data;
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetch ALL repositories for user (owned, private, collaborated, organization, and contributed)
   */
  async getRepositories(username = null) {
    const reposMap = new Map();
    const perPage = 100;

    try {
      let effectiveUser = username;
      if (this.token && !effectiveUser) {
        const authUser = await this.getAuthenticatedUser();
        if (authUser?.login) effectiveUser = authUser.login;
      }

      // 1. If Token is present, fetch ALL authenticated repos (owned, collaborated, orgs, private)
      if (this.token) {
        let page = 1;
        while (page <= 5) {
          const res = await this.client.get('/user/repos', {
            params: {
              per_page: perPage,
              page,
              affiliation: 'owner,collaborator,organization_member',
              visibility: 'all',
              sort: 'updated',
              direction: 'desc'
            }
          });
          if (!Array.isArray(res.data) || res.data.length === 0) break;
          res.data.forEach(r => reposMap.set(r.full_name, r));
          if (res.data.length < perPage) break;
          page++;
        }

        // Also fetch user's organizations and their repos
        try {
          const orgsRes = await this.client.get('/user/orgs');
          if (Array.isArray(orgsRes.data)) {
            for (const org of orgsRes.data) {
              const orgReposRes = await this.client.get(`/orgs/${org.login}/repos`, {
                params: { per_page: 100 }
              });
              if (Array.isArray(orgReposRes.data)) {
                orgReposRes.data.forEach(r => reposMap.set(r.full_name, r));
              }
            }
          }
        } catch (e) {
          // Ignore org fetch failure
        }
      }

      // 2. Also fetch public repos for username(s) (supports comma-separated usernames like "harshjsh01, Harshjsh02")
      const usernames = username
        ? username.split(',').map(u => u.trim()).filter(Boolean)
        : [];

      for (const u of usernames) {
        let page = 1;
        while (page <= 3) {
          try {
            const res = await this.client.get(`/users/${u}/repos`, {
              params: { per_page: perPage, page, sort: 'updated', direction: 'desc' }
            });
            if (!Array.isArray(res.data) || res.data.length === 0) break;
            res.data.forEach(r => {
              if (!reposMap.has(r.full_name)) {
                reposMap.set(r.full_name, r);
              }
            });
            if (res.data.length < perPage) break;
            page++;
          } catch (e) {
            break;
          }
        }

        // Check recent events for external contributions
        try {
          const eventsRes = await this.client.get(`/users/${u}/events/public`, {
            params: { per_page: 100 }
          });
          if (Array.isArray(eventsRes.data)) {
            const extNames = new Set();
            eventsRes.data.forEach(evt => {
              if (evt.repo?.name && !reposMap.has(evt.repo.name)) {
                extNames.add(evt.repo.name);
              }
            });

            const topExt = Array.from(extNames).slice(0, 10);
            for (const fullName of topExt) {
              try {
                const extRes = await this.client.get(`/repos/${fullName}`);
                if (extRes.data && !reposMap.has(extRes.data.full_name)) {
                  extRes.data.is_contributed = true;
                  reposMap.set(extRes.data.full_name, extRes.data);
                }
              } catch (e) {}
            }
          }
        } catch (e) {}
      }

      return Array.from(reposMap.values());
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      const status = error.response?.status;
      if (status === 403 && msg.includes('rate limit')) {
        throw new Error('GitHub API rate limit exceeded. Please add a Personal Access Token in Settings.');
      }
      throw new Error(`Failed to fetch repositories: ${msg}`);
    }
  }

  /**
   * Automatic Intelligence Detection Engine:
   * Analyzes repo attributes, deployments, tags, issues, and dates to automatically
   * identify whether a project is Completed, v1.0 Complete, Needs Polish, or In Progress.
   */
  autoDetectCompletionStatus(repo, tags = [], tasks = []) {
    // 1. Explicitly Archived
    if (repo.archived) {
      return {
        status: 'archived',
        reason: 'Repository is officially archived on GitHub'
      };
    }

    // 2. Has v1.x Release Tag
    const hasV1Tag = (tags || []).some(t => {
      const name = typeof t === 'string' ? t : t.name;
      if (!name) return false;
      const cleaned = name.replace(/^v/i, '');
      const major = parseInt(cleaned.split('.')[0], 10);
      return !isNaN(major) && major >= 1;
    });

    if (hasV1Tag) {
      return {
        status: 'v1_complete',
        reason: 'Official Version 1.0+ production release tag detected'
      };
    }

    // 3. Check Markdown Task checklist if present
    if (tasks && tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.completed).length;
      const ratio = completedTasks / tasks.length;
      if (ratio === 1) {
        return {
          status: 'v1_complete',
          reason: `All ${tasks.length} tasks in project documentation are 100% completed`
        };
      }
      if (ratio >= 0.75) {
        return {
          status: 'needs_polish',
          reason: `${Math.round(ratio * 100)}% of tasks completed; in final polishing phase`
        };
      }
    }

    // 4. Live Production Deployment Check (Vercel, Netlify, custom domain, GitHub Pages)
    const hasLiveHomepage = Boolean(
      repo.homepage &&
      repo.homepage.trim().length > 7 &&
      /^https?:\/\//i.test(repo.homepage.trim())
    );

    if (hasLiveHomepage) {
      // If deployed online and 0 open issues -> Shipped Production (v1 Complete)!
      if (repo.open_issues_count === 0) {
        return {
          status: 'v1_complete',
          reason: `Live production web deployment (${repo.homepage}) with 0 open issues`
        };
      }
      // If deployed online but has open issues -> Needs Polish
      return {
        status: 'needs_polish',
        reason: `Live deployment available, but has ${repo.open_issues_count} open issues to polish`
      };
    }

    // 5. Pre-release or Beta Tag
    const hasPreReleaseTag = (tags || []).some(t => {
      const name = typeof t === 'string' ? t : t.name;
      return name && /^(v?0\.|beta|alpha|rc|dev)/i.test(name);
    });

    if (hasPreReleaseTag) {
      return {
        status: 'needs_polish',
        reason: 'Pre-release or beta version tag detected'
      };
    }

    // 6. Inactive finished historic project check:
    // Pushed > 90 days ago, 0 open issues, has description or license
    const lastPushed = new Date(repo.pushed_at || repo.updated_at || Date.now()).getTime();
    const daysSincePush = (Date.now() - lastPushed) / (1000 * 60 * 60 * 24);

    const isHistoricFinished = (
      daysSincePush >= 90 &&
      repo.open_issues_count === 0 &&
      (repo.description?.length > 10 || repo.license || repo.size > 0)
    );

    if (isHistoricFinished) {
      return {
        status: 'completed',
        reason: `Finished project milestone (0 open issues, pushed ${Math.round(daysSincePush)} days ago)`
      };
    }

    // 7. Active ongoing development
    if (repo.open_issues_count > 0 || daysSincePush <= 45) {
      return {
        status: 'in_progress',
        reason: 'Active ongoing development and commits'
      };
    }

    // Default
    return {
      status: 'in_progress',
      reason: 'Under active tracking'
    };
  }

  /**
   * Check if user committed to repository and get their commit count
   */
  async getUserCommitActivity(owner, repo, username) {
    if (!username) {
      return { userCommitted: false, userCommitCount: 0 };
    }

    try {
      // Check author commits
      const commitsRes = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: { author: username, per_page: 10 }
      });
      const count = Array.isArray(commitsRes.data) ? commitsRes.data.length : 0;
      return {
        userCommitted: count > 0,
        userCommitCount: count,
        recentUserCommits: (commitsRes.data || []).slice(0, 5).map(c => ({
          sha: c.sha.substring(0, 7),
          message: c.commit.message.split('\n')[0],
          date: c.commit.author?.date,
          url: c.html_url
        }))
      };
    } catch (err) {
      return { userCommitted: false, userCommitCount: 0, recentUserCommits: [] };
    }
  }

  /**
   * Fetch all Pull Requests (Open, Merged, Closed)
   */
  async getPullRequests(owner, repo) {
    try {
      const res = await this.client.get(`/repos/${owner}/${repo}/pulls`, {
        params: { state: 'all', per_page: 30, sort: 'updated', direction: 'desc' }
      });
      const raw = Array.isArray(res.data) ? res.data : [];

      const openPRs = raw.filter(p => p.state === 'open');
      const mergedPRs = raw.filter(p => p.merged_at != null);
      const closedPRs = raw.filter(p => p.state === 'closed' && !p.merged_at);

      return {
        total: raw.length,
        openCount: openPRs.length,
        mergedCount: mergedPRs.length,
        closedCount: closedPRs.length,
        list: raw.map(p => ({
          id: p.id,
          number: p.number,
          title: p.title,
          state: p.merged_at ? 'merged' : p.state,
          author: p.user?.login || 'unknown',
          authorAvatar: p.user?.avatar_url,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          mergedAt: p.merged_at,
          html_url: p.html_url,
          draft: p.draft
        }))
      };
    } catch (err) {
      return { total: 0, openCount: 0, mergedCount: 0, closedCount: 0, list: [] };
    }
  }

  /**
   * Fetch all Issues (Open and Closed, excluding PRs)
   */
  async getIssues(owner, repo) {
    try {
      const res = await this.client.get(`/repos/${owner}/${repo}/issues`, {
        params: { state: 'all', per_page: 30, sort: 'updated', direction: 'desc' }
      });
      const raw = Array.isArray(res.data) ? res.data : [];
      // Filter out Pull Requests (which GitHub includes in issues endpoint)
      const pureIssues = raw.filter(i => !i.pull_request);

      const openIssues = pureIssues.filter(i => i.state === 'open');
      const closedIssues = pureIssues.filter(i => i.state === 'closed');

      return {
        total: pureIssues.length,
        openCount: openIssues.length,
        closedCount: closedIssues.length,
        list: pureIssues.map(i => ({
          id: i.id,
          number: i.number,
          title: i.title,
          state: i.state,
          author: i.user?.login || 'unknown',
          createdAt: i.created_at,
          closedAt: i.closed_at,
          html_url: i.html_url,
          labels: (i.labels || []).map(l => ({ name: l.name, color: l.color })),
          commentsCount: i.comments
        }))
      };
    } catch (err) {
      return { total: 0, openCount: 0, closedCount: 0, list: [] };
    }
  }

  /**
   * Fetch GitHub Milestones
   */
  async getMilestones(owner, repo) {
    try {
      const res = await this.client.get(`/repos/${owner}/${repo}/milestones`, {
        params: { state: 'all', per_page: 10 }
      });
      const raw = Array.isArray(res.data) ? res.data : [];

      return raw.map(m => {
        const total = m.open_issues + m.closed_issues;
        const ratio = total > 0 ? Math.round((m.closed_issues / total) * 100) : 0;
        return {
          id: m.id,
          number: m.number,
          title: m.title,
          description: m.description,
          state: m.state,
          openIssues: m.open_issues,
          closedIssues: m.closed_issues,
          totalIssues: total,
          completionRatio: ratio,
          dueOn: m.due_on,
          html_url: m.html_url
        };
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch GitHub Actions Workflows & CI runs
   */
  async getWorkflows(owner, repo) {
    try {
      const res = await this.client.get(`/repos/${owner}/${repo}/actions/runs`, {
        params: { per_page: 5 }
      });
      const runs = res.data?.workflow_runs || [];
      const latestRun = runs[0] || null;

      return {
        hasActions: runs.length > 0,
        latestStatus: latestRun?.conclusion || latestRun?.status || null, // success, failure, in_progress
        latestRunTitle: latestRun?.name || null,
        latestRunUrl: latestRun?.html_url || null,
        runs: runs.slice(0, 3).map(r => ({
          id: r.id,
          name: r.name,
          status: r.status,
          conclusion: r.conclusion,
          branch: r.head_branch,
          createdAt: r.created_at,
          url: r.html_url
        }))
      };
    } catch (err) {
      return { hasActions: false, latestStatus: null, latestRunTitle: null, runs: [] };
    }
  }

  /**
   * Fetch Language breakdown bytes
   */
  async getLanguages(owner, repo) {
    try {
      const res = await this.client.get(`/repos/${owner}/${repo}/languages`);
      const langBytes = res.data || {};
      const totalBytes = Object.values(langBytes).reduce((a, b) => a + b, 0);

      const list = Object.entries(langBytes).map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0
      }));

      return {
        totalBytes,
        languages: list
      };
    } catch (err) {
      return { totalBytes: 0, languages: [] };
    }
  }

  /**
   * Discover and parse all markdown files (.md) in the repository
   * Extracts tasks, context, todos, logs, errors, and document outlines
   */
  async getAllMarkdownDocs(owner, repo) {
    const mdFiles = [];
    const allExtractedTasks = [];

    // Helper to categorize markdown filename
    const categorize = (filename) => {
      const lower = filename.toLowerCase();
      if (lower.includes('todo')) return 'todo';
      if (lower.includes('task')) return 'task';
      if (lower.includes('context')) return 'context';
      if (lower.includes('error') || lower.includes('bug') || lower.includes('issue')) return 'error';
      if (lower.includes('log') || lower.includes('changelog')) return 'log';
      if (lower.includes('roadmap') || lower.includes('plan')) return 'roadmap';
      if (lower.includes('readme')) return 'readme';
      return 'doc';
    };

    try {
      // 1. Get root directory items
      const rootRes = await this.client.get(`/repos/${owner}/${repo}/contents`);
      const rootItems = Array.isArray(rootRes.data) ? rootRes.data : [];

      const candidates = [];

      for (const item of rootItems) {
        if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.markdown'))) {
          candidates.push({ path: item.path, name: item.name });
        } else if (item.type === 'dir' && (item.name === 'docs' || item.name === '.github' || item.name === 'notes')) {
          try {
            const subRes = await this.client.get(`/repos/${owner}/${repo}/contents/${item.path}`);
            if (Array.isArray(subRes.data)) {
              subRes.data.forEach(sub => {
                if (sub.type === 'file' && (sub.name.endsWith('.md') || sub.name.endsWith('.markdown'))) {
                  candidates.push({ path: sub.path, name: sub.name });
                }
              });
            }
          } catch (e) {}
        }
      }

      // If no candidates found from contents, fallback to readme
      if (candidates.length === 0) {
        candidates.push({ path: 'README.md', name: 'README.md' });
      }

      // Limit fetching to top 10 markdown files
      const selectedCandidates = candidates.slice(0, 10);

      for (const cand of selectedCandidates) {
        try {
          const fileRes = await this.client.get(`/repos/${owner}/${repo}/contents/${cand.path}`);
          if (!fileRes.data?.content) continue;

          const decoded = Buffer.from(fileRes.data.content, 'base64').toString('utf-8');
          const lines = decoded.split('\n');

          const tasks = [];
          const taskRegex = /^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/;
          const category = categorize(cand.name);

          // Extract headers
          const headers = [];
          lines.forEach((line, index) => {
            const taskMatch = line.match(taskRegex);
            if (taskMatch) {
              const isDone = taskMatch[1].toLowerCase() === 'x';
              const title = taskMatch[2].trim();
              const taskObj = {
                id: `${cand.name}-${index}`,
                text: title,
                completed: isDone,
                sourceFile: cand.path,
                category
              };
              tasks.push(taskObj);
              allExtractedTasks.push(taskObj);
            } else if (line.startsWith('#')) {
              headers.push(line.trim());
            }
          });

          const completedCount = tasks.filter(t => t.completed).length;

          mdFiles.push({
            path: cand.path,
            name: cand.name,
            category,
            tasks,
            totalTasks: tasks.length,
            completedTasks: completedCount,
            headers: headers.slice(0, 8),
            rawContent: decoded,
            preview: lines.slice(0, 15).join('\n')
          });
        } catch (fileErr) {
          // File may be 404 or binary, skip safely
        }
      }

      const readmeDoc = mdFiles.find(f => f.category === 'readme') || mdFiles[0] || null;

      return {
        files: mdFiles,
        allTasks: allExtractedTasks,
        totalTasksCount: allExtractedTasks.length,
        completedTasksCount: allExtractedTasks.filter(t => t.completed).length,
        hasReadme: Boolean(readmeDoc),
        readmeContent: readmeDoc?.rawContent || ''
      };
    } catch (err) {
      return {
        files: [],
        allTasks: [],
        totalTasksCount: 0,
        completedTasksCount: 0,
        hasReadme: false,
        readmeContent: ''
      };
    }
  }

  /**
   * Fetch README content and parse markdown checkboxes
   */
  async getReadmeTasks(owner, repo) {
    const mdResult = await this.getAllMarkdownDocs(owner, repo);
    return {
      hasReadme: mdResult.hasReadme,
      tasks: mdResult.allTasks,
      completedCount: mdResult.completedTasksCount,
      totalCount: mdResult.totalTasksCount,
      taskRatio: mdResult.totalTasksCount > 0 ? Math.round((mdResult.completedTasksCount / mdResult.totalTasksCount) * 100) : null,
      rawMarkdown: mdResult.readmeContent,
      allMarkdownFiles: mdResult.files
    };
  }

  /**
   * Fetch repository releases and tags
   */
  async getReleasesAndTags(owner, repo) {
    try {
      const [releasesRes, tagsRes] = await Promise.allSettled([
        this.client.get(`/repos/${owner}/${repo}/releases`, { params: { per_page: 5 } }),
        this.client.get(`/repos/${owner}/${repo}/tags`, { params: { per_page: 5 } })
      ]);

      const releases = releasesRes.status === 'fulfilled' ? releasesRes.value.data : [];
      const tags = tagsRes.status === 'fulfilled' ? tagsRes.value.data : [];

      const latestRelease = releases[0] || null;
      const latestTag = tags[0]?.name || latestRelease?.tag_name || null;

      const hasV1Release = [...releases.map(r => r.tag_name), ...tags.map(t => t.name)].some(tag => {
        if (!tag) return false;
        const cleaned = tag.replace(/^v/i, '');
        const major = parseInt(cleaned.split('.')[0], 10);
        return !isNaN(major) && major >= 1;
      });

      return {
        releasesCount: releases.length,
        latestReleaseTag: latestRelease?.tag_name || null,
        latestReleaseName: latestRelease?.name || null,
        latestTag,
        hasV1Release
      };
    } catch (err) {
      return { releasesCount: 0, latestReleaseTag: null, latestReleaseName: null, latestTag: null, hasV1Release: false };
    }
  }

  /**
   * Fetch recent commits
   */
  async getRecentCommits(owner, repo, count = 10) {
    try {
      const res = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: { per_page: count }
      });
      return (res.data || []).map(c => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message.split('\n')[0],
        author: c.commit.author?.name || c.author?.login || 'Unknown',
        authorAvatar: c.author?.avatar_url || null,
        authorLogin: c.author?.login || null,
        date: c.commit.author?.date || c.commit.committer?.date,
        url: c.html_url
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Calculate a comprehensive Health & Completion score (0 to 100)
   */
  calculateHealthScore(repo, readmeData, releaseData, prData = null, issueData = null, ciData = null) {
    let score = 0;

    // Has README (10 pts)
    if (readmeData?.hasReadme) score += 10;

    // Has Description (5 pts)
    if (repo?.description && repo.description.trim().length > 5) score += 5;

    // Has License (10 pts)
    if (repo?.license) score += 10;

    // Recency of last push/commit (15 pts)
    const lastPushed = new Date(repo?.pushed_at || repo?.updated_at || Date.now()).getTime();
    const daysSincePush = (Date.now() - lastPushed) / (1000 * 60 * 60 * 24);
    if (daysSincePush <= 14) score += 15;
    else if (daysSincePush <= 45) score += 10;
    else if (daysSincePush <= 90) score += 5;

    // Releases / Tags presence (20 pts)
    if (releaseData?.hasV1Release) {
      score += 20;
    } else if (releaseData?.latestTag || releaseData?.releasesCount > 0) {
      score += 10;
    }

    // README Task completion (15 pts)
    if (readmeData?.totalCount > 0) {
      const ratio = readmeData.completedCount / readmeData.totalCount;
      score += Math.round(ratio * 15);
    } else {
      score += 8;
    }

    // Pull Requests & Issues Health (15 pts)
    if (prData && prData.total > 0) {
      const prHealth = prData.mergedCount / prData.total;
      score += Math.round(prHealth * 8);
    } else {
      score += 5;
    }

    if (issueData && issueData.total > 0) {
      const issueClosureRate = issueData.closedCount / issueData.total;
      score += Math.round(issueClosureRate * 7);
    } else {
      score += 5;
    }

    // CI / GitHub Actions passing (10 pts)
    if (ciData?.latestStatus === 'success') {
      score += 10;
    } else if (ciData?.hasActions) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Create an official GitHub v1.0.0 Release (Requires PAT)
   */
  async createV1Release(owner, repo, tag = 'v1.0.0', title = 'v1.0.0 - Production Release', notes = 'Version 1.0 complete release') {
    if (!this.token) {
      throw new Error('A Personal Access Token (PAT) with repo permissions is required to publish releases on GitHub.');
    }

    const payload = {
      tag_name: tag,
      target_commitish: 'main', // will fallback if default branch differs
      name: title,
      body: notes,
      draft: false,
      prerelease: false,
      generate_release_notes: true
    };

    try {
      const res = await this.client.post(`/repos/${owner}/${repo}/releases`, payload);
      return res.data;
    } catch (err) {
      // If tag already exists, try getting it
      const msg = err.response?.data?.message || err.message;
      throw new Error(`Failed to create release: ${msg}`);
    }
  }

  /**
   * Add 'v1-completed' topic to repo
   */
  async addRepoTopic(owner, repo, newTopic = 'v1-completed') {
    if (!this.token) return null;
    try {
      const current = await this.client.get(`/repos/${owner}/${repo}/topics`, {
        headers: { Accept: 'application/vnd.github.mercy-preview+json' }
      });
      const names = current.data?.names || [];
      if (!names.includes(newTopic)) {
        names.push(newTopic);
        await this.client.put(`/repos/${owner}/${repo}/topics`, { names }, {
          headers: { Accept: 'application/vnd.github.mercy-preview+json' }
        });
      }
      return names;
    } catch (err) {
      console.warn('Failed to add repo topic:', err.message);
      return null;
    }
  }
}
