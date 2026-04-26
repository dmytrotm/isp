import React from 'react';
import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

export function EmptyState({ 
  icon: Icon = InboxIcon,
  title = 'No records found',
  description = '',
  action = null
}) {
  return (
    <Box sx={{ 
      textAlign: 'center', 
      py: 8, 
      color: 'text.disabled' 
    }}>
      <Icon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
