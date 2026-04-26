import React from 'react';
import { Grid, Card, CardHeader, CardContent, Typography, Box, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { PieChart, Pie, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

export default function AdminOverviewTab({ dashboardStats, setTabValue, paymentStatusData, getColorForSegment }) {
  if (!dashboardStats) return null;
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard title="Total Customers" value={dashboardStats.total_customers} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard title="Total Employees" value={dashboardStats.total_employees} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard title="Active Contracts" value={dashboardStats.active_contracts} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <StatCard title="Monthly Revenue" value={`₴${dashboardStats.monthly_payments}`} />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Billing Status" />
          <CardContent>
            <Box height={300} display="flex" justifyContent="center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorForSegment(index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Legend formatter={(value, entry) => `${value}: ${entry.payload.value}`} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Support & Service Status" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Open Support Tickets</Typography>
                <Typography variant="h5">{dashboardStats.open_tickets}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Pending Invoices</Typography>
                <Typography variant="h5">{dashboardStats.pending_invoices}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Overdue Invoices</Typography>
                <Typography variant="h5">{dashboardStats.overdue_invoices}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" gutterBottom>SLA Breaches</Typography>
                <Typography variant="h5" color="error">{dashboardStats.overdue_tickets?.length || 0}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activities */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Recent Support Tickets" action={<Button size="small" onClick={() => setTabValue(4)}>View All</Button>} />
          <List>
            {dashboardStats.latest_tickets?.map((ticket, index) => (
              <React.Fragment key={ticket.id}>
                <ListItem>
                  <ListItemText primary={ticket.subject} secondary={ticket.customer_details?.user_details?.full_name} />
                </ListItem>
                {index < dashboardStats.latest_tickets.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Recent Connection Requests" action={<Button size="small" onClick={() => setTabValue(5)}>View All</Button>} />
          <List>
            {dashboardStats.recent_requests?.map((request, index) => (
              <React.Fragment key={request.id}>
                <ListItem>
                  <ListItemText primary={request.customer_details?.user_details?.full_name} secondary={`${request.address_details?.street}, ${request.address_details?.city} - ${request.status_name}`} />
                </ListItem>
                {index < dashboardStats.recent_requests.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      </Grid>
    </Grid>
  );
}
