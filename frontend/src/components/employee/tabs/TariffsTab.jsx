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
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Grid,
  IconButton,
  Switch,
  Divider,
  CircularProgress,
  Alert,
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
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
} from "@mui/icons-material";


const TariffsTab = () => {
  const [tariffs, setTariffs] = useState([]);
  const [services, setServices] = useState([]);
  const [tariffStats, setTariffStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const fileInputRef = React.useRef();

  // Dialog states
  const [openTariffDialog, setOpenTariffDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // create, edit, view

  // Form state
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_active: true,
    services: [],
  });

  const { enqueueSnackbar } = useSnackbar();

  // Load tariffs and services when component mounts
  useEffect(() => {
    fetchTariffs();
    fetchServices();
    fetchTariffStatistics();
  }, []);

  const handleExportTariffs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/export_tariffs_csv/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tariffs.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar("Tariffs exported successfully", { variant: "success" });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar("Failed to export tariffs", { variant: "error" });
    }
  };

  const handleFileChange = (event) => {
    setCsvFile(event.target.files[0]);
  };

  const handleImportTariffs = async () => {
    if (!csvFile) {
      enqueueSnackbar("Please select a CSV file to import", {
        variant: "warning",
      });
      return;
    }

    try {
      setImporting(true);
      setImportError(null);
      setImportSuccess(null);

      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("csv_file", csvFile);

      const response = await api.post(
        "/admin-dashboard/import_tariffs_csv/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImportSuccess(`Successfully imported ${response.data.count} tariffs`);
      if (response.data.errors && response.data.errors.length > 0) {
        setImportError(
          `There were ${response.data.errors.length} errors during import.`
        );
      }

      // Reset file input
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh tariff data
      fetchTariffs();
      fetchTariffStatistics();

      enqueueSnackbar("Tariffs imported successfully", { variant: "success" });
      setImporting(false);
    } catch (err) {
      setImporting(false);
      setImportError(err.response?.data?.message || err.message);
      enqueueSnackbar("Failed to import tariffs", { variant: "error" });
    }
  };

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/tariffs/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTariffs(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load tariffs");
      setLoading(false);
      enqueueSnackbar("Failed to load tariffs", { variant: "error" });
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/services/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setServices(response.data.results || response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load services", { variant: "error" });
    }
  };

  const fetchTariffStatistics = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/tariff_statistics/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTariffStats(response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load tariff statistics", { variant: "error" });
    }
  };

  const handleOpenDialog = (mode, tariff = null) => {
    setDialogMode(mode);

    if (tariff) {
      setSelectedTariff(tariff);
      // Extract service IDs for the form
      const serviceIds = tariff.services?.map((service) => service.id) || [];

      setFormData({
        name: tariff.name,
        description: tariff.description || "",
        price: tariff.price,
        is_active: tariff.is_active,
        services: serviceIds,
      });
    } else {
      setSelectedTariff(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        is_active: true,
        services: [],
      });
    }

    setOpenTariffDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenTariffDialog(false);
    setSelectedTariff(null);
  };

  const handleOpenDeleteDialog = (tariff) => {
    setSelectedTariff(tariff);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedTariff(null);
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
    } else if (name === "price") {
      // Ensure price is a positive number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleServiceChange = (serviceId) => {
    const currentServices = [...formData.services];
    const serviceIndex = currentServices.indexOf(serviceId);

    if (serviceIndex === -1) {
      currentServices.push(serviceId);
    } else {
      currentServices.splice(serviceIndex, 1);
    }

    setFormData({ ...formData, services: currentServices });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (dialogMode === "create") {
        // Create new tariff
        await api.post("/admin-dashboard/create_tariff/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        enqueueSnackbar("Tariff created successfully", { variant: "success" });
      } else if (dialogMode === "edit") {
        // Update existing tariff
        await api.put(
          `/admin-dashboard/${selectedTariff.id}/update_tariff/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        enqueueSnackbar("Tariff updated successfully", { variant: "success" });
      }

      // Refresh tariff data
      fetchTariffs();
      fetchTariffStatistics();
      handleCloseDialog();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar(
        `Failed to ${dialogMode === "create" ? "create" : "update"} tariff: ${
          err.response?.data?.error || err.message
        }`,
        { variant: "error" }
      );
    }
  };

  const handleDeleteTariff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await api.delete(`/admin-dashboard/${selectedTariff.id}/delete_tariff/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      enqueueSnackbar("Tariff deleted successfully", { variant: "success" });
      fetchTariffs();
      fetchTariffStatistics();
      handleCloseDeleteDialog();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar(
        `Failed to delete tariff: ${err.response?.data?.error || err.message}`,
        { variant: "error" }
      );
    }
  };

  // Chart data preparation
  const prepareUsageChartData = () => {
    if (!tariffStats || !tariffStats.tariff_statistics) return [];

    return tariffStats.tariff_statistics.map((tariff) => ({
      name: tariff.name,
      value: tariff.active_contracts,
    }));
  };

  const prepareRevenueChartData = () => {
    if (!tariffStats || !tariffStats.tariff_statistics) return [];

    return tariffStats.tariff_statistics.map((tariff) => ({
      name: tariff.name,
      value: tariff.monthly_revenue,
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

  if (loading && tariffs.length === 0) {
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
    <Box sx={{ padding: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{
          overflowX: "auto",
          width: "100%",
          whiteSpace: "nowrap",
        }}
      >
        <Typography variant="h5" component="h2">
          Tariff Management
        </Typography>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          mb={2}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog("create")}
            sx={{ mr: 1 }}
          >
            Add Tariff
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={handleExportTariffs}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current.click()}
          >
            Import
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{ display: "none" }}
          />
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

      {csvFile && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Selected file: {csvFile.name}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleImportTariffs}
            disabled={importing}
          >
            {importing ? <CircularProgress size={24} /> : "Import Now"}
          </Button>
        </Box>
      )}

      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {importSuccess}
        </Alert>
      )}

      {importError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {importError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tariffs Table with horizontal scrolling */}
      <Box sx={{ overflowX: "auto", width: "100%" }}>
        <TableContainer component={Paper}>
          <Table aria-label="tariffs table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tariffs.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell>{tariff.id}</TableCell>
                  <TableCell>{tariff.name}</TableCell>
                  <TableCell>{tariff.description || "N/A"}</TableCell>
                  <TableCell>${parseFloat(tariff.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={tariff.is_active ? "Active" : "Inactive"}
                      color={tariff.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {tariff.services?.length || 0} service(s)
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog("view", tariff)}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleOpenDialog("edit", tariff)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDeleteDialog(tariff)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {tariffs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No tariffs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Tariff Dialog */}
      <Dialog
        open={openTariffDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create"
            ? "Create New Tariff"
            : dialogMode === "edit"
            ? "Edit Tariff"
            : "Tariff Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, overflowX: "auto" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tariff Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  disabled={dialogMode === "view"}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
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

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Included Services
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <FormGroup>
                  <Box sx={{ overflowX: "auto" }}>
                    <Grid container spacing={2} sx={{ minWidth: 500 }}>
                      {services.map((service) => (
                        <Grid item xs={12} sm={6} md={4} key={service.id}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.services.includes(service.id)}
                                onChange={() => handleServiceChange(service.id)}
                                name={`service-${service.id}`}
                                disabled={dialogMode === "view"}
                              />
                            }
                            label={service.name}
                          />
                        </Grid>
                      ))}
                      {services.length === 0 && (
                        <Grid item xs={12}>
                          <Typography color="text.secondary">
                            No services available
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </FormGroup>
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
              disabled={!formData.name || !formData.price}
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
          <DialogContentText>
            Are you sure you want to delete the tariff "{selectedTariff?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteTariff} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog with scrollable content */}
      <Dialog
        open={openStatsDialog}
        onClose={handleCloseStatsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Tariff Statistics</DialogTitle>
        <DialogContent>
          {tariffStats ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Tariffs
                      </Typography>
                      <Typography variant="h4">
                        {tariffStats.total_tariffs}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Tariffs
                      </Typography>
                      <Typography variant="h4">
                        {tariffStats.active_tariffs}
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
                        {tariffStats.most_popular?.name || "N/A"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Charts */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Monthly Revenue by Tariff" />
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

                {/* Tariff Details Table with horizontal scrolling */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Tariff Details
                  </Typography>
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
                          {tariffStats.tariff_statistics.map((tariff) => (
                            <TableRow key={tariff.id}>
                              <TableCell>{tariff.name}</TableCell>
                              <TableCell>
                                ${parseFloat(tariff.price).toFixed(2)}
                              </TableCell>
                              <TableCell>{tariff.active_contracts}</TableCell>
                              <TableCell>
                                ${tariff.monthly_revenue.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    tariff.is_active ? "Active" : "Inactive"
                                  }
                                  color={
                                    tariff.is_active ? "success" : "default"
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
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

export default TariffsTab;
