import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  TextField,
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import api from "../../../services/api";

const InternetUsageTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ); // 30 days ago
  const [endDate, setEndDate] = useState(new Date());

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const response = await api.get(
        "/admin-dashboard/internet_usage_statistics/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            start_date: formattedStartDate,
            end_date: formattedEndDate,
          },
        }
      );

      setUsageData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load usage data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  const handleApplyDateFilter = () => {
    fetchUsageData();
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Internet Usage Statistics
      </Typography>

      {/* Date Range Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApplyDateFilter}
                fullWidth
              >
                Apply Filter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {usageData && (
        <>
          {/* Summary Statistics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Data Transfer
                  </Typography>
                  <Typography variant="h3">
                    {usageData.summary.total_usage_gb.toFixed(2)} GB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Active Customers
                  </Typography>
                  <Typography variant="h3">
                    {usageData.summary.unique_customers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Average Usage Per Customer
                  </Typography>
                  <Typography variant="h3">
                    {usageData.summary.average_per_customer_gb.toFixed(2)} GB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Daily Usage Chart */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Daily Usage Trends" />
                <CardContent>
                  <Box height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={usageData.daily_usage}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis
                          label={{
                            value: "Usage (GB)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="download_gb"
                          name="Download"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="upload_gb"
                          name="Upload"
                          stroke="#82ca9d"
                        />
                        <Line
                          type="monotone"
                          dataKey="total_gb"
                          name="Total"
                          stroke="#ff7300"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Monthly Usage Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Monthly Usage" />
                <CardContent>
                  <Box height={350}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usageData.monthly_usage}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          label={{
                            value: "Usage (GB)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="download_gb"
                          name="Download"
                          fill="#8884d8"
                        />
                        <Bar dataKey="upload_gb" name="Upload" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tariff Usage Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Usage by Tariff" />
                <CardContent>
                  <Box height={350}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usageData.tariff_usage}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="total_gb"
                          nameKey="tariff_name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {usageData.tariff_usage.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value.toFixed(2)} GB`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Users Table */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Customer Usage Details" />
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer ID</TableCell>
                          <TableCell>Customer Name</TableCell>
                          <TableCell align="right">Download (GB)</TableCell>
                          <TableCell align="right">Upload (GB)</TableCell>
                          <TableCell align="right">Total (GB)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {usageData.customer_usage.map((row) => (
                          <TableRow key={row.customer_id}>
                            <TableCell component="th" scope="row">
                              {row.customer_id}
                            </TableCell>
                            <TableCell>{row.customer_name}</TableCell>
                            <TableCell align="right">
                              {row.download_gb.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {row.upload_gb.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              {row.total_gb.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default InternetUsageTab;
