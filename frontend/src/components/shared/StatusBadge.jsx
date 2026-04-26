import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  active:      { label: 'Active',      color: 'success' },
  blocked:     { label: 'Blocked',     color: 'error'   },
  frozen:      { label: 'Frozen',      color: 'info'    },
  archived:    { label: 'Archived',    color: 'default' },
  suspended:   { label: 'Suspended',   color: 'warning' },
  terminated:  { label: 'Terminated',  color: 'error'   },
  pending:     { label: 'Pending',     color: 'warning' },
  paid:        { label: 'Paid',        color: 'success' },
  overdue:     { label: 'Overdue',     color: 'error'   },
  open:        { label: 'Open',        color: 'info'    },
  in_progress: { label: 'In Progress', color: 'warning' },
  resolved:    { label: 'Resolved',    color: 'success' },
  closed:      { label: 'Closed',      color: 'default' },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
}
