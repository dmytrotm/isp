import React, { useState, useEffect } from "react";
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import api from "../../../services/api";

const OverviewTab = ({ dashboardStats, setTabValue }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [paymentStatusData, setPaymentStatusData] = useState([]);
  const [ticketStatusData, setTicketStatusData] = useState([]);

  useEffect(() => {
    if (dashboardStats) {
      prepareChartData();
    }
  }, [dashboardStats]);

  const prepareChartData = () => {
    // Prepare payment status data for pie chart
    setPaymentStatusData([
      { name: "Paid", value: dashboardStats.monthly_payments || 0 },
      { name: "Pending", value: dashboardStats.pending_invoices || 0 },
      { name: "Overdue", value: dashboardStats.overdue_invoices || 0 },
    ]);

    // Prepare ticket status data for bar chart
    setTicketStatusData([
      {
        name: "Support Tickets",
        Open: dashboardStats.open_tickets || 0,
        InProgress: dashboardStats.in_progress_tickets || 0,
        Resolved: dashboardStats.resolved_tickets || 0,
      },
    ]);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");
      const statsResponse = await api.get("/admin-dashboard/dashboard_stats/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Update dashboard stats through parent component state
      // This would require lifting the state up or using context/redux
      setRefreshing(false);
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      setRefreshing(false);
    }
  };

  const getColorForSegment = (index) => {
    const colors = ["#4CAF50", "#FFC107", "#F44336", "#2196F3"];
    return colors[index % colors.length];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "active":
      case "resolved":
      case "completed":
      case "paid":
        return "success";
      case "pending":
      case "in progress":
      case "open":
        return "warning";
      case "overdue":
      case "inactive":
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* Header with refresh button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h2">
          Dashboard Overview
        </Typography>
        <Tooltip title="Refresh dashboard data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Customers
              </Typography>
              <Typography variant="h3">
                {dashboardStats.total_customers}
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setTabValue(1)}
                sx={{ mt: 2 }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Total Employees
              </Typography>
              <Typography variant="h3">
                {dashboardStats.total_employees}
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setTabValue(2)}
                sx={{ mt: 2 }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Active Contracts
              </Typography>
              <Typography variant="h3">
                {dashboardStats.active_contracts}
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setTabValue(6)}
                sx={{ mt: 2 }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Monthly Revenue
              </Typography>
              <Typography variant="h3">
                ${dashboardStats.monthly_payments}
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setTabValue(7)}
                sx={{ mt: 2 }}
              >
                View Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Billing Status" />
            <CardContent>
              <Box height={300} display="flex" justifyContent="center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getColorForSegment(index)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Support Ticket Status
            </Typography>
            <Box height={300} display="flex" justifyContent="center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticketStatusData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="Open" fill="#FFC107" />
                  <Bar dataKey="InProgress" fill="#2196F3" />
                  <Bar dataKey="Resolved" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Recent Support Tickets"
              action={
                <Button
                  size="small"
                  color="primary"
                  onClick={() => setTabValue(4)}
                >
                  View All
                </Button>
              }
            />
            <List>
              {dashboardStats.latest_tickets?.map((ticket, index) => (
                <React.Fragment key={ticket.id}>
                  <ListItem>
                    <ListItemText
                      primary={ticket.subject}
                      secondary={`${ticket.customer_details?.user_details?.first_name} ${ticket.customer_details?.user_details?.last_name}`}
                    />
                    <Chip
                      size="small"
                      label={ticket.status}
                      color={getStatusColor(ticket.status)}
                    />
                  </ListItem>
                  {index < dashboardStats.latest_tickets.length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
              {(!dashboardStats.latest_tickets ||
                dashboardStats.latest_tickets.length === 0) && (
                <ListItem>
                  <ListItemText primary="No recent tickets" />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Recent Connection Requests"
              action={
                <Button
                  size="small"
                  color="primary"
                  onClick={() => setTabValue(4)}
                >
                  View All
                </Button>
              }
            />
            <List>
              {dashboardStats.recent_requests?.map((request, index) => (
                <React.Fragment key={request.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${request.customer_details?.user_details?.first_name} ${request.customer_details?.user_details?.last_name}`}
                      secondary={`${request.address_details?.street}, ${request.address_details?.city}`}
                    />
                    <Chip
                      size="small"
                      label={request.status_name}
                      color={getStatusColor(request.status_name)}
                    />
                  </ListItem>
                  {index < dashboardStats.recent_requests.length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
              {(!dashboardStats.recent_requests ||
                dashboardStats.recent_requests.length === 0) && (
                <ListItem>
                  <ListItemText primary="No recent connection requests" />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewTab;
