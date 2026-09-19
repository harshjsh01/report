import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PauseCircle, 
  Archive,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const STATUS_COLORS = {
  v1_complete: { hex: '#f59e0b', label: 'v1.0 Complete', icon: Trophy, bg: 'rgba(245, 158, 11, 0.15)' },
  completed: { hex: '#10b981', label: 'Completed', icon: CheckCircle2, bg: 'rgba(16, 185, 129, 0.15)' },
  needs_polish: { hex: '#fbbf24', label: 'Needs Polish', icon: AlertTriangle, bg: 'rgba(251, 191, 36, 0.15)' },
  in_progress: { hex: '#38bdf8', label: 'In Progress', icon: Clock, bg: 'rgba(56, 189, 248, 0.15)' },
  paused: { hex: '#64748b', label: 'Paused', icon: PauseCircle, bg: 'rgba(100, 116, 139, 0.15)' },
  archived: { hex: '#a855f7', label: 'Archived', icon: Archive, bg: 'rgba(168, 85, 247, 0.15)' }
};

export default function ProgressGraph({ 
  projects = [], 
  stats = {}, 
  activeStatusFilter, 
  onSelectStatusFilter, 
  activeLanguageFilter, 
  onSelectLanguageFilter, 
  onSelectProject 
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('completion'); // 'completion' | 'matrix' | 'languages'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const total = projects.length;
  if (total === 0) return null;

  // Group status counts
  const counts = {
    v1_complete: projects.filter(p => (p.status || p.autoStatus) === 'v1_complete').length,
    completed: projects.filter(p => (p.status || p.autoStatus) === 'completed').length,
    needs_polish: projects.filter(p => (p.status || p.autoStatus) === 'needs_polish').length,
    in_progress: projects.filter(p => (p.status || p.autoStatus) === 'in_progress').length,
    paused: projects.filter(p => (p.status || p.autoStatus) === 'paused').length,
    archived: projects.filter(p => (p.status || p.autoStatus) === 'archived').length
  };

  // Group languages
  const languageCounts = {};
  projects.forEach(p => {
    const lang = p.language || 'Other';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });
  const sortedLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  // SVG Donut Calculations
  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([statusKey, count]) => {
      const percentage = (count / total) * 100;
      const strokeDasharray = `${(count / total) * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += (count / total) * circumference;

      return {
        statusKey,
        count,
        percentage: Math.round(percentage),
        strokeDasharray,
        strokeDashoffset,
        color: STATUS_COLORS[statusKey]?.hex || '#64748b',
        label: STATUS_COLORS[statusKey]?.label || statusKey
      };
    });

  return (
    <div className="mb-8 bg-[#0e1424] border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all">
      {/* Graph Header with Toggle & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <BarChart3 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Interactive Portfolio Progress Graphs</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Interactive Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Click on any graph slice, bar, or project to instantly filter or inspect its complete status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Tabs */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 text-xs border border-slate-700/60">
            <button
              onClick={() => setActiveTab('completion')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'completion'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Status Donut
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Project Matrix
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'languages'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tech Stack
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse graph' : 'Expand graph'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Graph Content Body */}
      {isOpen && (
        <div className="p-6">
          
          {/* TAB 1: STATUS DONUT CHART */}
          {activeTab === 'completion' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Left Donut SVG */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    {/* Background Ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="#1e293b"
                      strokeWidth={strokeWidth}
                    />
                    {/* Slices */}
                    {slices.map((slice) => {
                      const isSelected = activeStatusFilter === slice.statusKey;
                      const isHovered = hoveredSlice === slice.statusKey;

                      return (
                        <circle
                          key={slice.statusKey}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={isHovered || isSelected ? strokeWidth + 4 : strokeWidth}
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          strokeLinecap="round"
                          className="cursor-pointer transition-all duration-300 hover:opacity-100"
                          style={{ opacity: hoveredSlice && !isHovered && !isSelected ? 0.4 : 0.95 }}
                          onMouseEnter={() => setHoveredSlice(slice.statusKey)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          onClick={() => onSelectStatusFilter(activeStatusFilter === slice.statusKey ? 'all' : slice.statusKey)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Text */}
                  <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-3xl font-black text-white">{total}</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Repos</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-3">
                  Click any segment or badge below to filter projects
                </p>
              </div>

              {/* Right Interactive Status Legend Badges */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(STATUS_COLORS).map(([key, meta]) => {
                  const count = counts[key] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const Icon = meta.icon;
                  const isSelected = activeStatusFilter === key;

                  return (
                    <div
                      key={key}
                      onClick={() => onSelectStatusFilter(isSelected ? 'all' : key)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: meta.bg, color: meta.hex }}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">{pct}%</span>
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-white">{count}</div>
                        <div className="text-xs font-medium text-slate-300 mt-0.5">{meta.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: PROJECT COMPLETION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Click any project bar to open its complete detail inspector & specs</span>
                <span className="font-mono">Showing {projects.length} evaluated repositories</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {projects.map((p) => {
                  const currentStatus = p.status || p.autoStatus || 'in_progress';
                  const meta = STATUS_COLORS[currentStatus] || STATUS_COLORS.in_progress;
                  const percent = p.progressPercent || (currentStatus === 'v1_complete' || currentStatus === 'completed' ? 100 : 60);

                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectProject(p)}
                      className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {p.name}
                          </span>
                          {p.homepage && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate">
                              Live App
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-mono font-bold" style={{ color: meta.hex }}>
                            {percent}%
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: meta.hex
                          }}
                        />
                      </div>

                      {/* Auto-detected reason snippet */}
                      <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                        {p.autoReason || 'Under active tracking'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LANGUAGES TECH STACK */}
          {activeTab === 'languages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Click any language to filter projects written in that technology</span>
                <span className="font-mono">{sortedLanguages.length} main languages detected</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sortedLanguages.map(([lang, count]) => {
                  const isSelected = activeLanguageFilter === lang;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                  return (
                    <div
                      key={lang}
                      onClick={() => onSelectLanguageFilter(isSelected ? 'all' : lang)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/30 shadow-md'
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{lang}</span>
                        <span className="text-xs font-mono font-semibold text-emerald-400">{pct}%</span>
                      </div>
                      <div className="text-lg font-black text-slate-200">{count} repos</div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
