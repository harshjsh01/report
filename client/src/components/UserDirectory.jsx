import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  ExternalLink, 
  ArrowUpRight, 
  RefreshCw,
  UserPlus,
  FolderGit2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { formatFriendlyDate } from '../utils/status';

export default function UserDirectory({
  users = [],
  currentUser = '',
  onSelectUser,
  onRequestUser,
  onRefreshDirectory,
  isLoadingDirectory
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter members
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchUser = u.username?.toLowerCase().includes(q);
      const matchName = u.name?.toLowerCase().includes(q);
      const matchBio = u.bio?.toLowerCase().includes(q);
      const matchLang = (u.topLanguages || []).some(l => l.toLowerCase().includes(q));
      return matchUser || matchName || matchBio || matchLang;
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0f172a]/70 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Community Members & Contributors</h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse members participating in community initiatives and inspect their project portfolios
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRequestUser}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member / Account</span>
          </button>

          <button
            onClick={onRefreshDirectory}
            disabled={isLoadingDirectory}
            title="Refresh members directory"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDirectory ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search members by name, handle, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 transition-all"
        />
      </div>

      {/* Members Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-[#0f172a]/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-300">No community members found.</p>
          <p className="text-xs text-slate-500">Add a member account to track their community contributions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isCurrent = currentUser && user.username?.toLowerCase() === currentUser.toLowerCase();
            const completedCount = (user.v1Complete || 0) + (user.completed || 0);

            return (
              <div 
                key={user.username}
                className="bg-[#0f172a]/70 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar_url || `https://github.com/${user.username}.png`} 
                        alt={user.username}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-700"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=38bdf8`;
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-sm">{user.name || user.username}</h3>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
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

                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-400">
                        {user.completionPercentage || 0}%
                      </span>
                      <span className="block text-[10px] text-slate-500">complete</span>
                    </div>
                  </div>

                  {user.bio && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {user.bio}
                    </p>
                  )}

                  {/* Summary counts */}
                  <div className="grid grid-cols-3 gap-2 py-2 mb-3 border-y border-slate-800/80 text-center text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Projects</span>
                      <span className="font-bold text-white">{user.totalRepos || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Completed</span>
                      <span className="font-bold text-emerald-400">{completedCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Active</span>
                      <span className="font-bold text-sky-400">{user.inProgress || 0}</span>
                    </div>
                  </div>

                  {/* Top Technologies */}
                  {user.topLanguages && user.topLanguages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      {user.topLanguages.map(lang => (
                        <span 
                          key={lang} 
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectUser && onSelectUser(user.username)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-700/60"
                  >
                    <span>View Projects</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
