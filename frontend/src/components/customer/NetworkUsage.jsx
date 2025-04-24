import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from "../../services/api";

// MUI imports
import {
  Box,
  Typography,
  Paper,
  Button,
  ButtonGroup,
  TextField,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Chip,
} from "@mui/material";
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
} from "@mui/icons-material";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

// Helper to format date for input fields
const formatDateForInput = (date) => {
  return date.toISOString().split("T")[0];
};

export default function NetworkUsageGraph() {
  const [usageData, setUsageData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: formatDateForInput(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ), // 30 days ago
    endDate: formatDateForInput(new Date()), // today
  });

  // Predefined period options
  const periods = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "Custom", days: null },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState(periods[1]); // Default to 30 days

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get auth token from local storage or context
        const token = localStorage.getItem("token"); // Adjust based on how you store your auth token
        const bearer = `Bearer ${token}`;

        // Make API call to get network usage data
        const response = await api.get("network-usage/", {
          headers: {
            Authorization: bearer,
          },
        });

        // Format data for chart
        const formattedData = response.data
          .map((item) => ({
            date: formatDate(item.date),
            fullDate: item.date,
            download: parseFloat(item.download_gb),
            upload: parseFloat(item.upload_gb),
            total: item.total_usage,
            customer: item.contract_details.customer,
            service: item.contract_details.service,
            tariff: item.contract_details.tariff,
          }))
          .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

        console.log("Formatted chart data:", formattedData);
        setUsageData(formattedData);

        // Initially filter the data based on the default date range
        filterDataByDateRange(
          formattedData,
          dateRange.startDate,
          dateRange.endDate
        );
      } catch (err) {
        console.error("Error fetching network usage data:", err);
        setError("Failed to load network usage data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data when date range changes
  const filterDataByDateRange = (data, start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Step 1: Aggregate usage by date
    const aggregated = {};

    data.forEach((item) => {
      const dateStr = formatDate(item.fullDate); // e.g., "21/4"
      if (!aggregated[dateStr]) {
        aggregated[dateStr] = {
          date: dateStr,
          fullDate: item.fullDate,
          download: 0,
          upload: 0,
          total: 0,
        };
      }
      aggregated[dateStr].download += item.download;
      aggregated[dateStr].upload += item.upload;
      aggregated[dateStr].total += item.total;
    });

    // Step 2: Fill in all dates in the range, even if usage is zero
    const filledData = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = formatDate(current); // e.g., "21/4"
      const fullISO = current.toISOString().split("T")[0];

      if (aggregated[dateStr]) {
        filledData.push({
          ...aggregated[dateStr],
          fullDate: fullISO,
        });
      } else {
        filledData.push({
          date: dateStr,
          fullDate: fullISO,
          download: 0,
          upload: 0,
          total: 0,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    filledData.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    setFilteredData(filledData);
  };

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newDateRange = { ...dateRange, [name]: value };
    setDateRange(newDateRange);

    // Set to custom period when manually changing dates
    setSelectedPeriod(periods[3]);

    filterDataByDateRange(
      usageData,
      newDateRange.startDate,
      newDateRange.endDate
    );
  };

  // Handle predefined period selection
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);

    if (period.days) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - period.days);

      const newDateRange = {
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
      };

      setDateRange(newDateRange);
      filterDataByDateRange(
        usageData,
        newDateRange.startDate,
        newDateRange.endDate
      );
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading usage data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (usageData.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No network usage data available
      </Alert>
    );
  }

  // Customer info from the first record (assuming all records are for the same customer)
  const customerInfo = usageData[0];

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
          Network Usage - {customerInfo.customer}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Chip
            label={`Service: ${customerInfo.service}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Tariff: ${customerInfo.tariff}`}
            color="secondary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Time period selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
          Time Period
        </Typography>
        <ButtonGroup variant="outlined" sx={{ mb: 3 }}>
          {periods.map((period, index) => (
            <Button
              key={index}
              onClick={() => handlePeriodChange(period)}
              variant={selectedPeriod === period ? "contained" : "outlined"}
              color="primary"
              size="small"
            >
              {period.label}
            </Button>
          ))}
        </ButtonGroup>

        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          aria-label="chart type"
        >
          <ToggleButton value="line" aria-label="line chart">
            <LineChartIcon sx={{ mr: 1 }} />
            Line Chart
          </ToggleButton>
          <ToggleButton value="bar" aria-label="bar chart">
            <BarChartIcon sx={{ mr: 1 }} />
            Bar Chart
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart display */}
      <Box sx={{ width: "100%", height: 400, mb: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                label={{ value: "GB", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value) => [`${value} GB`, null]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="download"
                stroke="#1976d2" // MUI primary blue
                name="Download"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="upload"
                stroke="#2e7d32" // MUI green
                name="Upload"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ed6c02" // MUI warning orange
                name="Total"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
              />
            </LineChart>
          ) : (
            <BarChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                label={{ value: "GB", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value) => [`${value} GB`, null]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <Legend />
              <Bar dataKey="download" fill="#1976d2" name="Download" />
              <Bar dataKey="upload" fill="#2e7d32" name="Upload" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>

      {/* Display records count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Showing {filteredData.length} records from {dateRange.startDate} to{" "}
        {dateRange.endDate}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
          Usage Summary
        </Typography>
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}>
                <TableCell>Date</TableCell>
                <TableCell align="right">Download</TableCell>
                <TableCell align="right">Upload</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow
                  key={index}
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: "rgba(0, 0, 0, 0.02)",
                    },
                  }}
                >
                  <TableCell>{item.fullDate}</TableCell>
                  <TableCell align="right">
                    {item.download.toFixed(2)} GB
                  </TableCell>
                  <TableCell align="right">
                    {item.upload.toFixed(2)} GB
                  </TableCell>
                  <TableCell align="right">
                    {item.total.toFixed(2)} GB
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
}
