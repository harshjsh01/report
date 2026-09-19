import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function SettingsModal({ 
  isOpen = true,
  currentSettings, 
  settings,
  onSaveSettings, 
  onSave,
  onClose 
}) {
  const activeSettings = currentSettings || settings || {};
  const saveFn = onSaveSettings || onSave;
  const [username, setUsername] = useState(activeSettings.githubUsername || '');
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (activeSettings.githubUsername) {
      setUsername(activeSettings.githubUsername);
    }
  }, [activeSettings.githubUsername]);

  if (isOpen === false) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (typeof saveFn === 'function') {
        await saveFn({
          githubUsername: username.trim(),
          ...(token.trim() ? { githubToken: token.trim() } : {})
        });
      }
      setHasSaved(true);
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 700);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GitHub Connection Settings</h3>
              <p className="text-xs text-slate-400">Sync your repositories & configure API credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* GitHub Username */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              GitHub Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">@</span>
              <input
                type="text"
                placeholder="e.g. torvalds or your-github-handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Enter any GitHub username to automatically audit and track all their public projects.
            </p>
          </div>

          {/* Personal Access Token (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Personal Access Token (PAT) <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              {currentSettings?.hasToken && (
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Token Active
                </span>
              )}
            </div>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder={currentSettings?.hasToken ? '•••••••••••••••••••••••• (saved)' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="mt-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Why add a Personal Access Token?</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                <li>Increases rate limits from 60 to 5,000 requests/hour</li>
                <li>Includes private repositories in your portfolio tracker</li>
                <li>Enables 1-click GitHub v1.0.0 Release creation directly from the dashboard</li>
              </ul>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=GitPulse+Tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium pt-1"
              >
                <span>Generate a token on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {hasSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>{isSaving ? 'Connecting...' : 'Save & Sync'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
