import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PauseCircle, 
  Archive 
} from 'lucide-react';

/**
 * Canonical community project statuses
 */
export const STATUSES = {
  active: {
    key: 'active',
    internalKey: 'in_progress',
    label: 'Active',
    description: 'Work is currently underway',
    badgeClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    dotClass: 'bg-sky-400',
    icon: Clock
  },
  needs_attention: {
    key: 'needs_attention',
    internalKey: 'needs_polish',
    label: 'Needs Attention',
    description: 'Has open issues, pending items, or requires review',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    dotClass: 'bg-amber-400',
    icon: AlertTriangle
  },
  completed: {
    key: 'completed',
    internalKey: 'completed',
    label: 'Completed',
    description: 'Goals achieved and milestone finished',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    icon: CheckCircle2
  },
  paused: {
    key: 'paused',
    internalKey: 'paused',
    label: 'Paused',
    description: 'Temporarily on hold',
    badgeClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    dotClass: 'bg-slate-400',
    icon: PauseCircle
  },
  archived: {
    key: 'archived',
    internalKey: 'archived',
    label: 'Archived',
    description: 'Archived historical project',
    badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    dotClass: 'bg-purple-400',
    icon: Archive
  }
};

/**
 * Normalizes any backend or legacy status string into canonical status metadata
 */
export function getFriendlyStatus(rawStatus) {
  if (!rawStatus) return STATUSES.active;
  const s = rawStatus.toLowerCase();

  if (s === 'v1_complete' || s === 'completed' || s === 'done') {
    return STATUSES.completed;
  }
  if (s === 'needs_polish' || s === 'needs_attention' || s === 'review') {
    return STATUSES.needs_attention;
  }
  if (s === 'paused' || s === 'on_hold') {
    return STATUSES.paused;
  }
  if (s === 'archived') {
    return STATUSES.archived;
  }
  return STATUSES.active;
}

/**
 * Maps a community friendly status key back to the backend status string
 */
export function mapToBackendStatus(friendlyKey) {
  switch (friendlyKey) {
    case 'needs_attention': return 'needs_polish';
    case 'completed': return 'completed';
    case 'paused': return 'paused';
    case 'archived': return 'archived';
    case 'active':
    default:
      return 'in_progress';
  }
}

/**
 * Determines whether a project requires attention from the community
 */
export function isNeedingAttention(project) {
  if (!project) return false;
  if (project.open_issues_count > 0) return true;
  const status = project.status || project.autoStatus;
  return status === 'needs_polish' || status === 'needs_attention';
}

/**
 * Translates automated reasoning snippets into clear, community-friendly language
 */
export function getHumanReadableReason(project) {
  if (!project) return null;
  const isManual = Boolean(project.status && project.status !== project.autoStatus);

  if (isManual) {
    const friendly = getFriendlyStatus(project.status);
    return {
      type: 'manual',
      label: 'Manually Set',
      detail: `Marked as ${friendly.label} by a community member`
    };
  }

  const rawReason = project.autoReason || '';

  // Translate common automated heuristics into plain human explanations
  if (rawReason.includes('Live production web deployment') || rawReason.includes('live production')) {
    if (project.open_issues_count === 0) {
      return {
        type: 'auto',
        label: 'Auto-detected',
        detail: 'Live website is online with no open issues reported'
      };
    }
    return {
      type: 'auto',
      label: 'Needs Review',
      detail: `Live website is online, but has ${project.open_issues_count} open issue${project.open_issues_count === 1 ? '' : 's'} to resolve`
    };
  }

  if (rawReason.includes('release tag detected') || rawReason.includes('1.0')) {
    return {
      type: 'auto',
      label: 'Auto-detected',
      detail: 'Official production milestone release published'
    };
  }

  if (rawReason.includes('Finished project milestone') || rawReason.includes('0 open issues')) {
    return {
      type: 'auto',
      label: 'Auto-detected',
      detail: 'Completed project milestone with no unresolved issues'
    };
  }

  if (rawReason.includes('100% of tasks')) {
    return {
      type: 'auto',
      label: 'Auto-detected',
      detail: 'All tasks in project documentation are marked complete'
    };
  }

  if (rawReason.includes('Active ongoing development')) {
    return {
      type: 'auto',
      label: 'Auto-detected',
      detail: 'Recent activity and ongoing project development'
    };
  }

  if (project.archived) {
    return {
      type: 'auto',
      label: 'Auto-detected',
      detail: 'Project has been officially archived'
    };
  }

  return {
    type: 'auto',
    label: 'Auto-detected',
    detail: rawReason || 'Active in community workspace'
  };
}

/**
 * Human friendly date formatting (e.g. "Today", "3 days ago", "May 14, 2026")
 */
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return 'No recent activity';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    return 'Recent';
  }
}
