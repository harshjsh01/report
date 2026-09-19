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
  Sparkles, 
  ArrowUpDown, 
  AlertCircle, 
  PlusCircle, 
  Trophy, 
  UserCheck,
  Users,
  ArrowLeft
} from 'lucide-react';
import GithubIcon from './components/GithubIcon';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [settings, setSettings] = useState({ githubUsername: '', hasToken: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Active view: 'projects' | 'community'
  const [activeTab, setActiveTab] = useState('projects');
  // Which user's portfolio is currently being viewed
  const [viewingUser, setViewingUser] = useState('');

  // Community directory & requests state
  const [trackedUsers, setTrackedUsers] = useState([]);
  const [progressRequests, setProgressRequests] = useState([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
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

  // 1. Initial Load: Settings & Directory
  useEffect(() => {
    async function init() {
      try {
        const [settingsRes, usersRes, reqsRes] = await Promise.allSettled([
          fetch('/api/settings'),
          fetch('/api/users'),
          fetch('/api/users/requests')
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
          const data = await settingsRes.value.json();
          setSettings(data);
          if (data.githubUsername) {
            setViewingUser(data.githubUsername);
            loadProjects(data.githubUsername);
          } else {
            setIsSettingsOpen(true);
          }
        }

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const uData = await usersRes.value.json();
          setTrackedUsers(uData.users || []);
        }

        if (reqsRes.status === 'fulfilled' && reqsRes.value.ok) {
          const rData = await reqsRes.value.json();
          setProgressRequests(rData.requests || []);
        }
      } catch (err) {
        console.error('Failed to initialize GitPulse:', err);
      }
    }
    init();
  }, []);

  // 2. Fetch community directory
  const loadDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const [usersRes, reqsRes] = await Promise.allSettled([
        fetch('/api/users'),
        fetch('/api/users/requests')
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const uData = await usersRes.value.json();
        setTrackedUsers(uData.users || []);
      }

      if (reqsRes.status === 'fulfilled' && reqsRes.value.ok) {
        const rData = await reqsRes.value.json();
        setProgressRequests(rData.requests || []);
      }
    } catch (e) {
      console.error('Error refreshing directory:', e);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  // 3. Load Projects for a specified user
  const loadProjects = async (targetUsername = null, force = false) => {
    const userToFetch = targetUsername || viewingUser || settings.githubUsername;
    if (!userToFetch) return;

    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/repos${force ? '?forceRefresh=true' : ''}${userToFetch ? `${force ? '&' : '?'}username=${userToFetch}` : ''}`;
      const reposRes = await fetch(url);

      if (!reposRes.ok) {
        const errData = await reposRes.json();
        throw new Error(errData.error || `Failed to fetch repositories for @${userToFetch}`);
      }

      const reposData = await reposRes.json();
      setRepos(reposData.repos || []);
      setViewingUser(userToFetch);

      // Refresh directory in background to reflect newly tracked user
      loadDirectory();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Instant Reactive Stats Calculation (immune to async race conditions)
  const stats = useMemo(() => {
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

  // 5. Update Project Status (e.g. mark v1 complete)
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
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // 6. Save Settings
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
      setViewingUser(data.githubUsername);
      loadProjects(data.githubUsername, true);
    }
  };

  // 7. Select user to view
  const handleSelectUser = (username, force = false) => {
    setViewingUser(username);
    setActiveTab('projects');
    loadProjects(username, force);
  };

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
        const targetActiveUser = viewingUser || settings.githubUsername;
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
  }, [repos, searchQuery, statusFilter, languageFilter, commitFilter, sortBy, viewingUser, settings.githubUsername]);

  const isViewingOther = Boolean(
    viewingUser && 
    settings.githubUsername && 
    viewingUser.toLowerCase() !== settings.githubUsername.toLowerCase()
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadProjects(viewingUser || settings.githubUsername, true)}
        isLoading={isLoading}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={settings.githubUsername}
        viewingUser={viewingUser}
        hasToken={settings.hasToken}
        trackedUsers={trackedUsers}
        onSelectUser={handleSelectUser}
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        
        {/* Banner when viewing someone else's portfolio */}
        {isViewingOther && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold">
                @{viewingUser.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Viewing @{viewingUser}'s Portfolio & Progress Report</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-normal">
                    Guest Mode
                  </span>
                </p>
                <p className="text-[11px] text-amber-400/80">
                  Showing auto-detected completion status and live milestones for @{viewingUser}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelectUser(settings.githubUsername)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Projects (@{settings.githubUsername})</span>
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline hover:text-white ml-4"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: COMMUNITY DIRECTORY / ALL DEVELOPERS LEADERBOARD  */}
        {/* ========================================================= */}
        {activeTab === 'community' ? (
          <UserDirectory
            users={trackedUsers}
            requests={progressRequests}
            currentUser={settings.githubUsername}
            onSelectUser={handleSelectUser}
            onRequestUser={() => setIsRequestModalOpen(true)}
            onRefreshDirectory={loadDirectory}
            isLoadingDirectory={isLoadingDirectory}
          />
        ) : (
          /* ========================================================= */
          /* VIEW 2: PROJECTS & INTERACTIVE PROGRESS PORTFOLIO        */
          /* ========================================================= */
          <>
            {/* Portfolio Stats Bar (Always reactive & in-sync with repos) */}
            <StatsOverview stats={stats} />

            {/* Interactive Visual Graph & Progress Matrix */}
            {repos.length > 0 && (
              <ProgressGraph
                projects={repos}
                stats={stats}
                activeStatusFilter={statusFilter}
                onSelectStatusFilter={setStatusFilter}
                activeLanguageFilter={languageFilter}
                onSelectLanguageFilter={setLanguageFilter}
                onSelectProject={setSelectedProject}
              />
            )}

            {/* Filter Controls Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#0e1424] p-3 rounded-2xl border border-slate-800">
              
              <div className="flex items-center gap-2 flex-wrap">
                
                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">All Statuses</option>
                    <option value="in_progress" className="bg-slate-900">🚀 In Progress</option>
                    <option value="needs_polish" className="bg-slate-900">🔍 Needs Polish</option>
                    <option value="paused" className="bg-slate-900">⏸️ Paused</option>
                    <option value="v1_complete" className="bg-slate-900">🏆 v1.0 Complete</option>
                    <option value="completed" className="bg-slate-900">✅ Completed</option>
                    <option value="archived" className="bg-slate-900">📦 Archived</option>
                  </select>
                </div>

                {/* Contribution / Commits Filter */}
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400">Commits:</span>
                  <select
                    value={commitFilter}
                    onChange={(e) => setCommitFilter(e.target.value)}
                    className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">All Repos</option>
                    <option value="committed" className="bg-slate-900">🟢 Committed by @{viewingUser || 'user'}</option>
                    <option value="not_committed" className="bg-slate-900">⚪ No Commits by @{viewingUser || 'user'}</option>
                    <option value="contributed" className="bg-slate-900">🤝 External Contributions</option>
                  </select>
                </div>

                {/* Language Filter */}
                {languages.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Language:</span>
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-slate-900">All Languages</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang} className="bg-slate-900">{lang}</option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

              {/* Sort Control & Count */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                <span className="text-slate-400">
                  Showing <span className="font-bold text-white">{filteredProjects.length}</span> of {repos.length} repos
                </span>

                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
                  >
                    <option value="pushed" className="bg-slate-900">Recently Active</option>
                    <option value="stars" className="bg-slate-900">Most Stars</option>
                    <option value="name" className="bg-slate-900">Project Name</option>
                    <option value="status" className="bg-slate-900">Status</option>
                  </select>
                </div>
              </div>

            </div>

            {/* View Switch: Grid vs Kanban */}
            {isLoading && repos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-spin">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Inspecting GitHub Projects...</h3>
                <p className="text-xs text-slate-400">
                  Reading repositories, live deployments, and markdown tasks for @{viewingUser || 'user'}
                </p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-300">No repositories found matching current filters.</p>
                <p className="text-xs text-slate-500">Try clearing filters or search query to view all repositories.</p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setLanguageFilter('all');
                    setCommitFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanView
                projects={filteredProjects}
                onSelectProject={setSelectedProject}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id || project.full_name}
                    project={project}
                    onOpenDetail={setSelectedProject}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* Deep-Dive Project Detail Drawer */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          onUpdateStatus={handleUpdateStatus}
          currentUser={viewingUser || settings.githubUsername}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        currentSettings={settings}
        onSave={handleSaveSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Request Progress Modal */}
      <RequestProgressModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentUser={settings.githubUsername}
        onProgressInspected={(userObj) => {
          loadDirectory();
          if (userObj?.username) {
            handleSelectUser(userObj.username, true);
          }
        }}
      />

    </div>
  );
}
