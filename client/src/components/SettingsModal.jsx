import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  Building2,
  Check
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
        className="relative w-full max-w-md bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Workspace Configuration</h3>
              <p className="text-xs text-slate-400">Connect your community's projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* GitHub Account or Organization */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              GitHub Account or Organization
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono">@</span>
              <input
                type="text"
                placeholder="community-account"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              The primary account or organization where your community projects reside.
            </p>
          </div>

          {/* Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Access Token <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              {activeSettings.hasToken && (
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Configured
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <KeyRound className="w-3.5 h-3.5" />
              </span>
              <input
                type="password"
                placeholder={activeSettings.hasToken ? '••••••••••••••••••••••••' : 'Paste token for private projects'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Enables tracking private community projects and prevents rate limits. Kept securely on your local server.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !username.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : hasSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save & Sync</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
