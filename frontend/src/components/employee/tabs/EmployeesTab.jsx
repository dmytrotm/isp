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

const EmployeesTab = ({ search: globalSearch }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // State variables for create functionality
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // State variables for delete functionality
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // State variables for edit functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // State variables for search functionality
  const [localSearch, setLocalSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // State for file upload
  const [importFile, setImportFile] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");

  const [availableRoles, setAvailableRoles] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchEmployees();
  }, [page, rowsPerPage, globalSearch, searchValue]);

  useEffect(() => {
    // Fetch available roles for employees
    api
      .get("/employee-roles/")
      .then((response) => {
        setAvailableRoles(response.data);
      })
      .catch((error) => console.error("Error fetching roles:", error));
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = {
        page: page + 1,
        page_size: rowsPerPage,
      };

      // Use either global search from parent or local search
      const searchTerm = searchValue;
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get("/admin-dashboard/employees/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params,
      });

      setEmployees(response.data.results || response.data);
      setTotalEmployees(response.data.count || response.data.length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      enqueueSnackbar("Failed to load employees", { variant: "error" });
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");

      // Make API call to download CSV
      const response = await api.get("/admin-dashboard/export_employees_csv/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employees.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar("Employees exported successfully", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error exporting employees:", error);
      enqueueSnackbar("Failed to export employees", { variant: "error" });
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
        "/admin-dashboard/import_employees_csv/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      enqueueSnackbar(
        `Successfully imported ${response.data.count} employees`,
        {
          variant: "success",
        }
      );
      fetchEmployees(); // Refresh the list
      handleCloseImportDialog();
    } catch (error) {
      console.error("Error importing employees:", error);
      setImportError(
        error.response?.data?.message || "Failed to import employees"
      );
      enqueueSnackbar("Failed to import employees", { variant: "error" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/admin-dashboard/${id}/employee-details/`,
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
      console.error("Error fetching employee details:", error);
      enqueueSnackbar("Failed to load employee details", { variant: "error" });
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

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "error";
      case "manager":
        return "primary";
      case "support":
        return "success";
      default:
        return "default";
    }
  };

  // Handle opening create dialog
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    setCreateError("");
    setNewEmployee({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "",
    });
  };

  // Handle closing create dialog
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Handle input change for new employee form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle create employee submission
  const handleCreateEmployee = async () => {
    // Validate input
    if (
      !newEmployee.first_name ||
      !newEmployee.last_name ||
      !newEmployee.email ||
      !newEmployee.password ||
      !newEmployee.role
    ) {
      setCreateError("Please fill in all required fields");
      return;
    }

    try {
      setCreateLoading(true);
      const token = localStorage.getItem("token");

      await api.post("/admin-dashboard/create_employee/", newEmployee, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCreateDialogOpen(false);
      enqueueSnackbar("Employee created successfully", { variant: "success" });
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Error creating employee:", error);
      setCreateError(
        error.response?.data?.message || "Failed to create employee"
      );
      enqueueSnackbar("Failed to create employee", { variant: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");

      await api.delete(
        `/admin-dashboard/${employeeToDelete.id}/delete_employee/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar("Employee deleted successfully", { variant: "success" });
      setDeleteDialogOpen(false);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Error deleting employee:", error);
      enqueueSnackbar("Failed to delete employee", { variant: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle opening edit dialog
  const handleOpenEditDialog = async (employee) => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      // Get detailed employee information
      const response = await api.get(
        `/admin-dashboard/${employee.id}/employee-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Prepare employee data for editing
      const userData = response.data.user_details || {};

      setEmployeeToEdit({
        id: employee.id,
        user_id: response.data.user,
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        role: employee.role || "",
      });

      setEditDialogOpen(true);
      setEditError("");
      setEditLoading(false);
    } catch (error) {
      console.error("Error fetching employee for edit:", error);
      enqueueSnackbar("Failed to load employee data for editing", {
        variant: "error",
      });
      setEditLoading(false);
    }
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEmployeeToEdit(null);
  };

  // Handle input change for edit employee form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeToEdit((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle edit employee submission
  const handleUpdateEmployee = async () => {
    // Validate input
    if (
      !employeeToEdit.first_name ||
      !employeeToEdit.last_name ||
      !employeeToEdit.email ||
      !employeeToEdit.role
    ) {
      setEditError("Please fill in all required fields");
      return;
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      // Prepare data for API
      const updateData = {
        role: employeeToEdit.role,
        first_name: employeeToEdit.first_name,
        last_name: employeeToEdit.last_name,
        email: employeeToEdit.email,
        user: employeeToEdit.user_id,
      };

      // Update employee via API
      await api.put(
        `/admin-dashboard/${employeeToEdit.id}/update_employee/`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditDialogOpen(false);
      enqueueSnackbar("Employee updated successfully", { variant: "success" });
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Error updating employee:", error);
      setEditError(
        error.response?.data?.message ||
          JSON.stringify(error.response?.data) ||
          "Failed to update employee"
      );
      enqueueSnackbar("Failed to update employee", { variant: "error" });
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
    fetchEmployees();
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
          Employees
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Search Box */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          label="Search Employees"
          variant="outlined"
          size="small"
          value={localSearch}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          placeholder="Name or email"
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
          <Table aria-label="employees table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>{employee.id}</TableCell>
                    <TableCell>{`${employee.user_details?.first_name} ${employee.user_details?.last_name}`}</TableCell>
                    <TableCell>{employee.user_details?.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.role_name}
                        color={getRoleColor(employee.role_name)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetail(employee.id)}
                            disabled={detailLoading}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit employee">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenEditDialog(employee)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete employee">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteDialog(employee)}
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
          count={totalEmployees}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Employee Details Dialog */}
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
          Employee Details
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
                      Employee Information
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
                          primary="Role"
                          secondary={
                            <Chip
                              label={detailData.role_name}
                              color={getRoleColor(detailData.role_name)}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Staff Member Since"
                          secondary={new Date(
                            detailData.created_at
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Permissions */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Permissions & Groups
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Is Staff"
                          secondary={
                            detailData.user_details?.is_staff ? "Yes" : "No"
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Is Superuser"
                          secondary={
                            detailData.user_details?.is_superuser ? "Yes" : "No"
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="User Groups"
                          secondary={
                            detailData.user_groups &&
                            detailData.user_groups.length > 0
                              ? detailData.user_groups.join(", ")
                              : "No groups assigned"
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Activities */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activities
                    </Typography>
                    {detailData.recent_activities &&
                    detailData.recent_activities.length > 0 ? (
                      <List dense>
                        {detailData.recent_activities.map((activity, index) => (
                          <ListItem
                            key={index}
                            divider={
                              index < detailData.recent_activities.length - 1
                            }
                          >
                            <ListItemText
                              primary={activity.action}
                              secondary={`${new Date(
                                activity.timestamp
                              ).toLocaleString()} - ${activity.details}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No recent activities recorded.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Assigned Tickets */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Assigned Support Tickets
                    </Typography>
                    {detailData.assigned_tickets &&
                    detailData.assigned_tickets.length > 0 ? (
                      <List dense>
                        {detailData.assigned_tickets
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
                        No tickets currently assigned to this employee.
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

      {/* Create Employee Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Employee</DialogTitle>
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
                value={newEmployee.first_name}
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
                value={newEmployee.last_name}
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
                value={newEmployee.email}
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
                value={newEmployee.password}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={newEmployee.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
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
            onClick={handleCreateEmployee}
            color="primary"
            variant="contained"
            disabled={createLoading}
          >
            {createLoading ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent dividers>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}

          {employeeToEdit && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="First Name"
                  fullWidth
                  required
                  value={employeeToEdit.first_name}
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
                  value={employeeToEdit.last_name}
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
                  value={employeeToEdit.email}
                  onChange={handleEditInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={employeeToEdit.role}
                    onChange={handleEditInputChange}
                    label="Role"
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateEmployee}
            color="primary"
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Employee Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete employee:{" "}
            {employeeToDelete
              ? `${employeeToDelete.user_details?.first_name} ${employeeToDelete.user_details?.last_name}`
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
            onClick={handleDeleteEmployee}
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
        <DialogTitle>Import Employees from CSV</DialogTitle>
        <DialogContent dividers>
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}
          <Typography variant="body2" gutterBottom>
            Upload a CSV file with employee data to bulk import. The file should
            follow the required format.
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            sx={{ mt: 2 }}
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
            <Typography variant="body2" sx={{ mt: 1 }}>
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

export default EmployeesTab;