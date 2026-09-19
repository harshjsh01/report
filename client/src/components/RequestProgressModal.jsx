import React, { useState } from 'react';
import { 
  X, 
  UserSearch, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FolderGit2
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
          requesterName: requesterName.trim() || currentUser || 'Anonymous Developer',
          message: message.trim() || `I want to check your project completion progress and milestones!`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request user progress');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0d131f] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <UserSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Request & Inspect User Progress</h3>
              <p className="text-xs text-slate-400">
                Track any GitHub developer, scan their repos, and review their completion milestones
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
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Progress Request Recorded & Inspected!</span>
            </div>
            <p className="text-slate-300">
              Successfully scanned <strong className="text-white">@{successResult.request?.targetUsername}</strong>.
              {successResult.user && (
                <span> Found {successResult.user.totalRepos} repositories with a {successResult.user.completionPercentage}% completion rate.</span>
              )}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  handleReset();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-all"
              >
                View Their Portfolio Now
              </button>
            </div>
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
            
            {/* Target GitHub Username */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <GithubIcon className="w-3.5 h-3.5 text-slate-400" />
                Target GitHub Username <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
                <input
                  type="text"
                  placeholder="e.g. torvalds, octocat, teammate_handle"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                GitPulse will fetch all public repositories, inspect markdown docs, and run the completion engine.
              </p>
            </div>

            {/* Requester Name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Your Name / Handle
              </label>
              <input
                type="text"
                placeholder={currentUser || "e.g. Harsh, Senior Engineer, Team Lead"}
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Optional Note / Message */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">
                Request Note / Message
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 'Hey, I want to check your project progress and completion rate!'"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition-all resize-none"
              ></textarea>
            </div>

            {/* Submit */}
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inspecting Repositories...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request & Inspect Progress</span>
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
