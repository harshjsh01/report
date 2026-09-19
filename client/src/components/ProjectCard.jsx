import React from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PauseCircle, 
  Archive, 
  ExternalLink, 
  Star, 
  GitFork, 
  CircleDot, 
  CheckSquare, 
  SlidersHorizontal,
  Lock,
  Globe,
  Sparkles
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';

const STATUS_CONFIG = {
  in_progress: {
    label: 'In Progress',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    icon: Clock
  },
  needs_polish: {
    label: 'Needs Polish',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle
  },
  paused: {
    label: 'Paused',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    icon: PauseCircle
  },
  v1_complete: {
    label: 'v1.0 Complete',
    color: 'text-amber-300 bg-amber-500/20 border-amber-500/50 shadow-sm shadow-amber-500/20',
    icon: Trophy
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50 shadow-sm shadow-emerald-500/20',
    icon: CheckCircle2
  },
  archived: {
    label: 'Archived',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    icon: Archive
  }
};

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python: 'bg-emerald-400',
  HTML: 'bg-orange-500',
  CSS: 'bg-indigo-400',
  Go: 'bg-cyan-400',
  Rust: 'bg-amber-600',
  Java: 'bg-red-400',
  'C++': 'bg-pink-400',
  'C#': 'bg-purple-500',
  PHP: 'bg-violet-400',
  Ruby: 'bg-rose-500',
  Dart: 'bg-teal-400',
  Swift: 'bg-orange-400',
  Vue: 'bg-emerald-500',
  Kotlin: 'bg-purple-400'
};

export default function ProjectCard({ project, onUpdateStatus, onSelectProject }) {
  const currentStatus = project.status || (project.archived ? 'archived' : 'in_progress');
  const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.in_progress;
  const StatusIcon = statusMeta.icon;

  // Calculate tasks summary
  const customTasks = project.customTasks || [];
  const completedCustom = customTasks.filter(t => t.completed).length;
  const hasCustomTasks = customTasks.length > 0;

  const isCompleteOrV1 = currentStatus === 'v1_complete' || currentStatus === 'completed';

  const handleQuickV1 = (e) => {
    e.stopPropagation();
    triggerConfetti();
    onUpdateStatus(project.owner, project.name, 'v1_complete');
  };

  const handleQuickComplete = (e) => {
    e.stopPropagation();
    triggerConfetti();
    onUpdateStatus(project.owner, project.name, 'completed');
  };

  // Format date
  const lastActive = project.pushed_at || project.updated_at;
  const activeDate = lastActive ? new Date(lastActive).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'Unknown';

  const langColor = LANGUAGE_COLORS[project.language] || 'bg-slate-400';

  return (
    <div 
      onClick={() => onSelectProject(project)}
      className={`group relative flex flex-col justify-between bg-[#111726]/80 hover:bg-[#151d30] border rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
        currentStatus === 'v1_complete'
          ? 'border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-500/5'
          : currentStatus === 'completed'
          ? 'border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-500/5'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              {project.name}
            </h3>
            {project.is_private ? (
              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" /> Private
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                <Globe className="w-2.5 h-2.5" /> Public
              </span>
            )}
          </div>

          {/* GitHub External Link */}
          <a
            href={project.html_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Open repository on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-2.5">
          {project.description || 'No description provided.'}
        </p>

        {/* Live app & Auto-detected insight */}
        {project.autoReason && (
          <div className="mb-3.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{project.autoReason}</span>
          </div>
        )}
      </div>

      {/* Center Details: Language, Dates, Stats */}
      <div>
        {/* Contribution & Commits Badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {project.homepage && (
            <a
              href={project.homepage}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" /> Live App
            </a>
          )}
          {project.user_committed ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Committed by you
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              No commits by you yet
            </span>
          )}

          {project.is_contributed && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              🤝 External Contribution
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-3.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${langColor}`}></span>
            <span className="font-medium text-slate-300">{project.language || 'Plain'}</span>
          </div>

          <div className="flex items-center gap-3">
            {project.stars > 0 && (
              <span className="flex items-center gap-1 hover:text-amber-400 transition-colors" title="Stars">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {project.stars}
              </span>
            )}
            {project.open_issues_count > 0 && (
              <span className="flex items-center gap-1 text-slate-400" title="Open Issues">
                <CircleDot className="w-3 h-3 text-amber-400" />
                {project.open_issues_count}
              </span>
            )}
            <span className="text-[11px] text-slate-500">Active {activeDate}</span>
          </div>
        </div>

        {/* Custom Tasks Checklist Progress Bar (if user added tasks) */}
        {hasCustomTasks && (
          <div className="mb-3.5 bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-emerald-400" />
                Checklist
              </span>
              <span className="font-mono font-semibold text-emerald-400">
                {completedCustom} / {customTasks.length} ({Math.round((completedCustom / customTasks.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedCustom / customTasks.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between gap-2 pt-2">
          
          {/* Status Dropdown */}
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <select
              value={currentStatus}
              onChange={(e) => onUpdateStatus(project.owner, project.name, e.target.value)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border appearance-none pr-7 cursor-pointer focus:outline-none transition-all ${statusMeta.color}`}
            >
              <option value="in_progress" className="bg-slate-900 text-slate-200">🚀 In Progress</option>
              <option value="needs_polish" className="bg-slate-900 text-slate-200">🔍 Needs Polish</option>
              <option value="paused" className="bg-slate-900 text-slate-200">⏸️ Paused</option>
              <option value="v1_complete" className="bg-slate-900 text-amber-300">🏆 v1.0 Complete</option>
              <option value="completed" className="bg-slate-900 text-emerald-300">✅ Completed</option>
              <option value="archived" className="bg-slate-900 text-slate-400">📦 Archived</option>
            </select>
            <StatusIcon className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {currentStatus !== 'v1_complete' && (
              <button
                onClick={handleQuickV1}
                title="Mark Version 1 Complete"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold transition-all hover:scale-105"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">v1 Done</span>
              </button>
            )}

            {currentStatus !== 'completed' && (
              <button
                onClick={handleQuickComplete}
                title="Mark Finished / Complete"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Done</span>
              </button>
            )}

            <button
              onClick={() => onSelectProject(project)}
              title="Inspect details, README tasks & plan"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
