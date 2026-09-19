import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  GitCommit, 
  Tag, 
  FileText, 
  Activity, 
  Save, 
  ShieldCheck,
  AlertCircle,
  Sparkles,
  GitPullRequest,
  CircleDot,
  Layers,
  Cpu,
  UserCheck,
  UserX,
  Check
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { triggerConfetti } from '../utils/confetti';

export default function ProjectDetailModal({ 
  project, 
  onClose, 
  onUpdateStatus, 
  hasToken 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'prs' | 'issues' | 'commits' | 'workflows' | 'v1'
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [status, setStatus] = useState(project.status || 'in_progress');
  const [priority, setPriority] = useState(project.priority || 'medium');
  const [targetDate, setTargetDate] = useState(project.targetDate || '');
  const [notes, setNotes] = useState(project.notes || '');
  const [newTaskText, setNewTaskText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [selectedDocPath, setSelectedDocPath] = useState(null);

  // GitHub Release state
  const [publishToGh, setPublishToGh] = useState(false);
  const [releaseTag, setReleaseTag] = useState('v1.0.0');
  const [releaseTitle, setReleaseTitle] = useState('v1.0.0 - Production Release');
  const [releaseNotes, setReleaseNotes] = useState('Version 1.0 complete milestone shipped!');
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseSuccess, setReleaseSuccess] = useState(false);

  // Fetch full details
  useEffect(() => {
    let isMounted = true;
    async function fetchDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/repos/${project.owner}/${project.name}`);
        if (!res.ok) throw new Error('Failed to load project inspection details');
        const data = await res.json();
        if (isMounted) {
          setDetails(data);
          if (data.readme?.allMarkdownFiles?.length > 0) {
            setSelectedDocPath(data.readme.allMarkdownFiles[0].path);
          }
          if (data.localData) {
            setStatus(data.localData.status || project.status || 'in_progress');
            setPriority(data.localData.priority || 'medium');
            setTargetDate(data.localData.targetDate || '');
            setNotes(data.localData.notes || '');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDetails();
    return () => { isMounted = false; };
  }, [project.owner, project.name]);

  // Handle status / metadata changes
  const handleSaveMetadata = async (newStatus = status, newPriority = priority, newDate = targetDate, newNotes = notes) => {
    try {
      const res = await fetch(`/api/repos/${project.owner}/${project.name}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          priority: newPriority,
          targetDate: newDate,
          notes: newNotes
        })
      });
      if (!res.ok) throw new Error('Failed to update status');
      onUpdateStatus(project.owner, project.name, newStatus, {
        priority: newPriority,
        targetDate: newDate,
        notes: newNotes
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Add custom task
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
            ...prev.localData,
            customTasks: [...(prev.localData?.customTasks || []), data.task]
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
          const updated = (prev.localData?.customTasks || []).map(t => 
            t.id === taskId ? data.task : t
          );
          return {
            ...prev,
            localData: { ...prev.localData, customTasks: updated }
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
        setDetails(prev => ({
          ...prev,
          localData: {
            ...prev.localData,
            customTasks: (prev.localData?.customTasks || []).filter(t => t.id !== taskId)
          }
        }));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Handle Release / Mark v1 Complete
  const handleMarkV1Complete = async () => {
    setIsReleasing(true);
    setReleaseSuccess(false);
    try {
      const res = await fetch(`/api/repos/${project.owner}/${project.name}/release-v1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: releaseTag,
          title: releaseTitle,
          notes: releaseNotes,
          publishToGithub: publishToGh && hasToken
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release v1');

      setStatus('v1_complete');
      setReleaseSuccess(true);
      triggerConfetti();
      onUpdateStatus(project.owner, project.name, 'v1_complete', {
        v1ReleaseTag: releaseTag
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsReleasing(false);
    }
  };

  const customTasks = details?.localData?.customTasks || [];
  const readmeTasks = details?.readme?.tasks || [];
  const totalTasks = customTasks.length + readmeTasks.length;
  const completedCustom = customTasks.filter(t => t.completed).length;
  const completedReadme = readmeTasks.filter(t => t.completed).length;
  const totalCompleted = completedCustom + completedReadme;
  const taskRatio = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : (status === 'v1_complete' || status === 'completed' ? 100 : 0);

  const prs = details?.prs || { total: 0, openCount: 0, mergedCount: 0, closedCount: 0, list: [] };
  const issues = details?.issues || { total: 0, openCount: 0, closedCount: 0, list: [] };
  const milestones = details?.milestones || [];
  const workflows = details?.workflows || { hasActions: false, latestStatus: null, runs: [] };
  const languages = details?.languages || { totalBytes: 0, languages: [] };
  const userCommitActivity = details?.userCommitActivity || { userCommitted: false, userCommitCount: 0, recentUserCommits: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0f172a] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">{project.name}</h2>
                <a
                  href={project.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                >
                  <span>{project.full_name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* You Committed Badge */}
                {project.user_committed ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <UserCheck className="w-3 h-3" /> You Committed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    <UserX className="w-3 h-3" /> No commits by you
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{project.description || 'No description provided'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-[#0c1222] overflow-x-auto text-xs py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview & Tasks</span>
            {totalTasks > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700/60 font-mono">
                {totalCompleted}/{totalTasks}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Docs, Context & TODOs</span>
            {(details?.readme?.allMarkdownFiles || []).length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono text-emerald-400">
                {(details?.readme?.allMarkdownFiles || []).length} MD
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('prs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'prs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Pull Requests</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono text-slate-300">
              {prs.openCount} open
            </span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'issues'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Issues</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono text-slate-300">
              {issues.openCount} open
            </span>
          </button>

          <button
            onClick={() => setActiveTab('commits')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'commits'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Commits & Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'workflows'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>CI & Tech Stack</span>
          </button>

          <button
            onClick={() => setActiveTab('v1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'v1'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>v1.0 Milestone Hub</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Controls Bar: Status, Priority, Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatus(val);
                  handleSaveMetadata(val, priority, targetDate, notes);
                  if (val === 'v1_complete' || val === 'completed') triggerConfetti();
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="in_progress">🚀 In Progress</option>
                <option value="needs_polish">🔍 Needs Polish</option>
                <option value="paused">⏸️ Paused / On Hold</option>
                <option value="v1_complete">🏆 Version 1.0 Complete</option>
                <option value="completed">✅ Fully Completed</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSaveMetadata(status, e.target.value, targetDate, notes);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High / Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Completion Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  handleSaveMetadata(status, priority, e.target.value, notes);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* TAB 1: OVERVIEW & TASKS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress & Health Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Task Completion Ratio Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Checklist Completion
                    </span>
                    <span className="text-xl font-black text-emerald-400">{taskRatio}%</span>
                  </div>
                  <div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${taskRatio}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{totalCompleted} of {totalTasks} total tasks completed</span>
                      {status === 'v1_complete' && (
                        <span className="text-amber-300 font-semibold flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> v1 Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Health Score Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-400" />
                      Comprehensive Health Index
                    </span>
                    <span className="text-xl font-black text-teal-400">
                      {details?.stats?.healthScore || 75} / 100
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${details?.readme?.hasReadme ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                      {details?.readme?.hasReadme ? '✓ README' : '✕ No README'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${project.license ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {project.license ? `✓ License (${project.license})` : 'No License'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                      {prs.mergedCount} PRs merged
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                      {issues.closedCount} issues closed
                    </span>
                  </div>
                </div>

              </div>

              {/* GitHub Milestones if any */}
              {milestones.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-amber-400" />
                    GitHub Milestones
                  </h3>
                  <div className="space-y-3">
                    {milestones.map(m => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <a href={m.html_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-200 hover:text-emerald-400 flex items-center gap-1">
                            <span>{m.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                          <span className="text-xs font-mono font-semibold text-emerald-400">{m.completionRatio}% done</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2">{m.description || 'No description'}</p>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${m.completionRatio}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>{m.closedIssues} closed / {m.openIssues} open issues</span>
                          {m.dueOn && <span>Due: {new Date(m.dueOn).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Completion Checklist */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Completion Checklist & Action Items
                    </h3>
                    <p className="text-xs text-slate-400">Track tasks needed to bring this project to Complete or v1.0</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    {completedCustom} / {customTasks.length} done
                  </span>
                </div>

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="e.g., Implement dark mode, write test suite, deploy to production..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Task List */}
                {customTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No custom tasks yet. Add one above to start planning your completion!</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {customTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 group transition-all"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => handleToggleTask(t.id)}
                            className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-700"
                          />
                          <span className={`text-xs ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {t.text}
                          </span>
                        </label>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* README Extracted Tasks (if any) */}
              {readmeTasks.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-400" />
                        Detected Markdown Checkboxes from README.md
                      </h3>
                      <p className="text-xs text-slate-400">Scanned directly from your repository's documentation</p>
                    </div>
                    <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-1 rounded-lg">
                      {completedReadme} / {readmeTasks.length} done
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {readmeTasks.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-slate-800/40">
                        <span className={t.completed ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {t.completed ? '✓' : '○'}
                        </span>
                        <span className={t.completed ? 'line-through text-slate-500' : 'text-slate-300'}>
                          {t.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes & Developer Thoughts */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Project Roadmap & Notes
                  </h3>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSavingNotes(true);
                      await handleSaveMetadata(status, priority, targetDate, notes);
                      setIsSavingNotes(false);
                    }}
                    disabled={isSavingNotes}
                    className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record architectural decisions, blockers, deployment URLs, or future v2 thoughts here..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB: MARKDOWN SPECS, CONTEXT, TODOS, LOGS, ERRORS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              {/* Header description */}
              <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Discovered Markdown Documents (Context, TODOs, Logs & Errors)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspecting all .md files across the project for tasks, architecture context, and bug tracking
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300">
                  {(details?.readme?.allMarkdownFiles || []).length} files discovered
                </span>
              </div>

              {(details?.readme?.allMarkdownFiles || []).length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  No markdown documentation files detected in this repository.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: File Selector */}
                  <div className="lg:col-span-4 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {(details?.readme?.allMarkdownFiles || []).map((file) => {
                      const isSelected = (selectedDocPath || details?.readme?.allMarkdownFiles[0]?.path) === file.path;
                      const categoryColors = {
                        todo: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                        task: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                        context: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                        error: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                        log: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                        roadmap: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                        readme: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                        doc: 'bg-slate-700 text-slate-300 border-slate-600'
                      };

                      return (
                        <div
                          key={file.path}
                          onClick={() => setSelectedDocPath(file.path)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                              : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold font-mono truncate">{file.name}</span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${categoryColors[file.category] || categoryColors.doc}`}>
                              {file.category}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{file.path}</span>
                            {file.totalTasks > 0 && (
                              <span className="font-mono text-emerald-400 font-semibold">
                                {file.completedTasks}/{file.totalTasks} done
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: File Details & Preview */}
                  <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-[500px] overflow-hidden">
                    {(() => {
                      const activeFile = (details?.readme?.allMarkdownFiles || []).find(
                        f => f.path === (selectedDocPath || details?.readme?.allMarkdownFiles[0]?.path)
                      ) || details?.readme?.allMarkdownFiles?.[0];

                      if (!activeFile) {
                        return <p className="text-xs text-slate-500 py-8 text-center">Select a file to inspect.</p>;
                      }

                      return (
                        <div className="flex-1 flex flex-col overflow-hidden">
                          {/* File Header */}
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white font-mono">{activeFile.path}</h4>
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400">
                                  {activeFile.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {activeFile.totalTasks > 0 
                                  ? `${activeFile.completedTasks} of ${activeFile.totalTasks} tasks completed in this file`
                                  : 'Documentation & Context Specification'}
                              </p>
                            </div>
                          </div>

                          {/* Checkbox tasks in this file (if any) */}
                          {activeFile.tasks && activeFile.tasks.length > 0 && (
                            <div className="mb-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                              <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                                Tasks Extracted from this Document
                              </h5>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {activeFile.tasks.map((t, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className={t.completed ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                      {t.completed ? '✓' : '○'}
                                    </span>
                                    <span className={t.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                                      {t.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Raw Document Content */}
                          <div className="flex-1 overflow-y-auto bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {activeFile.rawContent || 'Empty document.'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PULL REQUESTS */}
          {activeTab === 'prs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-emerald-400" />
                    All Pull Requests ({prs.total})
                  </h3>
                  <p className="text-xs text-slate-400">Review open contributions, merged milestones, and closed PRs</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-semibold">
                    {prs.mergedCount} Merged
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 font-semibold">
                    {prs.openCount} Open
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400">
                    {prs.closedCount} Closed
                  </span>
                </div>
              </div>

              {prs.list.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  No Pull Requests found for this repository.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {prs.list.map(pr => (
                    <div key={pr.id} className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-start justify-between gap-3 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pr.state === 'merged' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          pr.state === 'open' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {pr.state}
                        </span>
                        <div>
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-white hover:text-emerald-400 flex items-center gap-1.5"
                          >
                            <span>#{pr.number} {pr.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span>by @{pr.author}</span>
                            <span>•</span>
                            <span>Created {new Date(pr.createdAt).toLocaleDateString()}</span>
                            {pr.mergedAt && (
                              <>
                                <span>•</span>
                                <span className="text-purple-300">Merged {new Date(pr.mergedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ISSUES */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-amber-400" />
                    All Project Issues ({issues.total})
                  </h3>
                  <p className="text-xs text-slate-400">Track bugs, features, and enhancement requests</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-semibold">
                    {issues.openCount} Open
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-semibold">
                    {issues.closedCount} Closed
                  </span>
                </div>
              </div>

              {issues.list.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  No issues reported! Clear backlog.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {issues.list.map(issue => (
                    <div key={issue.id} className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex items-start justify-between gap-3 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          issue.state === 'open' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {issue.state}
                        </span>
                        <div>
                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-white hover:text-emerald-400 flex items-center gap-1.5"
                          >
                            <span>#{issue.number} {issue.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                            <span>Opened by @{issue.author}</span>
                            <span>•</span>
                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                            {issue.labels && issue.labels.map(l => (
                              <span key={l.name} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-700 text-slate-300 font-medium">
                                {l.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMMITS & USER ACTIVITY */}
          {activeTab === 'commits' && (
            <div className="space-y-4">
              {/* User Commit Status Card */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-emerald-400" />
                    Your Contribution & Commit Activity
                  </h3>
                  <p className="text-xs text-slate-400">Verifying whether you have authored commits to this codebase</p>
                </div>
                <div>
                  {project.user_committed ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <UserCheck className="w-4 h-4" />
                      Active Committer
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      <UserX className="w-4 h-4" />
                      No Commits by You Yet
                    </span>
                  )}
                </div>
              </div>

              {/* Commit List */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Recent Git Commit History
                </h4>
                {details?.commits && details.commits.length > 0 ? (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {details.commits.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {c.sha}
                          </span>
                          <span className="text-slate-200 truncate">{c.message}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 ml-2">
                          <span className="font-medium text-slate-300">by {c.author}</span>
                          <span>{c.date ? new Date(c.date).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No commits recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CI WORKFLOWS & LANGUAGES */}
          {activeTab === 'workflows' && (
            <div className="space-y-5">
              {/* GitHub Actions / Workflows */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      GitHub Actions & CI Status
                    </h3>
                    <p className="text-xs text-slate-400">Continuous integration build and test status</p>
                  </div>
                  {workflows.latestStatus && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      workflows.latestStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {workflows.latestStatus === 'success' ? '✓ Passing' : workflows.latestStatus}
                    </span>
                  )}
                </div>

                {workflows.runs.length > 0 ? (
                  <div className="space-y-2">
                    {workflows.runs.map(run => (
                      <div key={run.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={run.conclusion === 'success' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {run.conclusion === 'success' ? '✓' : '✕'}
                          </span>
                          <span className="font-semibold text-slate-200">{run.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({run.branch})</span>
                        </div>
                        <a href={run.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">No GitHub Actions workflow runs found.</p>
                )}
              </div>

              {/* Language Breakdown */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Languages & Code Composition</h3>
                {languages.languages.length > 0 ? (
                  <div>
                    {/* Visual bar */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800 mb-3">
                      {languages.languages.map((l, i) => (
                        <div
                          key={l.name}
                          style={{ width: `${l.percentage}%` }}
                          className={`h-full ${
                            i % 4 === 0 ? 'bg-emerald-500' :
                            i % 4 === 1 ? 'bg-sky-500' :
                            i % 4 === 2 ? 'bg-amber-400' : 'bg-purple-500'
                          }`}
                          title={`${l.name}: ${l.percentage}%`}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs">
                      {languages.languages.map(l => (
                        <div key={l.name} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                          <span className="text-slate-300 font-medium">{l.name}</span>
                          <span className="text-slate-500 font-mono">({l.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No language data detected.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: v1.0 MILESTONE HUB */}
          {activeTab === 'v1' && (
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-lg shadow-amber-500/5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-300">Version 1.0 Milestone Hub</h3>
                    <p className="text-xs text-slate-400">Finalize, celebrate, and tag your production version</p>
                  </div>
                </div>
                {status === 'v1_complete' && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Version 1 Complete!
                  </span>
                )}
              </div>

              {/* Release options */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Release Tag
                    </label>
                    <input
                      type="text"
                      value={releaseTag}
                      onChange={(e) => setReleaseTag(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Release Title
                    </label>
                    <input
                      type="text"
                      value={releaseTitle}
                      onChange={(e) => setReleaseTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Release Notes & Highlights
                  </label>
                  <textarea
                    rows={3}
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>

                {/* Publish to GitHub toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={publishToGh}
                      onChange={(e) => setPublishToGh(e.target.checked)}
                      disabled={!hasToken}
                      className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-0 bg-slate-700 disabled:opacity-50"
                    />
                    <span>Publish official GitHub Release tag & add topic <code className="text-amber-300">v1-completed</code></span>
                  </label>
                  {!hasToken && (
                    <span className="text-[11px] text-amber-400/80">(Requires PAT in settings)</span>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleMarkV1Complete}
                    disabled={isReleasing}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{isReleasing ? 'Publishing...' : 'Mark Version 1 Complete!'}</span>
                  </button>
                </div>

                {releaseSuccess && (
                  <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 mt-2">
                    <Sparkles className="w-4 h-4" /> Congratulations! Project marked as Version 1.0 Complete!
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Changes auto-saved to local tracking database.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
