import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

export default function StatCard({ title, value }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h3">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
