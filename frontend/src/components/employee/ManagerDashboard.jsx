import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import AuthService from "../../services/auth.service";

import TariffsTab from "./tabs/TariffsTab";
import ServicesTab from "./tabs/ServicesTab";
import CustomersTab from "./tabs/CustomersTab";
import InvoicesTab from "./tabs/InvoicesTab";
import ContractsTab from "./tabs/ContractsTab";
import ConnectionRequestsTab from "./tabs/ConnectionRequestsTab";
import SupportTicketsTab from "./tabs/SupportTicketsTab";

import { AttachMoney as TariffIcon } from "@mui/icons-material";
import ServiceIcon from "@mui/icons-material/MiscellaneousServices";

import {
  Container,
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
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { LogOut } from "lucide-react";
import {
  Dashboard as DashboardIcon,
  AccountCircle as CustomerIcon,
  Receipt as InvoiceIcon,
  SupportAgent as SupportIcon,
  Warning as AlertIcon,
  TrendingUp as TrendingUpIcon,
  Description,
} from "@mui/icons-material";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import api from "../../services/api";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

const ManagerDashboard = () => {
  const [managerProfile, setManagerProfile] = useState({});
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // States for different dashboard data
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalContracts, setTotalContracts] = useState(0);

  const navigate = useNavigate();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailType, setDetailType] = useState(""); // 'customer', 'invoice', etc.
  const [detailData, setDetailData] = useState(null);

  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [contractData, setContractData] = useState({});

  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch manager user data
      const managerResponse = await api.get("/auth/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Initialize manager profile
      if (managerResponse.data) {
        setManagerProfile({
          first_name: managerResponse.data.first_name,
          last_name: managerResponse.data.last_name,
          email: managerResponse.data.email,
        });
      }

      const statsResponse = await api.get(
        "/admin-dashboard/dashboard_stats/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDashboardStats(statsResponse.data);

      // Fetch additional data based on active tab with pagination
      if (tabValue === 0) {
        // Main dashboard - data already loaded
      } else if (tabValue === 1) {
        // Customers tab
        const customersResponse = await api.get(
          "/admin-dashboard/customers/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              page: page + 1, // API might use 1-based indexing
              page_size: rowsPerPage,
            },
          }
        );
        setCustomers(customersResponse.data.results || customersResponse.data);
        setTotalCustomers(
          customersResponse.data.count || customersResponse.data.length
        );
      } else if (tabValue === 2) {
        // Invoices tab
        const invoicesResponse = await api.get("/admin-dashboard/invoices/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1,
            page_size: rowsPerPage,
          },
        });
        setInvoices(invoicesResponse.data.results || invoicesResponse.data);
        setTotalInvoices(
          invoicesResponse.data.count || invoicesResponse.data.length
        );
      } else if (tabValue === 3) {
        // Support tickets tab
        const ticketsResponse = await api.get(
          "/admin-dashboard/support_tickets/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              page: page + 1,
              page_size: rowsPerPage,
            },
          }
        );
        setSupportTickets(ticketsResponse.data.results || ticketsResponse.data);
        setTotalTickets(
          ticketsResponse.data.count || ticketsResponse.data.length
        );
      } else if (tabValue === 4) {
        // Connection requests tab
        const requestsResponse = await api.get(
          "/admin-dashboard/connection_requests/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              page: page + 1,
              page_size: rowsPerPage,
            },
          }
        );
        setConnectionRequests(
          requestsResponse.data.results || requestsResponse.data
        );
        setTotalRequests(
          requestsResponse.data.count || requestsResponse.data.length
        );
      } else if (tabValue === 5) {
        // Contracts tab
        const contractsResponse = await api.get(
          "/admin-dashboard/contracts/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              page: page + 1,
              page_size: rowsPerPage,
            },
          }
        );
        setContracts(contractsResponse.data.results || contractsResponse.data);
        setTotalContracts(
          contractsResponse.data.count || contractsResponse.data.length
        );
      } else if (tabValue === 6) {
        // Financial overview tab
        const financialResponse = await api.get(
          "/admin-dashboard/financial_summary/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFinancialSummary(financialResponse.data);

        // Also fetch performance metrics for the reports tab
        const performanceResponse = await api.get(
          "/admin-dashboard/performance_metrics/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPerformanceMetrics(performanceResponse.data);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  const handleViewDetail = async (type, id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let endpoint = "";

      // Determine the endpoint based on type
      switch (type) {
        case "customer":
          endpoint = `/admin-dashboard/${id}/customer-details/`;
          break;
        case "invoice":
          endpoint = `/admin-dashboard/${id}/invoice-details/`;
          break;
        case "ticket":
          endpoint = `/admin-dashboard/${id}/support-ticket-details/`;
          break;
        case "request":
          endpoint = `/admin-dashboard/${id}/connection-request-details/`;
          break;
        case "contract":
          endpoint = `/admin-dashboard/${id}/contract-details/`;
          break;
        default:
          throw new Error("Unknown detail type");
      }

      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDetailData(response.data);
      setDetailType(type);
      setDetailDialogOpen(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || `Failed to load ${type} details`);
      setLoading(false);
    }
  };

  // Function to close the detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setDetailData(null);
  };

  // Handle page change for pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change for pagination
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tabValue, page, rowsPerPage]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  // Prepare chart data
  const [paymentStatusData, setPaymentStatusData] = useState([]);

  // Update this data when dashboardStats changes
  useEffect(() => {
    if (dashboardStats) {
      setPaymentStatusData([
        { name: "Paid", value: dashboardStats.paid_invoices || 0 },
        { name: "Pending", value: dashboardStats.pending_invoices || 0 },
        { name: "Overdue", value: dashboardStats.overdue_invoices || 0 },
      ]);
    }
  }, [dashboardStats]);

  const getColorForSegment = (index) => {
    const colors = ["#4CAF50", "#FFC107", "#F44336", "#2196F3"];
    return colors[index % colors.length];
  };

  if (loading && !dashboardStats) {
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
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Manager Dashboard
          </Typography>
          <Typography variant="h5">
            Welcome, {managerProfile.first_name} {managerProfile.last_name}
          </Typography>
        </Box>
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Customers" icon={<CustomerIcon />} iconPosition="start" />
          <Tab label="Invoices" icon={<InvoiceIcon />} iconPosition="start" />
          <Tab
            label="Support Tickets"
            icon={<SupportIcon />}
            iconPosition="start"
          />
          <Tab
            label="Connection Requests"
            icon={<AlertIcon />}
            iconPosition="start"
          />
          <Tab label="Contracts" icon={<Description />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {tabValue === 0 && dashboardStats && (
        <Grid container spacing={3}>
          {/* Stats Cards Row */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h3">
                  {dashboardStats.total_customers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Active Contracts
                </Typography>
                <Typography variant="h3">
                  {dashboardStats.active_contracts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Monthly Revenue
                </Typography>
                <Typography variant="h3">
                  ${dashboardStats.monthly_payments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts Row */}
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
            <Card>
              <CardHeader title="Support & Service Status" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Open Support Tickets
                    </Typography>
                    <Typography variant="h5">
                      {dashboardStats.open_tickets}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pending Invoices
                    </Typography>
                    <Typography variant="h5">
                      {dashboardStats.pending_invoices}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Overdue Invoices
                    </Typography>
                    <Typography variant="h5">
                      {dashboardStats.overdue_invoices}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities Lists */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title="Recent Support Tickets"
                action={
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => setTabValue(3)}
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
                        secondary={`${ticket.customer_details?.user_details?.first_name} ${ticket.customer_details?.user_details?.last_name} - ${ticket.status}`}
                      />
                    </ListItem>
                    {index < dashboardStats.latest_tickets.length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
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
                        secondary={`${request.address_details?.street}, ${request.address_details?.city} - ${request.status_name}`}
                      />
                    </ListItem>
                    {index < dashboardStats.recent_requests.length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && <CustomersTab />}

      {tabValue === 2 && <InvoicesTab />}

      {/* Support Tickets Tab */}
      {tabValue === 3 && <SupportTicketsTab />}

      {/* Connection Requests Tab */}
      {tabValue === 4 && <ConnectionRequestsTab />}

      {tabValue === 5 && <ContractsTab />}

      {/* Reports Tab */}
      {tabValue === 6 && financialSummary && performanceMetrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Financial Overview" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h5">
                      ${financialSummary.total_revenue}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Invoiced
                    </Typography>
                    <Typography variant="h5">
                      ${financialSummary.total_invoiced}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pending Amount
                    </Typography>
                    <Typography variant="h5">
                      ${financialSummary.pending_amount}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Overdue Amount
                    </Typography>
                    <Typography variant="h5">
                      ${financialSummary.overdue_amount}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Payment Collection Rate
                    </Typography>
                    <Typography variant="h5">
                      {financialSummary.payment_collection_rate.toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Performance Metrics" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Ticket Resolution Rate
                    </Typography>
                    <Typography variant="h5">
                      {performanceMetrics.ticket_resolution_rate.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {performanceMetrics.resolved_support_tickets} out of{" "}
                      {performanceMetrics.total_support_tickets}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader title="Performance Charts" />
              <CardContent>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Support Tickets",
                          Total: performanceMetrics.total_support_tickets,
                          Resolved: performanceMetrics.resolved_support_tickets,
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Total" fill="#8884d8" />
                      <Bar dataKey="Resolved" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 7 && <TariffsTab viewOnly={true} />}

      {tabValue === 8 && <ServicesTab viewOnly={true} />}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {detailType === "customer" && "Customer Details"}
          {detailType === "invoice" && "Invoice Details"}
          {detailType === "ticket" && "Support Ticket Details"}
          {detailType === "request" && "Connection Request Details"}
          {detailType === "contract" && "Contract Details"}
        </DialogTitle>
        <DialogContent>
          {detailData && (
            <Grid container spacing={2}>
              {/* Render different details based on the detail type */}
              {detailType === "customer" && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Name</Typography>
                    <Typography variant="body1">
                      {detailData.user_details?.first_name}{" "}
                      {detailData.user_details?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Email</Typography>
                    <Typography variant="body1">
                      {detailData.user_details?.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Phone</Typography>
                    <Typography variant="body1">
                      {detailData.phone_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Address</Typography>
                    <Typography variant="body1">
                      {detailData.address_details?.street},{" "}
                      {detailData.address_details?.city},{" "}
                      {detailData.address_details?.state}{" "}
                      {detailData.address_details?.postal_code}
                    </Typography>
                  </Grid>
                </>
              )}

              {detailType === "invoice" && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Invoice #</Typography>
                    <Typography variant="body1">
                      {detailData.invoice_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Customer</Typography>
                    <Typography variant="body1">
                      {detailData.customer_details?.user_details?.first_name}{" "}
                      {detailData.customer_details?.user_details?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Amount</Typography>
                    <Typography variant="body1">
                      ${detailData.total_amount}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Status</Typography>
                    <Typography variant="body1">{detailData.status}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Issue Date</Typography>
                    <Typography variant="body1">
                      {detailData.issue_date}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Due Date</Typography>
                    <Typography variant="body1">
                      {detailData.due_date}
                    </Typography>
                  </Grid>
                </>
              )}

              {detailType === "ticket" && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Subject</Typography>
                    <Typography variant="body1">
                      {detailData.subject}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Description</Typography>
                    <Typography variant="body1">
                      {detailData.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Customer</Typography>
                    <Typography variant="body1">
                      {detailData.customer_details?.user_details?.first_name}{" "}
                      {detailData.customer_details?.user_details?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Status</Typography>
                    <Typography variant="body1">{detailData.status}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Created</Typography>
                    <Typography variant="body1">
                      {detailData.created_at}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Assigned To</Typography>
                    <Typography variant="body1">
                      {detailData.assigned_to_details
                        ? `${detailData.assigned_to_details.first_name} ${detailData.assigned_to_details.last_name}`
                        : "Unassigned"}
                    </Typography>
                  </Grid>
                </>
              )}

              {detailType === "request" && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Customer</Typography>
                    <Typography variant="body1">
                      {detailData.customer_details?.user_details?.first_name}{" "}
                      {detailData.customer_details?.user_details?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Status</Typography>
                    <Typography variant="body1">
                      {detailData.status_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Address</Typography>
                    <Typography variant="body1">
                      {detailData.address_details?.street},{" "}
                      {detailData.address_details?.city},{" "}
                      {detailData.address_details?.state}{" "}
                      {detailData.address_details?.postal_code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Tariff</Typography>
                    <Typography variant="body1">
                      {detailData.tariff_details?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Created</Typography>
                    <Typography variant="body1">
                      {detailData.created_at}
                    </Typography>
                  </Grid>
                </>
              )}

              {detailType === "contract" && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Customer</Typography>
                    <Typography variant="body1">
                      {detailData.customer_details?.user_details?.first_name}{" "}
                      {detailData.customer_details?.user_details?.last_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Status</Typography>
                    <Typography variant="body1">{detailData.status}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Start Date</Typography>
                    <Typography variant="body1">
                      {detailData.start_date}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">End Date</Typography>
                    <Typography variant="body1">
                      {detailData.end_date}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Monthly Fee</Typography>
                    <Typography variant="body1">
                      ${detailData.monthly_fee}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Service Address</Typography>
                    <Typography variant="body1">
                      {detailData.address_details?.street},{" "}
                      {detailData.address_details?.city},{" "}
                      {detailData.address_details?.state}{" "}
                      {detailData.address_details?.postal_code}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Services</Typography>
                    <Typography variant="body1">
                      {detailData.services
                        ?.map((service) => service.name)
                        .join(", ") || "None"}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerDashboard;