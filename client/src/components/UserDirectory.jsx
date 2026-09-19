import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Clock, 
  ExternalLink, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function UserDirectory({ 
  onSelectUser, 
  onOpenRequestModal,
  currentUser 
}) {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const [usersRes, reqsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/progress-requests')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        setRequests(reqsData.requests || []);
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => 
      u.username?.toLowerCase().includes(q) || 
      u.name?.toLowerCase().includes(q) ||
      (u.topLanguages || []).some(l => l.toLowerCase().includes(q))
    );
  }, [users, search]);

  const avgCompletion = useMemo(() => {
    if (users.length === 0) return 0;
    const total = users.reduce((acc, u) => acc + (u.completionPercentage || 0), 0);
    return Math.round(total / users.length);
  }, [users]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Directory Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-[#0f172a] dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Community Progress Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Developers & Project Leaders
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Inspect any peer or team member's project progress, auto-detected completion milestones, and technology stack.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRequestModal}
              className="py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Request / Check Progress</span>
            </button>
            <button
              onClick={fetchDirectory}
              disabled={isLoading}
              className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{users.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tracked Developers</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgCompletion}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg Portfolio Completion</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-300">{requests.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Peer Checks Conducted</div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1424] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter developers by name, username, or programming language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/70 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 px-2 flex items-center justify-end">
          Showing <span className="font-bold text-slate-900 dark:text-white mx-1">{filteredUsers.length}</span> of {users.length} developers
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Developers Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {search ? 'Try clearing your search filters.' : 'Be the first to inspect and track a developer portfolio!'}
          </p>
          <button
            onClick={onOpenRequestModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
          >
            Request & Track a GitHub User
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const isSelf = currentUser && user.username?.toLowerCase() === currentUser.toLowerCase();
            return (
              <div 
                key={user.username}
                className={`flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900/60 border ${
                  isSelf ? 'border-emerald-500/50 shadow-md shadow-emerald-500/5' : 'border-slate-200 dark:border-slate-800'
                } hover:border-slate-300 dark:hover:border-slate-700 transition-all group shadow-sm`}
              >
                <div>
                  
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar_url || `https://github.com/${user.username}.png`} 
                        alt={user.username}
                        className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {user.name || user.username}
                          </h4>
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={user.html_url || `https://github.com/${user.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-mono flex items-center gap-1 cursor-pointer"
                          >
                            <span>@{user.username}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Completion rate pill */}
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {user.completionPercentage ?? 0}%
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                        Completion
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 italic">
                      "{user.bio}"
                    </p>
                  )}

                  {/* KPI Badges */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 text-center mb-4">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white">{user.totalRepos || 0}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Repos</div>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-amber-600 dark:text-amber-300">{user.v1Complete || 0}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">v1.0 Shipped</div>
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-300">{user.completed || 0}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Completed</div>
                    </div>
                  </div>

                  {/* Top Languages */}
                  {user.topLanguages && user.topLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {user.topLanguages.map(lang => (
                        <span 
                          key={lang} 
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Inspect Dashboard Action */}
                <button
                  onClick={() => onSelectUser(user.username)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-emerald-500 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-emerald-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-transparent transition-all group-hover:border-emerald-500/50 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Inspect Progress Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Community Progress Requests Feed */}
      {requests.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Progress Check Activity</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{requests.length} checks logged</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">{req.requesterName}</span> requested progress check for{' '}
                    <button
                      onClick={() => onSelectUser(req.targetUsername)}
                      className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      @{req.targetUsername}
                    </button>
                  </span>
                  {req.message && (
                    <span className="text-xs text-slate-500 italic hidden md:inline">
                      — "{req.message}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {req.resultsSnapshot && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-slate-800 text-[10px] text-emerald-700 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-transparent">
                      {req.resultsSnapshot.completionPercentage}% complete ({req.resultsSnapshot.totalRepos} repos)
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
