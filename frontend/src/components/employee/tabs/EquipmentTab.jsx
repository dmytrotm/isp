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
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const EquipmentTab = () => {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [equipmentStats, setEquipmentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [openEquipmentDialog, setOpenEquipmentDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // create, edit, view

  // Form state
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    state: "new",
  });

  const { enqueueSnackbar } = useSnackbar();

  // Equipment states options
  const equipmentStates = ["new", "used"];

  // Load equipment and categories when component mounts
  useEffect(() => {
    fetchEquipment();
    fetchCategories();
    fetchEquipmentStatistics();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/equipment/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEquipment(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load equipment");
      setLoading(false);
      enqueueSnackbar("Failed to load equipment", { variant: "error" });
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/equipment-categories/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategories(response.data.results || response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load equipment categories", {
        variant: "error",
      });
    }
  };

  const fetchEquipmentStatistics = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/equipment_statistics/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEquipmentStats(response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load equipment statistics", {
        variant: "error",
      });
    }
  };

  const handleOpenDialog = (mode, item = null) => {
    setDialogMode(mode);

    if (item) {
      setSelectedEquipment(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price,
        stock_quantity: item.stock_quantity,
        category: item.category,
        state: item.state,
      });
    } else {
      setSelectedEquipment(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        category: "",
        state: "new",
      });
    }

    setOpenEquipmentDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenEquipmentDialog(false);
    setSelectedEquipment(null);
  };

  const handleOpenDeleteDialog = (item) => {
    setSelectedEquipment(item);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedEquipment(null);
  };

  const handleOpenStatsDialog = () => {
    setOpenStatsDialog(true);
  };

  const handleCloseStatsDialog = () => {
    setOpenStatsDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === "price" || name === "stock_quantity") {
      // Ensure these are positive numbers
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (dialogMode === "create") {
        // Create new equipment
        await api.post("/admin-dashboard/create_equipment/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        enqueueSnackbar("Equipment created successfully", {
          variant: "success",
        });
      } else if (dialogMode === "edit") {
        // Update existing equipment
        await api.put(
          `/admin-dashboard/${selectedEquipment.id}/update_equipment/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        enqueueSnackbar("Equipment updated successfully", {
          variant: "success",
        });
      }

      // Refresh equipment data
      fetchEquipment();
      fetchEquipmentStatistics();
      handleCloseDialog();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar(
        `Failed to ${
          dialogMode === "create" ? "create" : "update"
        } equipment: ${err.response?.data?.error || err.message}`,
        { variant: "error" }
      );
    }
  };

  const handleDeleteEquipment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await api.delete(
        `/admin-dashboard/${selectedEquipment.id}/delete_equipment/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar("Equipment deleted successfully", { variant: "success" });
      fetchEquipment();
      fetchEquipmentStatistics();
      handleCloseDeleteDialog();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      enqueueSnackbar(
        `Failed to delete equipment: ${
          err.response?.data?.error || err.message
        }`,
        { variant: "error" }
      );
    }
  };

  // Get chip color based on equipment state
  const getStateChipColor = (state) => {
    switch (state) {
      case "new":
        return "success";
      case "used":
        return "warning";
      default:
        return "default";
    }
  };

  // Get chip color based on stock quantity
  const getStockChipColor = (quantity) => {
    if (quantity <= 0) return "error";
    if (quantity <= 5) return "warning";
    return "success";
  };

  // Chart data preparation
  const prepareCategoryChartData = () => {
    if (!equipmentStats || !equipmentStats.category_breakdown) return [];

    return Object.entries(equipmentStats.category_breakdown).map(
      ([name, count]) => ({
        name,
        value: count,
      })
    );
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  if (loading && equipment.length === 0) {
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
          Equipment Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog("create")}
            sx={{ mr: 1 }}
          >
            Add Equipment
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

      {/* Equipment Table with horizontal scrolling */}
      <Box sx={{ overflowX: "auto", width: "100%" }}>
        <TableContainer component={Paper}>
          <Table aria-label="equipment table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description || "N/A"}</TableCell>
                  <TableCell>${parseFloat(item.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.stock_quantity}
                      color={getStockChipColor(item.stock_quantity)}
                    />
                  </TableCell>
                  <TableCell>{item.category_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.state}
                      color={getStateChipColor(item.state)}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog("view", item)}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleOpenDialog("edit", item)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDeleteDialog(item)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {equipment.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No equipment found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Equipment Dialog */}
      <Dialog
        open={openEquipmentDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create"
            ? "Create New Equipment"
            : dialogMode === "edit"
            ? "Edit Equipment"
            : "Equipment Details"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, overflowX: "auto" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Equipment Name"
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Stock Quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  type="number"
                  inputProps={{ min: 0, step: "1" }}
                  disabled={dialogMode === "view"}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={dialogMode === "view"}
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>State</InputLabel>
                  <Select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={dialogMode === "view"}
                  >
                    {equipmentStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              disabled={
                !formData.name ||
                !formData.price ||
                !formData.stock_quantity ||
                !formData.category
              }
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
            Are you sure you want to delete the equipment "
            {selectedEquipment?.name}"? This action cannot be undone.
          </DialogContentText>
          {selectedEquipment && selectedEquipment.active_assignments > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This equipment is currently assigned in{" "}
              {selectedEquipment.active_assignments} active contracts. Deleting
              it may cause issues.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteEquipment} color="error">
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
        <DialogTitle>Equipment Statistics</DialogTitle>
        <DialogContent>
          {equipmentStats ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Equipment
                      </Typography>
                      <Typography variant="h4">
                        {equipmentStats.total_equipment}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Low Stock Items
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {equipmentStats.low_stock_items}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Most Expensive
                      </Typography>
                      <Typography variant="h6">
                        {equipmentStats.most_expensive?.name || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        $
                        {parseFloat(
                          equipmentStats.most_expensive?.price || 0
                        ).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Category Breakdown Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Equipment by Category" />
                    <CardContent>
                      <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareCategoryChartData()}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {prepareCategoryChartData().map(
                                (entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                )
                              )}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Stock Level Chart */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Stock Levels (Top 10 Items)" />
                    <CardContent>
                      <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={equipmentStats.equipment_statistics.slice(
                              0,
                              10
                            )}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={false} />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name, props) => [
                                value,
                                props.payload.name,
                              ]}
                            />
                            <Legend />
                            <Bar
                              dataKey="stock_quantity"
                              name="Stock"
                              fill="#8884d8"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Equipment Details Table with horizontal scrolling */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Low Stock Equipment
                  </Typography>
                  <Box sx={{ overflowX: "auto", width: "100%" }}>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Stock Quantity</TableCell>
                            <TableCell>Active Assignments</TableCell>
                            <TableCell>State</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {equipmentStats.equipment_statistics
                            .filter((item) => item.stock_quantity <= 5)
                            .map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.category_name}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.stock_quantity}
                                    color={getStockChipColor(
                                      item.stock_quantity
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{item.active_assignments}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.state}
                                    color={getStateChipColor(item.state)}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          {equipmentStats.equipment_statistics.filter(
                            (item) => item.stock_quantity <= 5
                          ).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                No low stock items
                              </TableCell>
                            </TableRow>
                          )}
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

export default EquipmentTab;
