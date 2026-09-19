import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Save, 
  Sparkles, 
  Users, 
  GitCommit, 
  GitPullRequest, 
  CircleDot, 
  Cpu, 
  ShieldCheck,
  Tag,
  Info
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { 
  getFriendlyStatus, 
  getHumanReadableReason, 
  formatFriendlyDate, 
  mapToBackendStatus 
} from '../utils/status';

export default function ProjectDetailModal({ 
  project, 
  isOpen, 
  onClose, 
  onUpdateStatus, 
  currentUser 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tasks' | 'docs' | 'issues' | 'updates' | 'technical'
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [statusKey, setStatusKey] = useState('active');
  const [priority, setPriority] = useState('medium');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch full details
  useEffect(() => {
    if (!project) return;
    let isMounted = true;
    async function fetchDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/repos/${project.owner}/${project.name}`);
        if (!res.ok) throw new Error('Failed to load project details');
        const data = await res.json();
        if (isMounted) {
          setDetails(data);
          const friendly = getFriendlyStatus(data.localData?.status || project.status || project.autoStatus);
          setStatusKey(friendly.key);
          setPriority(data.localData?.priority || project.priority || 'medium');
          setTargetDate(data.localData?.targetDate || project.targetDate || '');
          setNotes(data.localData?.notes || project.notes || '');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDetails();
    return () => { isMounted = false; };
  }, [project?.owner, project?.name]);

  if (!isOpen || !project) return null;

  // Handle status / metadata changes
  const handleSaveMetadata = async (newStatusKey = statusKey, newPriority = priority, newDate = targetDate, newNotes = notes) => {
    setIsSavingNotes(true);
    setSaveSuccess(false);
    const backendStatus = mapToBackendStatus(newStatusKey);
    try {
      const res = await fetch(`/api/repos/${project.owner}/${project.name}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: backendStatus,
          priority: newPriority,
          targetDate: newDate,
          notes: newNotes
        })
      });
      if (!res.ok) throw new Error('Failed to save project information');
      onUpdateStatus(project.owner, project.name, backendStatus, {
        priority: newPriority,
        targetDate: newDate,
        notes: newNotes
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Add custom workspace task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      const res = await fetch(`/api/repos/${project.owner}/${project.name}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTaskText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setDetails(prev => ({
          ...prev,
          localData: {
            ...prev?.localData,
            customTasks: [...(prev?.localData?.customTasks || []), data.task]
          }
        }));
        setNewTaskText('');
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Toggle custom task
  const handleToggleTask = async (taskId) => {
    try {
      const res = await fetch(`/api/repos/${project.owner}/${project.name}/tasks/${taskId}`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        setDetails(prev => {
          const list = (prev?.localData?.customTasks || []).map(t => t.id === taskId ? data.task : t);
          return {
            ...prev,
            localData: { ...prev.localData, customTasks: list }
          };
        });
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Delete custom task
  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/repos/${project.owner}/${project.name}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDetails(prev => {
          const list = (prev?.localData?.customTasks || []).filter(t => t.id !== taskId);
          return {
            ...prev,
            localData: { ...prev.localData, customTasks: list }
          };
        });
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Compute tasks
  const customTasks = details?.localData?.customTasks || [];
  const readmeTasks = details?.readme?.tasks || [];
  const allTasks = [...readmeTasks, ...customTasks];
  const completedTasks = allTasks.filter(t => t.completed);
  const pendingTasks = allTasks.filter(t => !t.completed);
  const taskCompletionRate = allTasks.length > 0 
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : (statusKey === 'completed' ? 100 : null);

  const filteredTasks = taskFilter === 'completed'
    ? completedTasks
    : taskFilter === 'pending'
    ? pendingTasks
    : allTasks;

  // Documents list
  const markdownFiles = details?.readme?.allMarkdownFiles || [];
  const selectedDoc = markdownFiles[selectedDocIndex] || null;

  // Issues & PRs
  const issues = details?.issues || { total: 0, openCount: 0, closedCount: 0, list: [] };
  const prs = details?.prs || { total: 0, openCount: 0, mergedCount: 0, closedCount: 0, list: [] };
  const commits = details?.commits || [];
  const workflows = details?.workflows || { hasActions: false, runs: [] };
  const languages = details?.languages || { languages: [] };

  const friendly = getFriendlyStatus(statusKey);
  const reason = getHumanReadableReason(project);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-white tracking-tight truncate">{project.name}</h2>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${friendly.badgeClass}`}>
                  {friendly.label}
                </span>
                {project.homepage && (
                  <a
                    href={project.homepage}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    <span>Live Website</span>
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {project.description || 'No project description provided.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            {project.html_url && (
              <a
                href={project.html_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Open GitHub repository"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-[#0c1222] overflow-x-auto text-xs py-2">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Tasks & Progress</span>
            {allTasks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                {completedTasks.length}/{allTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Documentation</span>
            {markdownFiles.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono">
                {markdownFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'issues'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Issues</span>
            {issues.openCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {issues.openCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'updates'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Recent Activity
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'technical'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Technical Details
          </button>

        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Loading project details and documentation...
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: OVERVIEW                                           */}
              {/* ========================================================= */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-xs">
                  
                  {/* Status & Automatic Inference Explanation */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">Current Status:</span>
                        <select
                          value={statusKey}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            setStatusKey(newKey);
                            handleSaveMetadata(newKey, priority, targetDate, notes);
                          }}
                          className={`text-xs font-semibold px-3 py-1 rounded-xl border appearance-none cursor-pointer focus:outline-none ${friendly.badgeClass}`}
                        >
                          <option value="active" className="bg-slate-900 text-slate-200">Active</option>
                          <option value="needs_attention" className="bg-slate-900 text-amber-300">Needs Attention</option>
                          <option value="completed" className="bg-slate-900 text-emerald-300">Completed</option>
                          <option value="paused" className="bg-slate-900 text-slate-400">Paused</option>
                          <option value="archived" className="bg-slate-900 text-purple-400">Archived</option>
                        </select>
                      </div>

                      {reason && (
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          reason.type === 'manual' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {reason.label}
                        </span>
                      )}
                    </div>

                    {reason && (
                      <p className="text-slate-300 text-xs flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{reason.detail}</span>
                      </p>
                    )}
                  </div>

                  {/* At-a-glance KPI summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
                      <div className="text-slate-400 mb-1 font-medium">Tasks Progress</div>
                      <div className="text-xl font-bold text-white">
                        {allTasks.length > 0 ? (
                          <span>{completedTasks.length} / {allTasks.length} done</span>
                        ) : (
                          <span className="text-slate-400 text-sm">No tasks checklist</span>
                        )}
                      </div>
                      {allTasks.length > 0 && (
                        <p className="text-emerald-400 mt-1">{taskCompletionRate}% completed</p>
                      )}
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
                      <div className="text-slate-400 mb-1 font-medium">Open Issues</div>
                      <div className="text-xl font-bold text-white">
                        {issues.openCount} open
                      </div>
                      <p className="text-slate-400 mt-1">{issues.closedCount} resolved issues</p>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
                      <div className="text-slate-400 mb-1 font-medium">Last Activity</div>
                      <div className="text-xl font-bold text-white truncate">
                        {formatFriendlyDate(project.pushed_at || project.updated_at)}
                      </div>
                      <p className="text-slate-400 mt-1">Direct GitHub sync</p>
                    </div>
                  </div>

                  {/* Community Notes & Target Date */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs">Community Notes & Schedule</h4>
                      {saveSuccess && (
                        <span className="text-emerald-400 text-[11px] font-semibold animate-fadeIn">
                          Saved successfully!
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Target Completion Date</label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Priority</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Member Notes & Next Steps</label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about project context, who to contact, or what needs to be done next..."
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 text-xs resize-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveMetadata(statusKey, priority, targetDate, notes)}
                        disabled={isSavingNotes}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: TASKS & PROGRESS                                   */}
              {/* ========================================================= */}
              {activeTab === 'tasks' && (
                <div className="space-y-6 text-xs">
                  
                  {/* Task Progress Bar */}
                  {allTasks.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-white">Progress Summary</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {completedTasks.length} of {allTasks.length} completed ({taskCompletionRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${taskCompletionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Task Filter Pills & Add Task */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
                      <button
                        onClick={() => setTaskFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          taskFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                        }`}
                      >
                        All ({allTasks.length})
                      </button>
                      <button
                        onClick={() => setTaskFilter('pending')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          taskFilter === 'pending' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                        }`}
                      >
                        Remaining ({pendingTasks.length})
                      </button>
                      <button
                        onClick={() => setTaskFilter('completed')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          taskFilter === 'completed' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
                        }`}
                      >
                        Completed ({completedTasks.length})
                      </button>
                    </div>

                    {/* Add Workspace Task Form */}
                    <form onSubmit={handleAddTask} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add a new project task..."
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 flex-1 sm:w-64"
                      />
                      <button
                        type="submit"
                        disabled={!newTaskText.trim()}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Tasks List */}
                  {filteredTasks.length === 0 ? (
                    <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      {taskFilter === 'completed' ? 'No tasks completed yet.' : 'All tasks are completed!'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredTasks.map((t) => {
                        const isCustom = Boolean(t.createdAt);

                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-900/70 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {isCustom ? (
                                <input
                                  type="checkbox"
                                  checked={t.completed}
                                  onChange={() => handleToggleTask(t.id)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                                />
                              ) : (
                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                                  t.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {t.completed ? '✓' : '○'}
                                </span>
                              )}

                              <span className={`text-xs truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {t.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                                {t.sourceFile || 'Workspace'}
                              </span>

                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(t.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: DOCUMENTATION                                      */}
              {/* ========================================================= */}
              {activeTab === 'docs' && (
                <div className="space-y-4 text-xs">
                  {markdownFiles.length === 0 ? (
                    <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      No markdown documentation found in this repository.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      {/* Document Selector Sidebar */}
                      <div className="md:col-span-1 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2 px-1">
                          Project Documents
                        </span>
                        {markdownFiles.map((doc, idx) => {
                          const isSelected = selectedDocIndex === idx;

                          return (
                            <button
                              key={doc.path}
                              type="button"
                              onClick={() => setSelectedDocIndex(idx)}
                              className={`w-full text-left px-3 py-2 rounded-xl transition-all flex flex-col gap-0.5 ${
                                isSelected
                                  ? 'bg-slate-800 text-white font-semibold'
                                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                              }`}
                            >
                              <span className="truncate text-xs">{doc.name}</span>
                              <span className="text-[10px] text-slate-500 font-normal">{doc.category || 'doc'}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Document Reader */}
                      <div className="md:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 overflow-y-auto max-h-[500px]">
                        {selectedDoc ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                              <div>
                                <h4 className="text-sm font-bold text-white">{selectedDoc.name}</h4>
                                <span className="text-[11px] text-slate-400 font-mono">{selectedDoc.path}</span>
                              </div>
                              {selectedDoc.tasks?.length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                                  {selectedDoc.tasks.filter(t => t.completed).length}/{selectedDoc.tasks.length} tasks
                                </span>
                              )}
                            </div>

                            {/* Markdown text rendered cleanly */}
                            <pre className="font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {selectedDoc.content || 'Document content is empty.'}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-slate-500">Select a document to read.</div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: ISSUES & BLOCKERS                                  */}
              {/* ========================================================= */}
              {activeTab === 'issues' && (
                <div className="space-y-4 text-xs">
                  {issues.list.length === 0 ? (
                    <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      No issues reported for this project. Everything is running smoothly.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {issues.list.map((issue) => (
                        <div 
                          key={issue.id}
                          className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                issue.state === 'open' 
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {issue.state === 'open' ? 'Open' : 'Closed'}
                              </span>
                              <h4 className="font-semibold text-white truncate text-xs">
                                #{issue.number} {issue.title}
                              </h4>
                            </div>

                            {issue.labels && issue.labels.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {issue.labels.map(l => (
                                  <span 
                                    key={l.name}
                                    className="text-[10px] px-2 py-0.2 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700/60"
                                  >
                                    {l.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-[11px] text-slate-400">
                              Opened by <span className="text-slate-300">@{issue.user?.login || 'member'}</span> • {formatFriendlyDate(issue.created_at)}
                            </p>
                          </div>

                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            title="View issue on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: RECENT ACTIVITY                                    */}
              {/* ========================================================= */}
              {activeTab === 'updates' && (
                <div className="space-y-4 text-xs">
                  {commits.length === 0 ? (
                    <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                      No recent commit activity recorded.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {commits.map((c) => (
                        <div
                          key={c.sha}
                          className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <GitCommit className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-slate-200 font-medium truncate">{c.message}</p>
                              <p className="text-[11px] text-slate-400">
                                {c.author} • {formatFriendlyDate(c.date)}
                              </p>
                            </div>
                          </div>

                          {c.url && (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300 font-mono text-[10px] shrink-0"
                            >
                              {c.sha.substring(0, 7)}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: TECHNICAL DETAILS                                  */}
              {/* ========================================================= */}
              {activeTab === 'technical' && (
                <div className="space-y-6 text-xs">
                  
                  {/* CI Workflows */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                    <h4 className="font-bold text-white text-xs">Automated Workflows (CI/CD)</h4>
                    {workflows.hasActions ? (
                      <div className="space-y-2">
                        {workflows.runs.map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-300">{r.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.conclusion === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {r.conclusion || r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No automated CI workflows configured for this repository.</p>
                    )}
                  </div>

                  {/* Language Composition */}
                  {languages.languages?.length > 0 && (
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                      <h4 className="font-bold text-white text-xs">Technology Stack</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {languages.languages.map((l) => (
                          <span
                            key={l.name}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium"
                          >
                            {l.name} ({l.percentage}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Metadata */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-slate-400 space-y-1">
                    <p>Repository: <span className="text-slate-200 font-mono">{project.full_name}</span></p>
                    <p>Visibility: <span className="text-slate-200">{project.is_private ? 'Private' : 'Public'}</span></p>
                    <p>Default Branch: <span className="text-slate-200 font-mono">{project.default_branch || 'main'}</span></p>
                  </div>

                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
