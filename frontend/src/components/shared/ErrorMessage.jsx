import React from 'react';
import { Alert, Box } from '@mui/material';

export function ErrorMessage({ message, sx = {} }) {
  if (!message) return null;
  
  const errorMessage = typeof message === 'string' 
    ? message 
    : message?.response?.data?.error || message?.message || 'An unexpected error occurred';

  return (
    <Box sx={{ mb: 2, ...sx }}>
      <Alert severity="error">{errorMessage}</Alert>
    </Box>
  );
}
