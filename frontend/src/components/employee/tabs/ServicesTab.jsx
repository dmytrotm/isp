import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import api from "../../../services/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const ServicesTab = () => {
  const [services, setServices] = useState([]);
  const [serviceStats, setServiceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [openServiceDialog, setOpenServiceDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // create, edit, view

  // Form state
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const { enqueueSnackbar } = useSnackbar();

  // Load services when component mounts
  useEffect(() => {
    fetchServices();
    fetchServiceStatistics();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/services/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServices(response.data.results || response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load services");
      setLoading(false);
      enqueueSnackbar("Failed to load services", { variant: "error" });
    }
  };

  const fetchServiceStatistics = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/service_statistics/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServiceStats(response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load service statistics", {
        variant: "error",
      });
    }
  };

  const handleOpenDialog = (mode, service = null) => {
    setDialogMode(mode);

    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description || "",
        is_active: service.is_active,
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: "",
        description: "",
        is_active: true,
      });
    }

    setOpenServiceDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenServiceDialog(false);
    setSelectedService(null);
  };

  const handleOpenDeleteDialog = (service) => {
    setSelectedService(service);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedService(null);
  };

  const handleOpenStatsDialog = () => {
    setOpenStatsDialog(true);
  };

  const handleCloseStatsDialog = () => {
    setOpenStatsDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === "is_active") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (dialogMode === "create") {
        // Create new service
        await api.post("/admin-dashboard/create_service/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        enqueueSnackbar("Service created successfully", { variant: "success" });
      } else if (dialogMode === "edit") {
        // Update existing service
        await api.put(
          `/admin-dashboard/${selectedService.id}/update_service/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        enqueueSnackbar("Service updated successfully", { variant: "success" });
      }

      // Refresh service data
      fetchServices();
      fetchServiceStatistics();
      handleCloseDialog();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar(
        `Failed to ${dialogMode === "create" ? "create" : "update"} service: ${
          err.response?.data?.error || err.message
        }`,
        { variant: "error" }
      );
    }
  };

  const handleDeleteService = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await api.delete(
        `/admin-dashboard/${selectedService.id}/delete_service/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar("Service deleted successfully", { variant: "success" });
      fetchServices();
      fetchServiceStatistics();
      handleCloseDeleteDialog();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar(
        `Failed to delete service: ${err.response?.data?.error || err.message}`,
        { variant: "error" }
      );
    }
  };

  // Chart data preparation
  const prepareUsageChartData = () => {
    if (!serviceStats || !serviceStats.service_statistics) return [];

    return serviceStats.service_statistics.map((service) => ({
      name: service.name,
      value: service.active_contracts,
    }));
  };

  const prepareRevenueChartData = () => {
    if (!serviceStats || !serviceStats.service_statistics) return [];

    return serviceStats.service_statistics.map((service) => ({
      name: service.name,
      value: service.monthly_revenue,
    }));
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  if (loading && services.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" component="h2">
          Service Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog("create")}
            sx={{ mr: 1 }}
          >
            Add Service
          </Button>
          <Button
            variant="outlined"
            color="info"
            startIcon={<TrendingUpIcon />}
            onClick={handleOpenStatsDialog}
          >
            Statistics
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Services Table */}
      <TableContainer component={Paper}>
        <Table aria-label="services table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.id}</TableCell>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.description || "N/A"}</TableCell>
                <TableCell>
                  <Chip
                    label={service.is_active ? "Active" : "Inactive"}
                    color={service.is_active ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog("view", service)}
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleOpenDialog("edit", service)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDeleteDialog(service)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No services found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Service Dialog */}
      <Dialog
        open={openServiceDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create"
            ? "Create New Service"
            : dialogMode === "edit"
            ? "Edit Service"
            : "Service Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Service Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  disabled={dialogMode === "view"}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  disabled={dialogMode === "view"}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      name="is_active"
                      color="primary"
                      disabled={dialogMode === "view"}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === "view" ? "Close" : "Cancel"}
          </Button>
          {dialogMode !== "view" && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={!formData.name}
            >
              {dialogMode === "create" ? "Create" : "Update"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the service "{selectedService?.name}
            "? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteService} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog
        open={openStatsDialog}
        onClose={handleCloseStatsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Service Statistics</DialogTitle>
        <DialogContent>
          {serviceStats ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Services
                      </Typography>
                      <Typography variant="h4">
                        {serviceStats.total_services}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Services
                      </Typography>
                      <Typography variant="h4">
                        {serviceStats.active_services}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Most Popular
                      </Typography>
                      <Typography variant="h4">
                        {serviceStats.most_popular?.name || "N/A"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Charts */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Monthly Revenue by Service" />
                    <CardContent>
                      <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareRevenueChartData()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {prepareRevenueChartData().map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Service Usage in Contracts" />
                    <CardContent>
                      <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareUsageChartData()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {prepareUsageChartData().map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
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

                {/* Service Details Table */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Service Details
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Active Contracts</TableCell>
                          <TableCell>Monthly Revenue</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {serviceStats.service_statistics.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>{service.name}</TableCell>
                            <TableCell>{service.active_contracts}</TableCell>
                            <TableCell>
                              ${service.monthly_revenue.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  service.is_active ? "Active" : "Inactive"
                                }
                                color={
                                  service.is_active ? "success" : "default"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" mt={3} mb={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesTab;
