import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PauseCircle, 
  Archive,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';
import { getFriendlyStatus } from '../utils/status';

const STATUS_ORDER = ['completed', 'active', 'needs_attention', 'paused', 'archived'];

export default function ProgressGraph({ 
  projects = [], 
  activeStatusFilter = 'all', 
  onSelectStatusFilter, 
  onSelectProject 
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('distribution'); // 'distribution' | 'matrix'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const total = projects.length;
  if (total === 0) return null;

  // Group status counts using friendly community statuses
  const counts = {
    completed: 0,
    active: 0,
    needs_attention: 0,
    paused: 0,
    archived: 0
  };

  projects.forEach(p => {
    const friendly = getFriendlyStatus(p.status || p.autoStatus);
    if (counts[friendly.key] !== undefined) {
      counts[friendly.key]++;
    } else {
      counts.active++;
    }
  });

  // Color mapping
  const STATUS_META = {
    completed: { hex: '#10b981', label: 'Completed', icon: CheckCircle2, text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    active: { hex: '#38bdf8', label: 'Active', icon: Clock, text: 'text-sky-400', bg: 'bg-sky-500/10' },
    needs_attention: { hex: '#f59e0b', label: 'Needs Attention', icon: AlertTriangle, text: 'text-amber-400', bg: 'bg-amber-500/10' },
    paused: { hex: '#64748b', label: 'Paused', icon: PauseCircle, text: 'text-slate-400', bg: 'bg-slate-500/10' },
    archived: { hex: '#a855f7', label: 'Archived', icon: Archive, text: 'text-purple-400', bg: 'bg-purple-500/10' }
  };

  // SVG Donut Calculations
  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = STATUS_ORDER
    .filter(key => counts[key] > 0)
    .map(key => {
      const count = counts[key];
      const percentage = (count / total) * 100;
      const strokeDasharray = `${(count / total) * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += (count / total) * circumference;

      return {
        key,
        count,
        percentage: Math.round(percentage),
        strokeDasharray,
        strokeDashoffset,
        color: STATUS_META[key].hex,
        label: STATUS_META[key].label
      };
    });

  return (
    <div className="mb-8 bg-[#0f172a]/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Project Status Breakdown</h3>
            <p className="text-xs text-slate-400">Click any status to filter workspace projects</p>
          </div>
        </div>

        {/* View mode toggle & collapse */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('distribution')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'distribution'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Chart</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'matrix'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={isOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-6">
          {activeTab === 'distribution' ? (
            <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
              
              {/* Donut Chart */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <svg width="190" height="190" viewBox="0 0 190 190" className="rotate-[-90deg]">
                  {/* Background Track */}
                  <circle
                    cx="95"
                    cy="95"
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                  />

                  {/* Slices */}
                  {slices.map((slice) => {
                    const isHovered = hoveredSlice === slice.key;
                    const isFiltered = activeStatusFilter === slice.key;

                    return (
                      <circle
                        key={slice.key}
                        cx="95"
                        cy="95"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={isHovered || isFiltered ? strokeWidth + 3 : strokeWidth}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredSlice(slice.key)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => {
                          if (onSelectStatusFilter) {
                            onSelectStatusFilter(activeStatusFilter === slice.key ? 'all' : slice.key);
                          }
                        }}
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          opacity: hoveredSlice && !isHovered ? 0.4 : 1
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Projects</span>
                </div>
              </div>

              {/* Status Clickable Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                {STATUS_ORDER.map(key => {
                  const meta = STATUS_META[key];
                  const Icon = meta.icon;
                  const count = counts[key] || 0;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isSelected = activeStatusFilter === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelectStatusFilter && onSelectStatusFilter(isSelected ? 'all' : key)}
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-slate-500 bg-slate-800'
                          : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-200">{meta.label}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{percentage}%</span>
                      </div>
                      <div className="text-lg font-bold text-white">{count}</div>
                    </button>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Matrix View: Projects grouped by status */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STATUS_ORDER.map(key => {
                const meta = STATUS_META[key];
                const matchingProjects = projects.filter(p => getFriendlyStatus(p.status || p.autoStatus).key === key);
                if (matchingProjects.length === 0) return null;

                return (
                  <div key={key} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <span className={`text-xs font-bold ${meta.text} flex items-center gap-1.5`}>
                        <span className={`w-2 h-2 rounded-full ${meta.bg}`}></span>
                        {meta.label}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{matchingProjects.length}</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {matchingProjects.map(proj => (
                        <button
                          key={proj.full_name || proj.id}
                          onClick={() => onSelectProject && onSelectProject(proj)}
                          className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                        >
                          <span className="truncate max-w-[180px] font-medium">{proj.name}</span>
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono">
                            {proj.open_issues_count > 0 ? `${proj.open_issues_count} issues` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
