import React from 'react';
import { 
  FolderGit2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function StatsOverview({ 
  stats = {}, 
  activeFilter = 'all', 
  onSelectFilter 
}) {
  const {
    totalRepos = 0,
    inProgress = 0,
    needsPolish = 0,
    v1Complete = 0,
    completed = 0,
    completionPercentage = 0,
    totalFinished = 0
  } = stats;

  const totalCompleted = v1Complete + completed;
  const needsAttentionCount = needsPolish;

  return (
    <div className="space-y-4 mb-8">
      {/* 5 High-Signal Community KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* 1. Total Projects */}
        <button
          type="button"
          onClick={() => onSelectFilter && onSelectFilter('all')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-800/90 border-slate-600 shadow-sm'
              : 'bg-[#0f172a]/70 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{totalRepos}</div>
          <p className="text-xs text-slate-400 mt-1">Community workspace</p>
        </button>

        {/* 2. Active Projects */}
        <button
          type="button"
          onClick={() => onSelectFilter && onSelectFilter('active')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeFilter === 'active'
              ? 'bg-sky-500/10 border-sky-500/50 shadow-sm'
              : 'bg-[#0f172a]/70 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-sky-300 tracking-tight">{inProgress}</div>
          <p className="text-xs text-slate-400 mt-1">Ongoing development</p>
        </button>

        {/* 3. Needs Attention */}
        <button
          type="button"
          onClick={() => onSelectFilter && onSelectFilter('needs_attention')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeFilter === 'needs_attention'
              ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
              : needsAttentionCount > 0
              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
              : 'bg-[#0f172a]/70 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Attention</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-amber-300 tracking-tight flex items-baseline gap-2">
            {needsAttentionCount}
            {needsAttentionCount > 0 && (
              <span className="text-[11px] font-medium text-amber-400">review</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">Open issues or pending items</p>
        </button>

        {/* 4. Completed Projects */}
        <button
          type="button"
          onClick={() => onSelectFilter && onSelectFilter('completed')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            activeFilter === 'completed'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
              : 'bg-[#0f172a]/70 hover:bg-[#0f172a] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-300 tracking-tight">{totalCompleted}</div>
          <p className="text-xs text-slate-400 mt-1">Shipped & finished</p>
        </button>

        {/* 5. Overall Workspace Progress */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl lg:text-3xl font-bold text-emerald-400">{completionPercentage}%</span>
              <span className="text-xs text-slate-400 font-medium">{totalFinished} of {totalRepos} done</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
