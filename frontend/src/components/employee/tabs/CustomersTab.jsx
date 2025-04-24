import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tooltip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import GetAppIcon from "@mui/icons-material/GetApp";
import UploadIcon from "@mui/icons-material/Upload";
import api from "../../../services/api";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext"; // Import useAuth hook

const CustomersTab = ({ search: globalSearch }) => {
  const { isAdmin } = useAuth(); // Get admin status from auth context
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add new state variables for create functionality
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    status: "active",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Add state variables for delete functionality
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add state variables for edit functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Add state variables for search functionality
  const [localSearch, setLocalSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // Add state for file upload
  const [importFile, setImportFile] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const [availableStatuses, setAvailableStatuses] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, globalSearch, searchValue]);

  useEffect(() => {
    // Fetch available statuses for customers
    api
      .get("/statuses/", {
        params: { context_name: "Customer" },
      })
      .then((response) => {
        setAvailableStatuses(response.data);
      })
      .catch((error) => console.error("Error fetching statuses:", error));
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = {
        page: page + 1, // API might use 1-based indexing
        page_size: rowsPerPage,
      };

      // Use either global search from parent or local search
      const searchTerm = searchValue;
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get("/admin-dashboard/customers/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params,
      });

      setCustomers(response.data.results || response.data);
      setTotalCustomers(response.data.count || response.data.length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      enqueueSnackbar("Failed to load customers", { variant: "error" });
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");

      // Make API call to download CSV
      const response = await api.get("/admin-dashboard/export_customers_csv/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "customers.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar("Customers exported successfully", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting customers:", error);
      enqueueSnackbar("Failed to export customers", { variant: "error" });
    }
  };

  const handleFileChange = (event) => {
    setImportFile(event.target.files[0]);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setImportError("");
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      setImportError("Please select a CSV file");
      return;
    }

    try {
      setImportLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("csv_file", importFile);

      const response = await api.post(
        "/admin-dashboard/import_customers_csv/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      enqueueSnackbar(
        `Successfully imported ${response.data.count} customers`,
        {
          variant: "success",
        }
      );
      fetchCustomers(); // Refresh the list
      handleCloseImportDialog();
    } catch (error) {
      console.error("Error importing customers:", error);
      setImportError(
        error.response?.data?.message || "Failed to import customers"
      );
      enqueueSnackbar("Failed to import customers", { variant: "error" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/admin-dashboard/${id}/customer-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDetailData(response.data);
      setDetailDialogOpen(true);
      setDetailLoading(false);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      enqueueSnackbar("Failed to load customer details", { variant: "error" });
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setDetailData(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Blocked":
        return "error";
      case "Inactive":
        return "warning";
      default:
        return "default";
    }
  };

  // Handle opening create dialog
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    setCreateError("");
    setNewCustomer({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
      status: 4,
    });
  };

  // Handle closing create dialog
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Handle input change for new customer form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle create customer submission
  const handleCreateCustomer = async () => {
    // Validate input
    if (
      !newCustomer.first_name ||
      !newCustomer.last_name ||
      !newCustomer.email ||
      !newCustomer.password
    ) {
      setCreateError("Please fill in all required fields");
      return;
    }

    try {
      setCreateLoading(true);
      const token = localStorage.getItem("token");

      await api.post("/admin-dashboard/create_customer/", newCustomer, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCreateDialogOpen(false);
      enqueueSnackbar("Customer created successfully", { variant: "success" });
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error("Error creating customer:", error);
      setCreateError(
        error.response?.data?.message || "Failed to create customer"
      );
      enqueueSnackbar("Failed to create customer", { variant: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");

      await api.delete(
        `/admin-dashboard/${customerToDelete.id}/delete_customer/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar("Customer deleted successfully", { variant: "success" });
      setDeleteDialogOpen(false);
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting customer:", error);
      enqueueSnackbar("Failed to delete customer", { variant: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle opening edit dialog
  const handleOpenEditDialog = async (customer) => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      console.log("Customer to Edit:", customer);

      // Get detailed customer information
      const response = await api.get(
        `/admin-dashboard/${customer.id}/customer-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Prepare customer data for editing
      const userData = response.data.user_details || {};

      setCustomerToEdit({
        id: customer.id,
        user_id: response.data.user, // Store user ID for update
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone_number: customer.phone_number || "",
        status: customer.status, // Store status ID, not name
        preferred_notification: customer.preferred_notification || "email",
      });

      setEditDialogOpen(true);
      setEditError("");
      setEditLoading(false);
    } catch (error) {
      console.error("Error fetching customer for edit:", error);
      enqueueSnackbar("Failed to load customer data for editing", {
        variant: "error",
      });
      setEditLoading(false);
    }
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCustomerToEdit(null);
  };

  // Handle input change for edit customer form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerToEdit((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle edit customer submission
  const handleUpdateCustomer = async () => {
    // Validate input
    if (
      !customerToEdit.first_name ||
      !customerToEdit.last_name ||
      !customerToEdit.email
    ) {
      setEditError("Please fill in all required fields");
      return;
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      console.log("Customer to Edit:", customerToEdit);

      // Prepare data for API - this is the key change
      const updateData = {
        phone_number: customerToEdit.phone_number,
        status: customerToEdit.status,
        preferred_notification: customerToEdit.preferred_notification,
        first_name: customerToEdit.first_name,
        last_name: customerToEdit.last_name,
        email: customerToEdit.email,
        user: customerToEdit.user_id,
      };

      console.log("Update Data:", updateData);

      // Update customer via API
      await api.put(
        `/admin-dashboard/${customerToEdit.id}/update_customer/`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditDialogOpen(false);
      enqueueSnackbar("Customer updated successfully", { variant: "success" });
      fetchCustomers(); // Refresh the list
    } catch (error) {
      console.error("Error updating customer:", error);
      setEditError(
        error.response?.data?.message ||
          JSON.stringify(error.response?.data) ||
          "Failed to update customer"
      );
      enqueueSnackbar("Failed to update customer", { variant: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle local search
  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const handleSearch = () => {
    setSearchValue(localSearch);
    setPage(0); // Reset to first page
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchValue("");
    setPage(0);
    fetchCustomers();
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          alignItems: "center",
        }}
      >
        <Typography variant="h5" component="h2">
          Customers
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Only show import/export buttons for admin users */}
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<GetAppIcon />}
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={handleOpenImportDialog}
              >
                Import CSV
              </Button>
            </>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Search Box */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          label="Search Customers"
          variant="outlined"
          size="small"
          value={localSearch}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          placeholder="Name, email or phone"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
        {searchValue && (
          <Button variant="outlined" onClick={handleClearSearch}>
            Clear
          </Button>
        )}
      </Box>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table aria-label="customers table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>{customer.id}</TableCell>
                    <TableCell>{`${customer.user_details?.first_name} ${customer.user_details?.last_name}`}</TableCell>
                    <TableCell>{customer.user_details?.email}</TableCell>
                    <TableCell>{customer.phone_number}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status_name}
                        color={getStatusColor(customer.status_name)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${customer.balance}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetail(customer.id)}
                            disabled={detailLoading}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit customer">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenEditDialog(customer)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete customer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(customer)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCustomers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Customer Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Customer Details
          <IconButton size="small" onClick={handleCloseDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : detailData ? (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Customer Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Name"
                          secondary={`${detailData.user_details?.first_name} ${detailData.user_details?.last_name}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Email"
                          secondary={detailData.user_details?.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Phone"
                          secondary={detailData.phone_number}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Chip
                              label={detailData.status_name}
                              color={getStatusColor(detailData.status_name)}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Balance"
                          secondary={`$${detailData.balance}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Customer Since"
                          secondary={new Date(
                            detailData.created_at
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Addresses */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Addresses
                    </Typography>
                    {detailData.addresses && detailData.addresses.length > 0 ? (
                      <List dense>
                        {detailData.addresses.map((address) => (
                          <ListItem key={address.id}>
                            <ListItemText
                              primary={`${address.street}, ${address.city}`}
                              secondary={`Building: ${address.building}, Apt: ${address.apartment}, Region: ${address.region_name}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No addresses found for this customer.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Contracts */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contracts
                    </Typography>
                    {detailData.contracts && detailData.contracts.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Contract ID</TableCell>
                              <TableCell>Address</TableCell>
                              <TableCell>Tariff</TableCell>
                              <TableCell>Start Date</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detailData.contracts.map((contract) => (
                              <TableRow key={contract.id}>
                                <TableCell>{contract.id}</TableCell>
                                <TableCell>{`${contract.address_details?.street}, ${contract.address_details?.city}`}</TableCell>
                                <TableCell>
                                  {contract.tariff_details?.name}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    contract.start_date
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      contract.is_active ? "Active" : "Inactive"
                                    }
                                    color={
                                      contract.is_active ? "success" : "default"
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No contracts found for this customer.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Invoices */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Invoices
                    </Typography>
                    {detailData.all_invoices &&
                    detailData.all_invoices.length > 0 ? (
                      <List dense>
                        {detailData.all_invoices.slice(0, 5).map((invoice) => (
                          <ListItem key={invoice.id}>
                            <ListItemText
                              primary={`Invoice #${invoice.id} - $${invoice.amount}`}
                              secondary={`Due: ${new Date(
                                invoice.due_date
                              ).toLocaleDateString()} - Status: ${
                                invoice.status
                              }`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No invoices found for this customer.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Support Tickets */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Support Tickets
                    </Typography>
                    {detailData.support_tickets &&
                    detailData.support_tickets.length > 0 ? (
                      <List dense>
                        {detailData.support_tickets
                          .slice(0, 5)
                          .map((ticket) => (
                            <ListItem key={ticket.id}>
                              <ListItemText
                                primary={ticket.subject}
                                secondary={`Created: ${new Date(
                                  ticket.created_at
                                ).toLocaleDateString()} - Status: ${
                                  ticket.status
                                }`}
                              />
                            </ListItem>
                          ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No support tickets found for this customer.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography>No data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent dividers>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="first_name"
                label="First Name"
                fullWidth
                required
                value={newCustomer.first_name}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="last_name"
                label="Last Name"
                fullWidth
                required
                value={newCustomer.last_name}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                required
                value={newCustomer.email}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="phone_number"
                label="Phone Number"
                fullWidth
                value={newCustomer.phone_number}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label="Password"
                type="password"
                fullWidth
                required
                value={newCustomer.password}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newCustomer.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  {availableStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button
            onClick={handleCreateCustomer}
            color="primary"
            variant="contained"
            disabled={createLoading}
          >
            {createLoading ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent dividers>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}

          {customerToEdit && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="First Name"
                  fullWidth
                  required
                  value={customerToEdit.first_name}
                  onChange={handleEditInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  label="Last Name"
                  fullWidth
                  required
                  value={customerToEdit.last_name}
                  onChange={handleEditInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={customerToEdit.email}
                  onChange={handleEditInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="phone_number"
                  label="Phone Number"
                  fullWidth
                  value={customerToEdit.phone_number}
                  onChange={handleEditInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={customerToEdit.status}
                    onChange={handleEditInputChange}
                    label="Status"
                  >
                    {availableStatuses.map((status) => (
                      <MenuItem key={status.id} value={status.id}>
                        {status.status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Preferred Notification</InputLabel>
                  <Select
                    name="preferred_notification"
                    value={customerToEdit.preferred_notification}
                    onChange={handleEditInputChange}
                    label="Preferred Notification"
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateCustomer}
            color="primary"
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete customer:{" "}
            {customerToDelete
              ? `${customerToDelete.user_details?.first_name} ${customerToDelete.user_details?.last_name}`
              : ""}
            ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data will be
            permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteCustomer}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Customers from CSV</DialogTitle>
        <DialogContent dividers>
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}

          <Typography variant="body2" paragraph>
            Please upload a CSV file with the following columns: first_name,
            last_name, email, password, phone_number, status.
          </Typography>

          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Select CSV File
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>

          {importFile && (
            <Typography variant="body2" color="primary">
              Selected file: {importFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          <Button
            onClick={handleImportCSV}
            color="primary"
            variant="contained"
            disabled={importLoading || !importFile}
          >
            {importLoading ? <CircularProgress size={24} /> : "Import"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersTab;
