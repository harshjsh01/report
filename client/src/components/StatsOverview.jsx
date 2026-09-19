import React from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  FolderGit2, 
  Star, 
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function StatsOverview({ stats }) {
  if (!stats) return null;

  const {
    totalRepos = 0,
    v1Complete = 0,
    completed = 0,
    inProgress = 0,
    needsPolish = 0,
    paused = 0,
    totalFinished = 0,
    completionPercentage = 0,
    totalStars = 0,
    totalForks = 0
  } = stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-8">
      
      {/* Total Repositories */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">All Projects</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FolderGit2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white">{totalRepos}</div>
          <p className="text-xs text-slate-400 mt-0.5">Repositories tracked</p>
        </div>
      </div>

      {/* Version 1 Complete */}
      <div className="bg-gradient-to-b from-amber-500/10 to-slate-900/60 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-sm hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-lg shadow-amber-500/5">
        <div className="flex items-center justify-between text-amber-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">v1.0 Complete</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-amber-300 flex items-baseline gap-1.5">
            {v1Complete}
            <span className="text-xs text-amber-400/80 font-medium">shipped</span>
          </div>
          <p className="text-xs text-amber-400/70 mt-0.5">Milestone 1.0 reached</p>
        </div>
      </div>

      {/* Fully Finished (100%) */}
      <div className="bg-gradient-to-b from-emerald-500/10 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-lg shadow-emerald-500/5">
        <div className="flex items-center justify-between text-emerald-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-300 flex items-baseline gap-1.5">
            {completed}
            <span className="text-xs text-emerald-400/80 font-medium">done</span>
          </div>
          <p className="text-xs text-emerald-400/70 mt-0.5">Fully marked complete</p>
        </div>
      </div>

      {/* Active Pipeline */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm hover:border-slate-700 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white flex items-baseline gap-2">
            {inProgress}
            {needsPolish > 0 && (
              <span className="text-xs font-medium text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10">
                +{needsPolish} polish
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Active developments</p>
        </div>
      </div>

      {/* Portfolio Completion Progress */}
      <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl lg:text-3xl font-black text-emerald-400">{completionPercentage}%</span>
            <span className="text-xs text-slate-400 font-mono">{totalFinished} / {totalRepos}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            ></div>
          </div>
        </div>
      </div>

    </div>
  );
}
