import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Grid, Typography, Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, CircularProgress } from '@mui/material';
import { PieChart, Pie, Tooltip as RechartsTooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

export default function TariffStatsDialog({ open, onClose, stats }) {
  const prepareRevenueChartData = () => {
    if (!stats?.tariff_statistics) return [];
    return stats.tariff_statistics.map((t) => ({ name: t.name, value: t.monthly_revenue }));
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Tariff Statistics</DialogTitle>
      <DialogContent>
        {stats ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>Total Tariffs</Typography>
                    <Typography variant="h4">{stats.total_tariffs}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>Active Tariffs</Typography>
                    <Typography variant="h4">{stats.active_tariffs}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>Most Popular</Typography>
                    <Typography variant="h4">{stats.most_popular?.name || "N/A"}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Charts */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader title="Monthly Revenue by Tariff" />
                  <CardContent>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={prepareRevenueChartData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {prepareRevenueChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => `₴${value}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tariff Details Table */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>Tariff Details</Typography>
                <Box sx={{ overflowX: "auto", width: "100%" }}>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Active Contracts</TableCell>
                          <TableCell>Monthly Revenue</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.tariff_statistics ? stats.tariff_statistics.map((tariff) => (
                          <TableRow key={tariff.id}>
                            <TableCell>{tariff.name}</TableCell>
                            <TableCell>₴{parseFloat(tariff.price).toFixed(2)}</TableCell>
                            <TableCell>{tariff.active_contracts}</TableCell>
                            <TableCell>₴{(tariff.monthly_revenue || 0).toFixed(2)}</TableCell>
                            <TableCell><Chip label={tariff.is_active ? "Active" : "Inactive"} color={tariff.is_active ? "success" : "default"} size="small" /></TableCell>
                          </TableRow>
                        )) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box display="flex" justifyContent="center" mt={3} mb={3}><CircularProgress /></Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
