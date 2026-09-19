import React, { useState } from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  Settings, 
  Search, 
  LayoutGrid, 
  Kanban, 
  CheckCircle2,
  Users,
  UserPlus,
  ChevronDown,
  FolderGit2,
  UserCheck
} from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  viewMode, 
  setViewMode, 
  activeTab = 'projects', // 'projects' | 'community'
  setActiveTab,
  onRefresh, 
  isLoading, 
  onOpenSettings,
  currentUser,
  viewingUser,
  hasToken,
  trackedUsers = [],
  onSelectUser,
  onOpenRequestModal
}) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const isViewingOther = viewingUser && currentUser && viewingUser.toLowerCase() !== currentUser.toLowerCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0d131f]/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
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
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Git<span className="text-emerald-400">Pulse</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Tracker v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">GitHub Portfolio & Milestone Progress Hub</p>
            </div>
          </div>

          {/* Navigation Tabs for Primary Views */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs ml-2 sm:ml-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'projects'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'community'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Community</span>
              {trackedUsers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-300 font-bold ml-0.5">
                  {trackedUsers.length}
                </span>
              )}
            </button>
          </div>

          {/* User info on mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (visible in projects view) */}
        {activeTab === 'projects' && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          
          {/* View Mode Toggle in projects view */}
          {activeTab === 'projects' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
          )}

          {/* Request / Track User Button */}
          <button
            onClick={onOpenRequestModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-500/20 hover:from-emerald-600/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Request Progress</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Sync latest repos from GitHub"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Active User Switcher / Profile Badge */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isViewingOther
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <GithubIcon className="w-3.5 h-3.5 text-slate-300" />
              <div className="flex items-center gap-1">
                {isViewingOther && <span className="text-[10px] text-amber-400 font-normal">Viewing:</span>}
                <span className="font-mono text-emerald-400">@{viewingUser || currentUser || 'Connect'}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0d1424] border border-slate-700 shadow-2xl p-2 z-50 animate-fadeIn text-xs"
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[11px] text-slate-400">Active Portfolio</p>
                  <p className="font-bold text-white font-mono">@{viewingUser || currentUser || 'Not configured'}</p>
                </div>

                {/* Return to Personal Account if viewing someone else */}
                {isViewingOther && currentUser && (
                  <button
                    onClick={() => {
                      onSelectUser(currentUser);
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-left font-semibold mb-1 transition-all"
                  >
                    <span>← Back to My Projects (@{currentUser})</span>
                  </button>
                )}

                {/* Tracked Users List */}
                {trackedUsers.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500">Tracked Developers</p>
                    {trackedUsers.map(u => (
                      <button
                        key={u.username}
                        onClick={() => {
                          onSelectUser(u.username);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-all ${
                          (viewingUser || currentUser)?.toLowerCase() === u.username.toLowerCase()
                            ? 'bg-emerald-600/20 text-emerald-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img 
                            src={u.avatar_url || `https://github.com/${u.username}.png`} 
                            alt={u.username} 
                            className="w-4 h-4 rounded-full" 
                          />
                          <span className="truncate">@{u.username}</span>
                        </div>
                        <span className="font-mono text-emerald-400 text-[11px] shrink-0">
                          {u.completionPercentage || 0}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-800 pt-1 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenRequestModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Request / Track New User</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account & Token Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Settings & Credentials"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>
      </div>
    </header>
  );
}
