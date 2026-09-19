import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function RequestProgressModal({
  isOpen,
  onClose,
  currentUser = '',
  onProgressInspected
}) {
  const [targetUsername, setTargetUsername] = useState('');
  const [requesterName, setRequesterName] = useState(currentUser || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessResult(null);

    try {
      const res = await fetch('/api/users/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: targetUsername.trim(),
          requesterName: requesterName.trim() || currentUser || 'Workspace Member',
          message: message.trim() || 'Added to community workspace'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect user projects');
      }

      setSuccessResult(data);
      if (onProgressInspected) {
        onProgressInspected(data.user || { username: targetUsername.trim() });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTargetUsername('');
    setMessage('');
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Member to Workspace</h3>
              <p className="text-xs text-slate-400">
                Inspect public projects and milestones for any community member
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Member Added Successfully</span>
            </div>
            <p className="text-slate-300">
              Found {successResult.user?.totalRepos || 0} projects for @{successResult.request?.targetUsername}.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all"
            >
              View Member Projects
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {!successResult && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* GitHub Username */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                GitHub Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  placeholder="github-username"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Note / Context */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Note / Role <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Contributor, Design Lead, Full-stack"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-slate-500 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !targetUsername.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing Projects...</span>
                  </>
                ) : (
                  <span>Add & Sync Projects</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
