import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Trophy, 
  CheckCircle2, 
  Search, 
  ExternalLink, 
  ArrowUpRight, 
  Sparkles, 
  Send, 
  Clock, 
  FolderGit2, 
  TrendingUp, 
  Code2,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function UserDirectory({
  users = [],
  requests = [],
  currentUser = '',
  onSelectUser,
  onRequestUser,
  onRefreshDirectory,
  isLoadingDirectory
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('completion'); // 'completion' | 'repos' | 'recent'
  const [refreshingUser, setRefreshingUser] = useState(null);

  // Filter & sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchUser = u.username?.toLowerCase().includes(q);
        const matchName = u.name?.toLowerCase().includes(q);
        const matchBio = u.bio?.toLowerCase().includes(q);
        const matchLang = (u.topLanguages || []).some(l => l.toLowerCase().includes(q));
        return matchUser || matchName || matchBio || matchLang;
      })
      .sort((a, b) => {
        if (sortBy === 'completion') {
          return (b.completionPercentage || 0) - (a.completionPercentage || 0);
        }
        if (sortBy === 'repos') {
          return (b.totalRepos || 0) - (a.totalRepos || 0);
        }
        return new Date(b.lastInspected || 0) - new Date(a.lastInspected || 0);
      });
  }, [users, searchQuery, sortBy]);

  // Aggregate metrics
  const totalDevelopers = users.length;
  const totalShippedOverall = users.reduce((acc, u) => acc + (u.v1Complete || 0) + (u.completed || 0), 0);
  const avgCompletion = totalDevelopers > 0
    ? Math.round(users.reduce((acc, u) => acc + (u.completionPercentage || 0), 0) / totalDevelopers)
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Directory Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1424] to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              Community & Team Progress Hub
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Developer Progress Leaderboard
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Inspect project completion rates across developers, browse peer portfolios in real-time, and request progress reviews for any GitHub account.
            </p>
          </div>

          {/* Action: Request / Track user */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRequestUser}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Request / Track Developer</span>
            </button>

            <button
              onClick={onRefreshDirectory}
              disabled={isLoadingDirectory}
              title="Refresh Directory"
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDirectory ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Summary KPI Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{totalDevelopers}</div>
              <p className="text-xs text-slate-400">Tracked Developers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-300">{totalShippedOverall}</div>
              <p className="text-xs text-slate-400">Shipped / Completed Repos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">{avgCompletion}%</div>
              <p className="text-xs text-slate-400">Average Portfolio Completion</p>
            </div>
          </div>
        </div>

      </div>

      {/* Directory Controls (Search & Sort) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e1424] p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search developers by name, username, technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-slate-400">
            Showing <span className="font-bold text-white">{filteredUsers.length}</span> developers
          </span>

          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="completion" className="bg-slate-900">Highest Completion %</option>
              <option value="repos" className="bg-slate-900">Most Repositories</option>
              <option value="recent" className="bg-slate-900">Recently Inspected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Developer Grid Cards */}
      {filteredUsers.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Developers Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery 
              ? `No developer matches "${searchQuery}". Try another keyword or request them directly.`
              : 'No developers are currently listed. Request any GitHub username to inspect their progress!'}
          </p>
          <button
            onClick={onRequestUser}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Track First Developer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user, idx) => {
            const isSelf = currentUser && user.username?.toLowerCase() === currentUser.toLowerCase();
            const finishedCount = (user.v1Complete || 0) + (user.completed || 0);

            return (
              <div 
                key={user.username}
                className="group relative bg-slate-900/60 border border-slate-800/90 hover:border-emerald-500/50 rounded-3xl p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between"
              >
                {/* Top Row: User Avatar, Name, Rank */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={user.avatar_url || `https://github.com/${user.username}.png`} 
                          alt={user.username}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-emerald-500 transition-colors"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=38bdf8`;
                          }}
                        />
                        {idx < 3 && (
                          <span className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            idx === 0 ? 'bg-amber-400 text-slate-950 ring-2 ring-slate-900' :
                            idx === 1 ? 'bg-slate-300 text-slate-950 ring-2 ring-slate-900' :
                            'bg-amber-700 text-white ring-2 ring-slate-900'
                          }`}>
                            #{idx + 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                            {user.name || user.username}
                          </h3>
                          {isSelf && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <a
                          href={`https://github.com/${user.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono mt-0.5"
                        >
                          <GithubIcon className="w-3 h-3" />
                          @{user.username}
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </div>
                    </div>

                    {/* Completion Pill */}
                    <div className="flex flex-col items-end">
                      <span className="text-base font-black text-emerald-400">
                        {user.completionPercentage || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                        Completion
                      </span>
                    </div>
                  </div>

                  {/* Bio if available */}
                  {user.bio && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 italic">
                      "{user.bio}"
                    </p>
                  )}

                  {/* Completion Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Milestones Shipped</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {finishedCount} / {user.totalRepos || 0} repos
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, user.completionPercentage || 0))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Breakdown Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-800">
                      <div className="text-xs font-bold text-amber-300">{user.v1Complete || 0}</div>
                      <div className="text-[10px] text-slate-400">v1.0 Shipped</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-800">
                      <div className="text-xs font-bold text-emerald-400">{user.completed || 0}</div>
                      <div className="text-[10px] text-slate-400">Completed</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-800">
                      <div className="text-xs font-bold text-sky-400">{user.totalRepos || 0}</div>
                      <div className="text-[10px] text-slate-400">Total Repos</div>
                    </div>
                  </div>

                  {/* Top Technologies */}
                  {user.topLanguages && user.topLanguages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {user.topLanguages.map(lang => (
                        <span 
                          key={lang} 
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-medium border border-slate-700/60"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onSelectUser(user.username)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600/90 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-700/70 hover:border-emerald-500 shadow-sm"
                  >
                    <span>View Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectUser(user.username, true)}
                    title="Re-inspect live data from GitHub"
                    className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Progress Requests Feed */}
      {requests && requests.length > 0 && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Recent Progress Check Requests</h3>
            </div>
            <span className="text-xs text-slate-400">{requests.length} total requests</span>
          </div>

          <div className="divide-y divide-slate-800">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    {req.requesterName?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <p className="text-slate-300">
                      <span className="font-bold text-white">{req.requesterName}</span> requested to inspect{' '}
                      <span className="font-mono text-emerald-400">@{req.targetUsername}</span>'s progress
                    </p>
                    {req.message && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">"{req.message}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onSelectUser(req.targetUsername)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white font-medium text-[11px] transition-all"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
