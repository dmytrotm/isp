import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";
import api from "../../services/api";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  AlertTitle,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Receipt as ReceiptIcon,
  ReceiptLong as ReceiptLongIcon,
  Payment as PaymentIcon,
  Support as SupportIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  PowerSettingsNew as PowerIcon,
  ContactMail as ContactMailIcon,
  Article as ArticleIcon,
  Dashboard as DashboardIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerDashboard = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [userProfile, setUserProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const currentUserResponse = await api.get("/auth/user/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const customerId = currentUserResponse.data.customer.id;

        // Fetch dashboard data
        const dashboardResponse = await api.get(
          `/customers/${customerId}/dashboard/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDashboardData(dashboardResponse.data);

        // Initialize user profile data
        setUserProfile({
          first_name: dashboardResponse.data.user_details.first_name,
          last_name: dashboardResponse.data.user_details.last_name,
          email: dashboardResponse.data.user_details.email,
          phone_number: dashboardResponse.data.phone_number || "",
        });

        // Fetch related data
        const contractsResponse = await api.get(
          `/customers/${customerId}/contracts/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setContracts(contractsResponse.data);

        const invoicesResponse = await api.get(
          `/customers/${customerId}/invoices/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setInvoices(invoicesResponse.data);

        const paymentsResponse = await api.get(
          `/customers/${customerId}/payments/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPayments(paymentsResponse.data);

        const ticketsResponse = await api.get(
          `/customers/${customerId}/support_tickets/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTickets(ticketsResponse.data);

        const requestsResponse = await api.get(`/connection-requests/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRequests(requestsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form if canceling edit
      setUserProfile({
        first_name: dashboardData.user_details.first_name,
        last_name: dashboardData.user_details.last_name,
        email: dashboardData.user_details.email,
        phone_number: dashboardData.phone_number || "",
      });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const customerId = dashboardData.id;

      await api.patch(`/customers/update_customer_profile/`, userProfile, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local dashboard data with new profile info
      setDashboardData((prevData) => ({
        ...prevData,
        user_details: {
          ...prevData.user_details,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          email: userProfile.email,
        },
        phone_number: userProfile.phone_number,
      }));

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  // Get number of overdue invoices
  const getOverdueInvoicesCount = () => {
    return invoices.filter((invoice) => invoice.status === "overdue").length;
  };

  // Function to get chip color based on status
  const getStatusChipColor = (status, type) => {
    if (type === "invoice") {
      return status === "paid"
        ? "success"
        : status === "overdue"
        ? "error"
        : "warning";
    } else if (type === "ticket") {
      return status === "resolved" || status === "closed"
        ? "success"
        : status === "new"
        ? "info"
        : "warning";
    } else if (type === "contract") {
      return status ? "success" : "error";
    } else if (type === "request") {
      return status === "approved"
        ? "success"
        : status === "rejected"
        ? "error"
        : status === "in_progress"
        ? "warning"
        : "info";
    }
    return "default";
  };

  // Format status text
  const formatStatusText = (status) => {
    // First check if status is a string
    if (typeof status !== "string") {
      // Convert boolean to string if it's a boolean, or just return the value as a string
      return status === true
        ? "Active"
        : status === false
        ? "Inactive"
        : String(status);
    }

    return status
      .replace("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleViewRequestDetail = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get(`/connection-requests/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDetailData(response.data);
      setDetailDialogOpen(true);
    } catch (err) {
      setError(err.message || "Failed to load connection request details");
      setLoading(false);
    }
  };

  const downloadContractPDF = async (contractId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/contracts/${contractId}/export_pdf/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const downloadInvoicePDF = async (invoiceId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/invoices/${invoiceId}/generate_pdf/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
    }
  };

  const downloadPaymentReceipt = async (paymentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/payments/${paymentId}/generate_receipt/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      {/* Left Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", mt: 2 }}>
          <List>
            <ListItem button onClick={() => navigateTo("/")}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Main Page" />
            </ListItem>
            <ListItem button onClick={() => navigateTo("/make-payment")}>
              <ListItemIcon>
                <PaymentIcon />
              </ListItemIcon>
              <ListItemText primary="Make Payment" />
            </ListItem>
            <ListItem button onClick={() => navigateTo("/support/new")}>
              <ListItemIcon>
                <HelpOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="New Support Ticket" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => navigateTo("/make-payment")}>
              <ListItemIcon>
                <PaymentIcon />
              </ListItemIcon>
              <ListItemText primary="Make Payment" />
            </ListItem>
            <ListItem button onClick={() => navigateTo("/support/new")}>
              <ListItemIcon>
                <HelpOutlineIcon />
              </ListItemIcon>
              <ListItemText primary="New Support Ticket" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}
      >
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Network Provider Customer Portal
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Toolbar />

        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {dashboardData?.user_details?.first_name}{" "}
            {dashboardData?.user_details?.last_name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Account Status: {dashboardData?.status_name} | Current Balance: $
            {dashboardData?.balance}
          </Typography>
        </Box>

        {/* Dashboard Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Account Info Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <PersonIcon />
                  </Avatar>
                }
                title="Account Information"
                action={
                  <IconButton onClick={toggleEditing}>
                    {isEditing ? <CancelIcon color="error" /> : <EditIcon />}
                  </IconButton>
                }
              />
              <CardContent>
                {!isEditing ? (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Status:</strong> {dashboardData?.status_name}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Email:</strong>{" "}
                      {dashboardData?.user_details?.email}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Phone:</strong>{" "}
                      {dashboardData?.phone_number || "Not provided"}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Customer Since:</strong>{" "}
                      {new Date(
                        dashboardData?.user_details?.created_at
                      ).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Monthly Payment:</strong> $
                      {dashboardData?.total_monthly_payment}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    component="form"
                    onSubmit={handleProfileSubmit}
                    noValidate
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="first_name"
                      label="First Name"
                      name="first_name"
                      value={userProfile.first_name}
                      onChange={handleProfileChange}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="last_name"
                      label="Last Name"
                      name="last_name"
                      value={userProfile.last_name}
                      onChange={handleProfileChange}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      type="email"
                      value={userProfile.email}
                      onChange={handleProfileChange}
                    />
                    <TextField
                      margin="normal"
                      fullWidth
                      id="phone_number"
                      label="Phone Number"
                      name="phone_number"
                      value={userProfile.phone_number}
                      onChange={handleProfileChange}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      startIcon={<SaveIcon />}
                      sx={{ mt: 2 }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Alerts Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: "warning.main" }}>
                    <WarningIcon />
                  </Avatar>
                }
                title="Alerts & Notifications"
              />
              <CardContent>
                {getOverdueInvoicesCount() > 0 ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Payment Required</AlertTitle>
                    You have {getOverdueInvoicesCount()} overdue{" "}
                    {getOverdueInvoicesCount() === 1 ? "invoice" : "invoices"}.
                    Please make a payment to avoid service interruption.
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setTabValue(2)}
                      >
                        View Invoices
                      </Button>
                    </Box>
                  </Alert>
                ) : (
                  <Alert severity="success">
                    <AlertTitle>Good Standing</AlertTitle>
                    Your account is up to date! No alerts at this time.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: "success.main" }}>
                    <SpeedIcon />
                  </Avatar>
                }
                title="Quick Actions"
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<PaymentIcon />}
                      onClick={() => navigateTo("/make-payment")}
                    >
                      Pay Now
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<SupportIcon />}
                      onClick={() => navigateTo("/support/new")}
                    >
                      Support
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<SpeedIcon />}
                      onClick={() => navigateTo("/network-usage")}
                    >
                      Usage
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<PowerIcon />}
                      onClick={() => navigateTo("/connection-request")}
                    >
                      New Request
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Box sx={{ width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Dashboard" />
              <Tab label="Contracts" />
              <Tab label="Invoices" />
              <Tab label="Payments" />
              <Tab label="Support Tickets" />
              <Tab label="Connection Requests" />
            </Tabs>
          </Box>

          {/* Dashboard Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader
                    title="Recent Invoices"
                    action={
                      <Button
                        size="small"
                        onClick={() => setTabValue(2)}
                        endIcon={<ReceiptIcon />}
                      >
                        View All
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {invoices.length > 0 ? (
                      <TableContainer>
                        <Table aria-label="recent invoices table" size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Invoice #</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Due Date</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoices.slice(0, 3).map((invoice) => (
                              <TableRow key={invoice.id}>
                                <TableCell>#{invoice.id}</TableCell>
                                <TableCell>${invoice.amount}</TableCell>
                                <TableCell>
                                  {new Date(
                                    invoice.due_date
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={invoice.status}
                                    color={getStatusChipColor(
                                      invoice.status,
                                      "invoice"
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="textSecondary">
                        No invoices found.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardHeader
                    title="Recent Support Tickets"
                    action={
                      <Button
                        size="small"
                        onClick={() => setTabValue(4)}
                        endIcon={<SupportIcon />}
                      >
                        View All
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {tickets.length > 0 ? (
                      <TableContainer>
                        <Table aria-label="recent tickets table" size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Ticket #</TableCell>
                              <TableCell>Subject</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Created</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tickets.slice(0, 3).map((ticket) => (
                              <TableRow key={ticket.id}>
                                <TableCell>#{ticket.id}</TableCell>
                                <TableCell>{ticket.subject}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={formatStatusText(ticket.status)}
                                    color={getStatusChipColor(
                                      ticket.status,
                                      "ticket"
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    ticket.created_at
                                  ).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="textSecondary">
                        No support tickets found.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Contracts Tab */}
          <TabPanel value={tabValue} index={1}>
            <Paper elevation={1}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Your Contracts
                </Typography>
                {contracts.length > 0 ? (
                  <TableContainer>
                    <Table aria-label="contracts table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Contract #</TableCell>
                          <TableCell>Service</TableCell>
                          <TableCell>Tariff</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>#{contract.id}</TableCell>
                            <TableCell>
                              {contract.service_details.name}
                            </TableCell>
                            <TableCell>
                              {contract.tariff
                                ? contract.tariff_details.name
                                : "N/A"}
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
                                color={getStatusChipColor(
                                  contract.is_active,
                                  "contract"
                                )}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                startIcon={<DownloadIcon />}
                                size="small"
                                onClick={() => downloadContractPDF(contract.id)}
                              >
                                Download PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No contracts found.
                  </Typography>
                )}
              </Box>
            </Paper>
          </TabPanel>

          {/* Invoices Tab */}
          <TabPanel value={tabValue} index={2}>
            <Paper elevation={1}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Your Invoices
                </Typography>
                {invoices.length > 0 ? (
                  <TableContainer>
                    <Table aria-label="invoices table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice #</TableCell>
                          <TableCell>Contract</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Issue Date</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>#{invoice.id}</TableCell>
                            <TableCell>#{invoice.contract}</TableCell>
                            <TableCell>${invoice.amount}</TableCell>
                            <TableCell>
                              {new Date(
                                invoice.issue_date
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatStatusText(invoice.status)}
                                color={getStatusChipColor(
                                  invoice.status,
                                  "invoice"
                                )}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                {invoice.status !== "paid" && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      navigateTo(`/make-payment/${invoice.id}`)
                                    }
                                  >
                                    Pay Now
                                  </Button>
                                )}
                                <IconButton
                                  color="primary"
                                  onClick={() => downloadInvoicePDF(invoice.id)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No invoices found.
                  </Typography>
                )}
              </Box>
            </Paper>
          </TabPanel>

          {/* Payments Tab */}
          <TabPanel value={tabValue} index={3}>
            <Paper elevation={1}>
              <Box p={3}>
                <Typography variant="h6" gutterBottom>
                  Your Payments
                </Typography>
                {payments.length > 0 ? (
                  <TableContainer>
                    <Table aria-label="payments table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Payment #</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>#{payment.id}</TableCell>
                            <TableCell>${payment.amount}</TableCell>
                            <TableCell>
                              {new Date(
                                payment.payment_date
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{payment.method_name}</TableCell>
                            <TableCell>
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  downloadPaymentReceipt(payment.id)
                                }
                              >
                                <DownloadIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No payments found.
                  </Typography>
                )}
              </Box>
            </Paper>
          </TabPanel>

          {/* Support Tickets Tab */}
          <TabPanel value={tabValue} index={4}>
            <Paper elevation={1}>
              <Box p={3}>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Your Support Tickets</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigateTo("/support/new")}
                  >
                    New Ticket
                  </Button>
                </Box>
                {tickets.length > 0 ? (
                  <TableContainer>
                    <Table aria-label="support tickets table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ticket #</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Last Updated</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell>#{ticket.id}</TableCell>
                            <TableCell>{ticket.subject}</TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(ticket.updated_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatStatusText(ticket.status)}
                                color={getStatusChipColor(
                                  ticket.status,
                                  "ticket"
                                )}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No support tickets found.
                  </Typography>
                )}
              </Box>
            </Paper>
          </TabPanel>

          {/* Connection Requests Tab */}
          <TabPanel value={tabValue} index={5}>
            <Paper elevation={1}>
              <Box p={3}>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Your Connection Requests</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigateTo("/connection-request")}
                  >
                    New Request
                  </Button>
                </Box>
                {requests.length > 0 ? (
                  <TableContainer>
                    <Table aria-label="connection requests table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Request #</TableCell>
                          <TableCell>Address</TableCell>
                          <TableCell>Tariff</TableCell>
                          <TableCell>Requested On</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {requests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>#{request.id}</TableCell>
                            <TableCell>
                              {request.address_details.region_name},{" "}
                              {request.address_details.city},{" "}
                              {request.address_details.street},{" "}
                              {request.address_details.building}/
                              {request.address_details.apartment || " "},
                            </TableCell>
                            <TableCell>{request.tariff_details.name}</TableCell>
                            <TableCell>
                              {new Date(
                                request.created_at
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatStatusText(request.status_name)}
                                color={getStatusChipColor(
                                  request.status,
                                  "request"
                                )}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() =>
                                  handleViewRequestDetail(request.id)
                                }
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">
                    No connection requests found.
                  </Typography>
                )}
              </Box>
            </Paper>
          </TabPanel>
        </Box>
      </Box>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Connection Request Details
          <IconButton
            aria-label="close"
            onClick={() => setDetailDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CancelIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailData ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">Request #{detailData.id}</Typography>
                <Chip
                  label={formatStatusText(detailData.status_name)}
                  color={getStatusChipColor(detailData.status, "request")}
                  sx={{ ml: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Address Information
                </Typography>
                <Typography variant="body1">
                  Region: {detailData.address_details.region_name}
                </Typography>
                <Typography variant="body1">
                  City: {detailData.address_details.city}
                </Typography>
                <Typography variant="body1">
                  Street: {detailData.address_details.street}
                </Typography>
                <Typography variant="body1">
                  Building: {detailData.address_details.building}
                </Typography>
                <Typography variant="body1">
                  Apartment: {detailData.address_details.apartment || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Connection Details
                </Typography>
                <Typography variant="body1">
                  Tariff: {detailData.tariff_details.name}
                </Typography>
                <Typography variant="body1">
                  Monthly Price: ${detailData.tariff_details.price}
                </Typography>
                <Typography variant="body1">
                  Created: {new Date(detailData.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  Last Updated:{" "}
                  {new Date(detailData.updated_at).toLocaleString()}
                </Typography>
              </Grid>

              {detailData.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Additional Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{detailData.notes}</Typography>
                  </Paper>
                </Grid>
              )}

              {detailData.status === "rejected" &&
                detailData.rejection_reason && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <AlertTitle>Rejection Reason</AlertTitle>
                      {detailData.rejection_reason}
                    </Alert>
                  </Grid>
                )}
            </Grid>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          {detailData && detailData.status === "new" && (
            <Button color="error" variant="outlined">
              Cancel Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboard;
