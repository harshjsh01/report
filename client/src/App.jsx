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
  AlertTriangle, 
  Activity, 
  GitCommit,
  CheckCircle2,
  ExternalLink,
  Users
} from 'lucide-react';
import { 
  getFriendlyStatus, 
  isNeedingAttention, 
  formatFriendlyDate 
} from './utils/status';

export default function App() {
  const [repos, setRepos] = useState([]);
  const [settings, setSettings] = useState({ githubUsername: '', hasToken: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Navigation tab: 'projects' | 'attention' | 'activity' | 'community'
  const [activeTab, setActiveTab] = useState('projects');
  // Currently inspected user/workspace (defaults to settings.githubUsername)
  const [viewingUser, setViewingUser] = useState('');

  // Community directory & requests
  const [trackedUsers, setTrackedUsers] = useState([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Filters & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('pushed'); // 'pushed' | 'name'

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Initial Load: Settings & Directory
  useEffect(() => {
    async function init() {
      try {
        const [settingsRes, usersRes] = await Promise.allSettled([
          fetch('/api/settings'),
          fetch('/api/users')
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
      } catch (err) {
        console.error('Failed to initialize workspace:', err);
      }
    }
    init();
  }, []);

  // 2. Refresh Community Members Directory
  const loadDirectory = async () => {
    setIsLoadingDirectory(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setTrackedUsers(data.users || []);
      }
    } catch (e) {
      console.error('Error refreshing directory:', e);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  // 3. Load Projects for Workspace or User
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
        throw new Error(errData.error || 'Failed to fetch community projects');
      }

      const reposData = await reposRes.json();
      setRepos(reposData.repos || []);
      setViewingUser(userToFetch);

      loadDirectory();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Instant Reactive Stats Calculation
  const stats = useMemo(() => {
    const totalRepos = repos.length;
    let inProgress = 0;
    let needsPolish = 0;
    let paused = 0;
    let v1Complete = 0;
    let completed = 0;
    let archived = 0;

    repos.forEach(repo => {
      const friendly = getFriendlyStatus(repo.status || repo.autoStatus);
      switch (friendly.key) {
        case 'active':
          inProgress++;
          break;
        case 'needs_attention':
          needsPolish++;
          break;
        case 'completed':
          completed++;
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

    const totalFinished = completed;
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
      completionPercentage
    };
  }, [repos]);

  // Projects needing attention
  const attentionProjects = useMemo(() => {
    return repos.filter(p => isNeedingAttention(p));
  }, [repos]);

  // 5. Update Project Status
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

  // 6. Save Workspace Settings
  const handleSaveSettings = async (newSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
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

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return repos
      .filter(project => {
        // If on dedicated 'attention' tab, enforce attention filter
        if (activeTab === 'attention') {
          if (!isNeedingAttention(project)) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = project.name?.toLowerCase().includes(q);
          const matchDesc = project.description?.toLowerCase().includes(q);
          const matchLang = project.language?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchLang) return false;
        }

        // Status filter
        if (statusFilter !== 'all') {
          const friendly = getFriendlyStatus(project.status || project.autoStatus);
          if (friendly.key !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // Default: pushed (most recent first)
        const dateA = new Date(a.pushed_at || a.updated_at || 0).getTime();
        const dateB = new Date(b.pushed_at || b.updated_at || 0).getTime();
        return dateB - dateA;
      });
  }, [repos, searchQuery, statusFilter, sortBy, activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Navigation Header */}
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
        workspaceName={viewingUser ? `@${viewingUser}` : 'Community Hub'}
        needsAttentionCount={attentionProjects.length}
        trackedMembersCount={trackedUsers.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline hover:text-white ml-4"
            >
              Workspace Settings
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: NEEDS ATTENTION (LAYER 2: What needs attention?)  */}
        {/* ========================================================= */}
        {activeTab === 'attention' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-1">
                <AlertTriangle className="w-5 h-5" />
                <h2>Projects Requiring Community Attention</h2>
              </div>
              <p className="text-xs text-slate-400">
                These community projects have open issues, pending tasks, or require member review before completion.
              </p>
            </div>

            {attentionProjects.length === 0 ? (
              <div className="bg-[#0f172a]/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-200">No Projects Need Immediate Attention</h3>
                <p className="text-xs text-slate-500">All community initiatives are healthy and progressing smoothly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attentionProjects.map((project) => (
                  <ProjectCard
                    key={project.id || project.full_name}
                    project={project}
                    onOpenDetail={setSelectedProject}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: RECENT ACTIVITY                                   */}
        {/* ========================================================= */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
              <h2 className="text-xl font-bold text-white tracking-tight">Recent Project Activity</h2>
              <p className="text-xs text-slate-400 mt-1">
                Overview of recent development updates, commits, and milestone progress across community projects.
              </p>
            </div>

            <div className="bg-[#0f172a]/60 border border-slate-800 rounded-3xl p-6 divide-y divide-slate-800/80">
              {repos.slice(0, 15).map((project) => (
                <div 
                  key={project.full_name || project.id}
                  onClick={() => setSelectedProject(project)}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/20 -mx-3 px-3 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <GitCommit className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white hover:text-emerald-400 transition-colors truncate">
                        {project.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {project.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-xs text-slate-400">
                      {formatFriendlyDate(project.pushed_at || project.updated_at)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getFriendlyStatus(project.status || project.autoStatus).badgeClass}`}>
                      {getFriendlyStatus(project.status || project.autoStatus).label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: COMMUNITY MEMBERS DIRECTORY                       */}
        {/* ========================================================= */}
        {activeTab === 'community' && (
          <UserDirectory
            users={trackedUsers}
            currentUser={settings.githubUsername}
            onSelectUser={handleSelectUser}
            onRequestUser={() => setIsRequestModalOpen(true)}
            onRefreshDirectory={loadDirectory}
            isLoadingDirectory={isLoadingDirectory}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 4: MAIN PROJECTS DASHBOARD                           */}
        {/* ========================================================= */}
        {activeTab === 'projects' && (
          <>
            {/* Top KPIs Summary Bar */}
            <StatsOverview 
              stats={stats} 
              activeFilter={statusFilter}
              onSelectFilter={(f) => {
                if (f === 'needs_attention') {
                  setActiveTab('attention');
                } else {
                  setStatusFilter(f);
                }
              }}
            />

            {/* Visual Status Breakdown */}
            {repos.length > 0 && (
              <ProgressGraph
                projects={repos}
                activeStatusFilter={statusFilter}
                onSelectStatusFilter={setStatusFilter}
                onSelectProject={setSelectedProject}
              />
            )}

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#0f172a]/70 p-3 rounded-2xl border border-slate-800">
              
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    statusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  All ({repos.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    statusFilter === 'active'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Active ({stats.inProgress})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('needs_attention')}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    statusFilter === 'needs_attention'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Needs Attention ({stats.needsPolish})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Completed ({stats.totalFinished})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('paused')}
                  className={`px-3 py-1.5 rounded-xl transition-all font-medium ${
                    statusFilter === 'paused'
                      ? 'bg-slate-700 text-slate-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Paused ({stats.paused})
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="pushed">Recently Active</option>
                  <option value="name">Project Name</option>
                </select>
              </div>

            </div>

            {/* Projects Grid or Kanban View */}
            {isLoading && repos.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Loading community workspace projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-[#0f172a]/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-300">No projects match the current filter.</p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition-all"
                >
                  Clear Filters
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

      {/* Project Detail Modal / Drawer */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          onUpdateStatus={handleUpdateStatus}
          currentUser={viewingUser || settings.githubUsername}
        />
      )}

      {/* Workspace Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        currentSettings={settings}
        onSave={handleSaveSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Add Member Modal */}
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
