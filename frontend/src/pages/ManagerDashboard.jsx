import React from 'react';
import { 
    Container, Grid, Paper, Typography, Box, Card, CardContent, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Button, Chip, CircularProgress, Alert
} from '@mui/material';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { TrendingUp, People, Block, PersonAdd, Warning } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4">{value}</Typography>
                </Box>
                <Box sx={{ color: color }}>
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const ManagerDashboard = () => {
    const { data, loading, error, markRecommendationReviewed } = useDashboard();
    const navigate = useNavigate();

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Container sx={{ mt: 4 }}>
            <Alert severity="error">{error}</Alert>
        </Container>
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h4">
                    Manager Analytics Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Operations
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        onClick={() => navigate('/')}
                    >
                        Home
                    </Button>
                </Box>
            </Box>

            {/* Top Row: 4 Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title="Total Customers" 
                        value={data.client_stats.total} 
                        icon={<People fontSize="large" />} 
                        color="primary.main"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title="Active Customers" 
                        value={data.client_stats.active} 
                        icon={<TrendingUp fontSize="large" />} 
                        color="success.main"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title="Blocked Customers" 
                        value={data.client_stats.blocked} 
                        icon={<Block fontSize="large" />} 
                        color="error.main"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard 
                        title="New This Month" 
                        value={data.client_stats.new_this_month} 
                        icon={<PersonAdd fontSize="large" />} 
                        color="info.main"
                    />
                </Grid>
            </Grid>

            {/* Middle Row: Revenue Bar Chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Monthly Revenue (Last 6 Months)
                        </Typography>
                        <Box sx={{ height: 350, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthly_revenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" name="Revenue (₴)" fill="primary.main" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Row: Tables */}
            <Grid container spacing={3}>
                {/* Bottom Left: Top 5 Problematic Clients */}
                <Grid size={{ xs: 12 }} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom color="error.main">
                            Top 5 Problematic Clients (Last 30 Days)
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="right">Tickets</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.top_problem_clients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell>{client.full_name}</TableCell>
                                            <TableCell align="right">{client.ticket_count}</TableCell>
                                            <TableCell>
                                                <Chip label={client.status} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right">₴{client.balance}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Bottom Right: Overdue Tickets */}
                <Grid size={{ xs: 12 }} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom color="warning.main">
                            Critical Overdue Tickets (SLA Breached)
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Client</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Deadline</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.overdue_tickets.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell>#{ticket.id}</TableCell>
                                            <TableCell>{ticket.customer_details?.user_details?.full_name}</TableCell>
                                            <TableCell>{ticket.ticket_type}</TableCell>
                                            <TableCell color="error.main">
                                                {new Date(ticket.sla_deadline).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Full Width: Pending Tariff Recommendations */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Pending Tariff Recommendations
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Client</TableCell>
                                        <TableCell>Current Tariff</TableCell>
                                        <TableCell>Recommended</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell align="right">Avg Usage %</TableCell>
                                        <TableCell align="center">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.pending_recommendations.map((rec) => (
                                        <TableRow key={rec.id}>
                                            <TableCell>{rec.customer_name}</TableCell>
                                            <TableCell>{rec.current_tariff_details?.name}</TableCell>
                                            <TableCell>{rec.recommended_tariff_details?.name}</TableCell>
                                            <TableCell>{rec.reason}</TableCell>
                                            <TableCell align="right">{rec.avg_usage_percent.toFixed(1)}%</TableCell>
                                            <TableCell align="center">
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    onClick={() => markRecommendationReviewed(rec.id)}
                                                >
                                                    Reviewed
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.pending_recommendations.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No pending recommendations</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ManagerDashboard;
