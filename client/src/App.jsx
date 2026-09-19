import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import ProjectCard from './components/ProjectCard';
import KanbanView from './components/KanbanView';
import ProjectDetailModal from './components/ProjectDetailModal';
import SettingsModal from './components/SettingsModal';
import ProgressGraph from './components/ProgressGraph';
import UserDirectory from './components/UserDirectory';
import RequestProgressModal from './components/RequestProgressModal';
import { 
  FolderGit2, 
  Filter, 
  ArrowUpDown, 
  AlertCircle,
  UserCheck 
} from 'lucide-react';
import GithubIcon from './components/GithubIcon';
import { getStoredTheme, applyTheme, setupSystemThemeListener } from './utils/theme';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ githubUsername: '', hasToken: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize theme
  useEffect(() => {
    applyTheme(getStoredTheme());
    const cleanup = setupSystemThemeListener();
    return () => cleanup();
  }, []);

  // Community & Directory State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'community'
  const [viewingUser, setViewingUser] = useState(null); // null (self) or peer username
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Filters & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [commitFilter, setCommitFilter] = useState('all'); // 'all' | 'committed' | 'not_committed' | 'contributed'
  const [sortBy, setSortBy] = useState('pushed'); // 'pushed' | 'name' | 'stars' | 'status'

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Initial Load: Settings
  useEffect(() => {
    async function initSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          if (data.githubUsername) {
            loadProjects(data.githubUsername);
          } else {
            // First time: prompt to enter username
            setIsSettingsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    initSettings();
  }, []);

  // 2. Load Projects & Stats
  const loadProjects = async (username = null, force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/repos${force ? '?forceRefresh=true' : ''}${username ? `${force ? '&' : '?'}username=${username}` : ''}`;
      const reposRes = await fetch(url);

      if (!reposRes.ok) {
        const errData = await reposRes.json();
        throw new Error(errData.error || 'Failed to fetch repositories from GitHub');
      }

      const reposData = await reposRes.json();
      const loadedRepos = reposData.repos || [];
      setRepos(loadedRepos);

      if (reposData.stats) {
        setStats(reposData.stats);
      } else {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Inspect another user's projects
  const handleSelectUser = (username) => {
    setViewingUser(username);
    setActiveTab('dashboard');
    loadProjects(username, false);
  };

  // Clear peer inspection and return to own projects
  const handleClearViewingUser = () => {
    setViewingUser(null);
    setActiveTab('dashboard');
    if (settings.githubUsername) {
      loadProjects(settings.githubUsername, false);
    }
  };

  // 3. Update Project Status (e.g. mark v1 complete)
  const handleUpdateStatus = async (owner, repoName, newStatus, extraUpdates = {}) => {
    const fullName = `${owner}/${repoName}`;

    // Optimistic UI update
    setRepos(prev => prev.map(p => {
      if (p.full_name === fullName) {
        return {
          ...p,
          status: newStatus,
          ...extraUpdates
        };
      }
      return p;
    }));

    if (selectedProject?.full_name === fullName) {
      setSelectedProject(prev => ({
        ...prev,
        status: newStatus,
        ...extraUpdates
      }));
    }

    try {
      const res = await fetch(`/api/repos/${owner}/${repoName}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...extraUpdates
        })
      });

      if (!res.ok) throw new Error('Failed to update status on server');

      // Refresh aggregate stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // 4. Save Settings
  const handleSaveSettings = async (newSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const data = await res.json();
    setSettings(data);
    if (data.githubUsername) {
      loadProjects(data.githubUsername, true);
    }
  };

  // Real-time computed stats directly synchronized with loaded repositories
  const computedStats = useMemo(() => {
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
      const status = repo.status || repo.autoStatus || (repo.archived ? 'archived' : 'in_progress');

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
  }, [repos]);

  // Available languages for filter
  const languages = useMemo(() => {
    const set = new Set();
    repos.forEach(r => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repos]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return repos
      .filter(project => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = project.name?.toLowerCase().includes(q);
          const matchDesc = project.description?.toLowerCase().includes(q);
          const matchLang = project.language?.toLowerCase().includes(q);
          const matchTopics = (project.topics || []).some(t => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchLang && !matchTopics) return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
          const currentStatus = project.status || (project.archived ? 'archived' : 'in_progress');
          if (currentStatus !== statusFilter) return false;
        }

        // Language filter
        if (languageFilter !== 'all') {
          if (project.language !== languageFilter) return false;
        }

        // Commit status filter
        if (commitFilter === 'committed' && !project.user_committed) return false;
        if (commitFilter === 'not_committed' && project.user_committed) return false;
        if (commitFilter === 'contributed' && !project.is_contributed) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'stars') {
          return (b.stars || 0) - (a.stars || 0);
        }
        if (sortBy === 'status') {
          return (a.status || '').localeCompare(b.status || '');
        }
        // Default: pushed (most recent first)
        const dateA = new Date(a.pushed_at || a.updated_at || 0).getTime();
        const dateB = new Date(b.pushed_at || b.updated_at || 0).getTime();
        return dateB - dateA;
      });
  }, [repos, searchQuery, statusFilter, languageFilter, commitFilter, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={() => loadProjects(viewingUser || settings.githubUsername, true)}
        isLoading={isLoading}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={viewingUser || settings.githubUsername}
        hasToken={settings.hasToken}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        viewingUser={viewingUser}
        onClearViewingUser={handleClearViewingUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline hover:text-slate-950 dark:hover:text-white ml-4 cursor-pointer"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Tab View: Community Directory vs Projects Dashboard */}
        {activeTab === 'community' ? (
          <UserDirectory
            onSelectUser={handleSelectUser}
            onOpenRequestModal={() => setIsRequestModalOpen(true)}
            currentUser={settings.githubUsername}
          />
        ) : (
          <>
            {/* Portfolio Stats Bar */}
            {repos.length > 0 && <StatsOverview stats={computedStats} />}

        {/* Interactive Visual Graph & Progress Matrix */}
        {repos.length > 0 && (
          <ProgressGraph
            projects={repos}
            stats={computedStats}
            activeStatusFilter={statusFilter}
            onSelectStatusFilter={setStatusFilter}
            activeLanguageFilter={languageFilter}
            onSelectLanguageFilter={setLanguageFilter}
            onSelectProject={setSelectedProject}
          />
        )}

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white dark:bg-[#0e1424] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Statuses</option>
                <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">🚀 In Progress</option>
                <option value="needs_polish" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">🔍 Needs Polish</option>
                <option value="paused" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">⏸️ Paused</option>
                <option value="v1_complete" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-300">🏆 v1.0 Complete</option>
                <option value="completed" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-300">✅ Completed</option>
                <option value="archived" className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">📦 Archived</option>
              </select>
            </div>

            {/* Contribution / Commits Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-500 dark:text-slate-400">Commits:</span>
              <select
                value={commitFilter}
                onChange={(e) => setCommitFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Repos</option>
                <option value="committed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">🟢 Committed by You</option>
                <option value="not_committed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">⚪ No Commits by You</option>
                <option value="contributed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">🤝 External Contributions</option>
              </select>
            </div>

            {/* Language Filter */}
            {languages.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Language:</span>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{lang}</option>
                  ))}
                </select>
              </div>
            )}

          </div>

          {/* Sort Control & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredProjects.length}</span> of {repos.length} repos
            </span>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="pushed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Recently Active</option>
                <option value="stars" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Most Stars</option>
                <option value="name" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Project Name</option>
                <option value="status" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Status</option>
              </select>
            </div>
          </div>

        </div>

        {/* View Switch: Grid vs Kanban */}
        {isLoading && repos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-spin">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Inspecting your GitHub Projects...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Auditing repositories, task checklists, and commits</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#0e1424] border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No projects found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.githubUsername 
                ? 'Try adjusting your search query or filters, or hit "Sync" in the navigation bar.'
                : 'Connect your GitHub username to start auditing and completing your projects!'}
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Configure GitHub Username</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdateStatus={handleUpdateStatus}
                onSelectProject={setSelectedProject}
              />
            ))}
          </div>
        ) : (
          <KanbanView
            projects={filteredProjects}
            onUpdateStatus={handleUpdateStatus}
            onSelectProject={setSelectedProject}
          />
        )}
        </>
      )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d131f] py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-150">
        <p className="flex items-center justify-center gap-2">
          <span>GitPulse Tracker & Completion Engine</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Drive all projects to 100% & Version 1.0</span>
        </p>
      </footer>

      {/* Request Progress Check Modal */}
      <RequestProgressModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentUsername={settings.githubUsername}
        onInspectUser={handleSelectUser}
      />

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdateStatus={handleUpdateStatus}
          hasToken={settings.hasToken}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          currentSettings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </div>
  );
}
