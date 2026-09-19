import React, { useState } from 'react';
import { 
  X, 
  Search, 
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function RequestProgressModal({ 
  isOpen, 
  onClose, 
  currentUsername, 
  onRequestSuccess,
  onInspectUser 
}) {
  const [targetUsername, setTargetUsername] = useState('');
  const [requesterName, setRequesterName] = useState(currentUsername ? `@${currentUsername}` : '');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      setError('Please enter a target GitHub username');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/users/request-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: targetUsername.trim(),
          requesterName: requesterName.trim() || 'Anonymous Developer',
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect user progress');
      }

      setResult(data);
      if (onRequestSuccess) onRequestSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspect = () => {
    if (result?.user?.username && onInspectUser) {
      onInspectUser(result.user.username);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Request / Inspect Progress</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Check any developer's real-time GitHub completion status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result Card */}
        {result ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={result.user.avatar_url} 
                  alt={result.user.username} 
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{result.user.name || result.user.username}</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">@{result.user.username}</p>
                  {result.user.bio && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{result.user.bio}</p>}
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{result.user.completionPercentage}%</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Completion Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-transparent">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{result.user.totalRepos}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Repos</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{result.user.v1Complete}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">v1.0 Shipped</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{result.user.completed}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Completed</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleInspect}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>View @{result.user.username}'s Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => { setResult(null); setTargetUsername(''); }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Check Another
              </button>
            </div>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target Username */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target GitHub Username <span className="text-emerald-500 dark:text-emerald-400">*</span>
              </label>
              <div className="relative">
                <GithubIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. octocat, torvalds, dev..."
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Requester Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Your Name / Handle (Shown in Community Activity)
              </label>
              <input
                type="text"
                placeholder="e.g. Alex, Tech Lead, Team Peer..."
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Note / Message */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Note / Reason (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Reviewing v1 completion progress for team sync..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Inspecting GitHub Projects & Completion Status...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Inspect & Track Progress</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
