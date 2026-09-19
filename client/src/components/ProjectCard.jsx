import React from 'react';
import { 
  ExternalLink, 
  Globe, 
  AlertTriangle, 
  CheckSquare, 
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';
import { 
  getFriendlyStatus, 
  getHumanReadableReason, 
  formatFriendlyDate,
  mapToBackendStatus,
  isNeedingAttention
} from '../utils/status';

export default function ProjectCard({ project, onOpenDetail, onUpdateStatus }) {
  const friendly = getFriendlyStatus(project.status || project.autoStatus);
  const reason = getHumanReadableReason(project);
  const StatusIcon = friendly.icon;
  const needsAttention = isNeedingAttention(project);

  // Tasks progress
  const customTasks = project.customTasks || [];
  const completedCustom = customTasks.filter(t => t.completed).length;
  const hasTasks = customTasks.length > 0;

  const handleStatusChange = (e) => {
    e.stopPropagation();
    const friendlyKey = e.target.value;
    const backendStatus = mapToBackendStatus(friendlyKey);
    onUpdateStatus(project.owner, project.name, backendStatus);
  };

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(project);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between bg-[#0f172a]/70 hover:bg-[#111c33] border rounded-3xl p-5 transition-all duration-200 cursor-pointer shadow-sm ${
        needsAttention
          ? 'border-amber-500/30 hover:border-amber-500/50'
          : friendly.key === 'completed'
          ? 'border-emerald-500/30 hover:border-emerald-500/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                {project.name}
              </h3>

              {project.is_private && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  Private
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
              {project.description || 'No project description provided yet.'}
            </p>
          </div>

          {/* Repository Link */}
          {project.html_url && (
            <a
              href={project.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
              title="Open source repository"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Status Context & Reason Pill */}
        {reason && (
          <div className="mb-4 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] flex items-center gap-2 text-slate-300">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
              reason.type === 'manual' 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'bg-slate-800 text-slate-400'
            }`}>
              {reason.label}
            </span>
            <span className="truncate text-slate-300">{reason.detail}</span>
          </div>
        )}
      </div>

      {/* Middle Section: Progress & Key Signals */}
      <div>
        {/* Task progress if tasks exist */}
        {hasTasks ? (
          <div className="mb-4 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project Tasks</span>
              </span>
              <span className="font-mono font-medium text-emerald-400">
                {completedCustom} of {customTasks.length} done
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedCustom / customTasks.length) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : null}

        {/* Badges Row: Live App & Issues */}
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          {project.homepage && (
            <a
              href={project.homepage}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>Live Website</span>
            </a>
          )}

          {project.open_issues_count > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>{project.open_issues_count} open issue{project.open_issues_count === 1 ? '' : 's'}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>0 issues</span>
            </span>
          )}

          <span className="text-[11px] text-slate-500 ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatFriendlyDate(project.pushed_at || project.updated_at)}</span>
          </span>
        </div>

        {/* Card Footer: Status Selector & Details Trigger */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          
          {/* Quick Status Dropdown */}
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <select
              value={friendly.key}
              onChange={handleStatusChange}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border appearance-none pr-7 cursor-pointer focus:outline-none transition-all ${friendly.badgeClass}`}
            >
              <option value="active" className="bg-slate-900 text-slate-200">Active</option>
              <option value="needs_attention" className="bg-slate-900 text-amber-300">Needs Attention</option>
              <option value="completed" className="bg-slate-900 text-emerald-300">Completed</option>
              <option value="paused" className="bg-slate-900 text-slate-400">Paused</option>
              <option value="archived" className="bg-slate-900 text-purple-400">Archived</option>
            </select>
            <StatusIcon className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
          </div>

          {/* Open Details Button */}
          <button
            type="button"
            onClick={handleCardClick}
            className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    </div>
  );
}
