import React from 'react';
import { 
  FolderGit2, 
  AlertTriangle, 
  Activity, 
  Users, 
  Settings, 
  Search, 
  LayoutGrid, 
  Kanban, 
  RefreshCw 
} from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  viewMode, 
  setViewMode, 
  activeTab = 'projects', // 'projects' | 'attention' | 'activity' | 'community'
  setActiveTab,
  onRefresh, 
  isLoading, 
  onOpenSettings,
  workspaceName = 'Community Hub',
  needsAttentionCount = 0,
  trackedMembersCount = 0
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Community Workspace Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold shadow-sm">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  {workspaceName}
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Projects
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Workspace Progress & Project Hub</p>
            </div>
          </div>

          {/* Settings trigger on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Workspace Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1 text-xs overflow-x-auto max-w-full">
          
          {/* 1. Projects */}
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          {/* 2. Needs Attention */}
          <button
            onClick={() => setActiveTab('attention')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'attention'
                ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Needs Attention</span>
            {needsAttentionCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold ml-0.5">
                {needsAttentionCount}
              </span>
            )}
          </button>

          {/* 3. Recent Activity */}
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>

          {/* 4. Community Members */}
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'community'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members</span>
            {trackedMembersCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-bold ml-0.5">
                {trackedMembersCount}
              </span>
            )}
          </button>

        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Search Bar */}
          {activeTab === 'projects' && (
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* View Switch: Grid vs Kanban */}
          {activeTab === 'projects' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Board View"
              >
                <Kanban className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh community projects"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Workspace Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all hidden md:flex"
            title="Workspace Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
