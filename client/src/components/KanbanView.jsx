import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PauseCircle, 
  Archive, 
  ExternalLink,
  Globe
} from 'lucide-react';
import { getFriendlyStatus, formatFriendlyDate } from '../utils/status';

const KANBAN_COLUMNS = [
  { id: 'active', title: 'Active', icon: Clock, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { id: 'needs_attention', title: 'Needs Attention', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'paused', title: 'Paused', icon: PauseCircle, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  { id: 'archived', title: 'Archived', icon: Archive, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
];

export default function KanbanView({ projects = [], onUpdateStatus, onSelectProject }) {
  // Group projects by friendly status
  const columnsData = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = projects.filter(p => {
      const friendly = getFriendlyStatus(p.status || p.autoStatus);
      return friendly.key === col.id;
    });
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-8 pt-2">
      {KANBAN_COLUMNS.map((column) => {
        const colProjects = columnsData[column.id] || [];
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className="flex flex-col min-w-[280px] max-w-[320px] w-full bg-[#0f172a]/70 border border-slate-800 rounded-2xl p-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${column.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{column.title}</h4>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {colProjects.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
              {colProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                  No projects
                </div>
              ) : (
                colProjects.map((project) => {
                  const tasks = project.customTasks || [];
                  const doneTasks = tasks.filter(t => t.completed).length;

                  return (
                    <div
                      key={project.full_name || project.id}
                      onClick={() => onSelectProject && onSelectProject(project)}
                      className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h5 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                          {project.name}
                        </h5>
                        {project.html_url && (
                          <a
                            href={project.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-500 hover:text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                        {project.description || 'No description provided'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                        {project.homepage ? (
                          <span className="text-teal-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Live
                          </span>
                        ) : (
                          <span>{project.language || 'Code'}</span>
                        )}

                        <span>{formatFriendlyDate(project.pushed_at || project.updated_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
