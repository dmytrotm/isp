import React, { useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Page Not Found | ISP Manager';
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <Typography variant="h1" color="primary.main" sx={{ fontSize: '120px', fontWeight: 900 }}>
          404
        </Typography>
        <Typography variant="h4" color="text.secondary" sx={{ mb: 4 }}>
          Page not found
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate(-1)} size="large">
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
