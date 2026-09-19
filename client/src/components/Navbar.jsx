import React from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  Settings, 
  Search, 
  LayoutGrid, 
  Kanban, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  FolderGit2 
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  viewMode, 
  setViewMode, 
  onRefresh, 
  isLoading, 
  onOpenSettings, 
  currentUser, 
  hasToken, 
  activeTab = 'dashboard', 
  setActiveTab, 
  onOpenRequestModal, 
  viewingUser = null, 
  onClearViewingUser 
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d131f]/80 backdrop-blur-md transition-colors duration-150">
      
      {/* Viewing Peer Notice Banner */}
      {viewingUser && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Inspecting portfolio for <strong className="font-mono text-slate-900 dark:text-white">@{viewingUser}</strong>
            </span>
            <button
              onClick={onClearViewingUser}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to My Dashboard</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tab Navigation */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
              <GitBranch className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Git<span className="text-emerald-600 dark:text-emerald-400">Pulse</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Tracker v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">GitHub Portfolio & Milestone Progress Hub</p>
            </div>
          </div>

          {/* Primary View Tabs */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 text-xs">
            <button
              onClick={() => {
                if (viewingUser && onClearViewingUser) onClearViewingUser();
                if (setActiveTab) setActiveTab('dashboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Projects</span>
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('community')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Community</span>
            </button>
          </div>

          {/* Mobile Theme & Settings Icons */}
          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (Only shown on dashboard tab) */}
        {activeTab === 'dashboard' && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by name, language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          
          {/* Request Progress Button */}
          <button
            onClick={onOpenRequestModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white hover:border-emerald-500/60 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Request Progress</span>
          </button>

          {/* View Mode Toggle (on dashboard) */}
          {activeTab === 'dashboard' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Sync latest repos from GitHub"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Theme Selector (Desktop) */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Settings & Account */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            {currentUser ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono">
                <GithubIcon className="w-3 h-3 text-slate-500 dark:text-slate-300" />
                @{currentUser}
              </span>
            ) : (
              <span>Connect GitHub</span>
            )}
            {hasToken && (
              <span title="PAT configured" className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
