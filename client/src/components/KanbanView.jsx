import React from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PauseCircle, 
  Archive, 
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { triggerConfetti } from '../utils/confetti';

const COLUMNS = [
  { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10' },
  { id: 'needs_polish', title: 'Needs Polish', icon: AlertTriangle, color: 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
  { id: 'paused', title: 'Paused', icon: PauseCircle, color: 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' },
  { id: 'v1_complete', title: 'v1.0 Complete', icon: Trophy, color: 'border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-500/20' },
  { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/20' },
  { id: 'archived', title: 'Archived', icon: Archive, color: 'border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' }
];

export default function KanbanView({ projects, onUpdateStatus, onSelectProject }) {
  // Group projects by status
  const columnsData = COLUMNS.reduce((acc, col) => {
    acc[col.id] = projects.filter(p => {
      const s = p.status || (p.archived ? 'archived' : 'in_progress');
      return s === col.id;
    });
    return acc;
  }, {});

  const advanceStatus = (project, nextStatus) => {
    if (nextStatus === 'v1_complete' || nextStatus === 'completed') {
      triggerConfetti();
    }
    onUpdateStatus(project.owner, project.name, nextStatus);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-8 pt-2">
      {COLUMNS.map((column) => {
        const colProjects = columnsData[column.id] || [];
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className="flex flex-col min-w-[290px] max-w-[320px] w-full bg-slate-100/90 dark:bg-[#0d1322]/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-sm shadow-sm"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${column.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{column.title}</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent shadow-xs">
                {colProjects.length}
              </span>
            </div>

            {/* Cards in this column */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No projects here
                </div>
              ) : (
                colProjects.map((project) => {
                  const tasks = project.customTasks || [];
                  const doneTasks = tasks.filter(t => t.completed).length;

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="bg-white dark:bg-[#141b2d] hover:bg-slate-50 dark:hover:bg-[#182239] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {project.name}
                        </h5>
                        <a
                          href={project.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-2.5">
                        {project.description || 'No description'}
                      </p>

                      {/* Language & tasks count */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-2.5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{project.language || 'Plain'}</span>
                        {tasks.length > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            {doneTasks}/{tasks.length} tasks
                          </span>
                        )}
                      </div>

                      {/* Quick stage transition buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {column.id !== 'in_progress' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              advanceStatus(project, 'in_progress');
                            }}
                            title="Move back to In Progress"
                            className="text-[10px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <ChevronLeft className="w-3 h-3" /> In Progress
                          </button>
                        ) : <div></div>}

                        {column.id !== 'v1_complete' && column.id !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              advanceStatus(project, 'v1_complete');
                            }}
                            title="Advance to v1 Complete"
                            className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-0.5 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer"
                          >
                            <span>v1 Done</span> <ChevronRight className="w-3 h-3" />
                          </button>
                        )}

                        {column.id === 'v1_complete' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              advanceStatus(project, 'completed');
                            }}
                            className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer"
                          >
                            <span>Mark Done</span> <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
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
