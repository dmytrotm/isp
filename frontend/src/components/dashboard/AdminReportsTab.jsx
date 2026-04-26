import React from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminReportsTab({ financialSummary, performanceMetrics }) {
  if (!financialSummary || !performanceMetrics) return null;
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Financial Overview" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Total Revenue</Typography>
                <Typography variant="h5">₴{financialSummary.total_revenue}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Total Invoiced</Typography>
                <Typography variant="h5">₴{financialSummary.total_invoiced}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Pending Amount</Typography>
                <Typography variant="h5">₴{financialSummary.pending_amount}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Overdue Amount</Typography>
                <Typography variant="h5">₴{financialSummary.overdue_amount}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>Payment Collection Rate</Typography>
                <Typography variant="h5">{financialSummary.payment_collection_rate.toFixed(2)}%</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Performance Metrics" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Ticket Resolution Rate</Typography>
                <Typography variant="h5">{performanceMetrics.ticket_resolution_rate.toFixed(2)}%</Typography>
                <Typography variant="body2" color="textSecondary">{performanceMetrics.resolved_support_tickets} out of {performanceMetrics.total_support_tickets}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title="Performance Charts" />
          <CardContent>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: "Support Tickets", Total: performanceMetrics.total_support_tickets, Resolved: performanceMetrics.resolved_support_tickets }]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Total" fill="#8884d8" />
                  <Bar dataKey="Resolved" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
