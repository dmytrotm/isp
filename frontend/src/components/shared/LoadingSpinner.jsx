import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export function LoadingSpinner({ size = 40, fullHeight = true }) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: fullHeight ? '100%' : 'auto',
        minHeight: fullHeight ? 200 : 'auto',
        width: '100%'
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
}
