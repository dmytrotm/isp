import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import AuthService from "../../services/auth.service";

import TariffsTab from "./tabs/TariffsTab";
import ServicesTab from "./tabs/ServicesTab";
import EquipmentTab from "./tabs/EquipmentTab";
import CustomersTab from "./tabs/CustomersTab";
import EmployeesTab from "./tabs/EmployeesTab";
import InvoicesTab from "./tabs/InvoicesTab";
import ContractsTab from "./tabs/ContractsTab";
import ConnectionRequestsTab from "./tabs/ConnectionRequestsTab";
import InternetUsageTab from "./tabs/InternetUsageTab";

import { AttachMoney as TariffIcon } from "@mui/icons-material";
import ServiceIcon from "@mui/icons-material/MiscellaneousServices";
import EquipmentIcon from "@mui/icons-material/Construction";

import SupportTicketsTab from "./tabs/SupportTicketsTab";

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Chip,
  Avatar,
  TablePagination,
} from "@mui/material";
import { LogOut } from "lucide-react";
import {
  Dashboard as DashboardIcon,
  AccountCircle as CustomerIcon,
  People as EmployeeIcon,
  Receipt as InvoiceIcon,
  SupportAgent as SupportIcon,
  Warning as AlertIcon,
  TrendingUp as TrendingUpIcon,
  Description,
} from "@mui/icons-material";
import TextField from "@mui/material/TextField";
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

import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";

const AdminDashboard = () => {
  const [adminProfile, setAdminProfile] = useState({});
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // States for different dashboard data
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
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
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalContracts, setTotalContracts] = useState(0);

  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailType, setDetailType] = useState(""); // 'customer', 'invoice', etc.
  const [detailData, setDetailData] = useState(null);

  const [modifyTicketOpen, setModifyTicketOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");

  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [contractData, setContractData] = useState({});
  const [equipmentOptions, setEquipmentOptions] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  // Add useEffect to fetch statuses and technicians when the modal opens
  useEffect(() => {
    if (modifyTicketOpen) {
      // Fetch available statuses for support tickets - no bearer token needed
      api
        .get("/statuses/", {
          params: { context_name: "SupportTicket" },
        })
        .then((response) => {
          // Check if response is paginated
          setAvailableStatuses(response.data.results || response.data);
        })
        .catch((error) => console.error("Error fetching statuses:", error));

      // Fetch available technicians - with bearer token and correct endpoint
      api
        .get("/admin-dashboard/employees/", {
          params: { role_name: "technician" },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
          setAvailableTechnicians(response.data.results || []);
        })
        .catch((error) => console.error("Error fetching technicians:", error));
    }
  }, [modifyTicketOpen]);

  useEffect(() => {
    api
      .get("/equipment/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        const equipmentArray = Object.values(response.data || {});
        setEquipmentOptions(equipmentArray);
      })
      .catch((error) => console.error("Error fetching equipment:", error));
  }, []);

  const handleUpdateTicket = (requestId) => {
    const updateData = {};

    if (selectedStatus) {
      updateData.status = selectedStatus;
    }

    if (selectedTechnician) {
      updateData.assigned_to = selectedTechnician;
    }

    api
      .put(`/admin-dashboard/${detailData.id}/update_ticket/`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        // Handle success, maybe refresh data
        setModifyTicketOpen(false);
        // If you have a function to refresh ticket data, call it here
        handleCloseDetail();
      })
      .catch((error) => {
        console.error("Error updating ticket:", error);
        alert("Failed to update ticket. Please try again.");
      });
  };

  const terminateContract = (contractId) => {
    api
      .patch(
        `/admin-dashboard/${contractId}/terminate-contract/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      .then(() => {
        // Show success message
        alert("Contract terminated successfully");
        // Update UI or refresh data
        setDetailData({ ...detailData });
        // Optionally close the dialog
        // handleClose();
      })
      .catch((error) => {
        console.error("Error terminating a contract:", error);
        alert("Failed to terminate contract. Please try again.");
      });
  };

  // Handle reject request
  const handleRejectRequest = async (requestId) => {
    if (
      window.confirm(
        "Are you sure you want to decline this connection request?"
      )
    )
      try {
        setLoading(true);

        // Call reject endpoint
        await api.post(`/admin-dashboard/${requestId}/decline/`);

        // Refresh the request data
        const response = await api.get(
          `/admin-dashboard/${requestId}/connection-request-details/`
        );
        setDetailData(response.data);

        enqueueSnackbar("Request rejected successfully", {
          variant: "success",
        });
      } catch (error) {
        console.error("Error rejecting request:", error);
        enqueueSnackbar(
          "Failed to reject request: " +
            (error.response?.data?.error || error.message),
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
  };

  // Handle approve request - open contract form dialog
  const handleApproveRequest = (requestId) => {
    if (
      window.confirm(
        "Are you sure you want to approve this connection request?"
      )
    ) {
      // Initialize contract data with connection request info
      setContractData({
        connection_request: requestId,
        customer: detailData.customer,
        address: detailData.address,
        tariff: detailData.tariff,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        equipment: [],
      });

      // Open the dialog
      setOpenContractDialog(true);
    }
  };

  // Handle close contract dialog
  const handleCloseContractDialog = () => {
    setOpenContractDialog(false);
  };

  const handleCreateContract = async () => {
    try {
      setLoading(true);

      // Call approve endpoint which creates contract
      await api.post(
        `/admin-dashboard/${contractData.connection_request}/approve/`,
        contractData
      );
      console.log(contractData);

      // Refresh the request data
      const response = await api.get(
        `/admin-dashboard/${contractData.connection_request}/connection-request-details/`
      );
      setDetailData(response.data);

      // Close the dialog
      setOpenContractDialog(false);

      enqueueSnackbar("Contract created successfully", { variant: "success" });
    } catch (error) {
      console.error("Error creating contract:", error);
      enqueueSnackbar(
        "Failed to create contract: " +
          (error.response?.data?.error || error.message),
        {
          variant: "error",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch admin user data
      const adminResponse = await api.get("/auth/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Initialize admin profile
      if (adminResponse.data) {
        setAdminProfile({
          first_name: adminResponse.data.first_name,
          last_name: adminResponse.data.last_name,
          email: adminResponse.data.email,
        });
      }

      // Fetch dashboard statistics
      const statsResponse = await api.get("/admin-dashboard/dashboard_stats/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboardStats(statsResponse.data);

      // Fetch additional data based on active tab with pagination
      if (tabValue === 0) {
        // Main dashboard - data already loaded
      } else if (tabValue === 1) {
        // Customers tab
        const customersResponse = await api.get("/admin-dashboard/customers/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1, // API might use 1-based indexing
            page_size: rowsPerPage,
          },
        });
        setCustomers(customersResponse.data.results || customersResponse.data);
        setTotalCustomers(
          customersResponse.data.count || customersResponse.data.length
        );
      } else if (tabValue === 2) {
        // Employees tab
        const employeesResponse = await api.get("/admin-dashboard/employees/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1, // API might use 1-based indexing
            page_size: rowsPerPage,
          },
        });
        setEmployees(employeesResponse.data.results || employeesResponse.data);
        setTotalEmployees(
          employeesResponse.data.count || employeesResponse.data.length
        );
      } else if (tabValue === 3) {
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
      } else if (tabValue === 4) {
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
      } else if (tabValue === 5) {
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
      } else if (tabValue === 6) {
        // Contracts tab
        const requestsResponse = await api.get("/admin-dashboard/contracts/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1,
            page_size: rowsPerPage,
          },
        });
        setContracts(requestsResponse.data.results || requestsResponse.data);
        setTotalContracts(
          requestsResponse.data.count || requestsResponse.data.length
        );
      } else if (tabValue === 7) {
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
        case "employee":
          endpoint = `/admin-dashboard/${id}/employee-details/`;
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
          endpoint = `admin-dashboard/${id}/contract-details/`;
          break;
        case "tariff":
          endpoint = `admin-dashboard/${id}/contract-details/`;
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

  // Add this function to close the detail dialog
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

  // Get the appropriate total count based on current tab
  const getCurrentTotal = () => {
    switch (tabValue) {
      case 1:
        return totalCustomers;
      case 2:
        return totalEmployees;
      case 3:
        return totalInvoices;
      case 4:
        return totalTickets;
      case 5:
        return totalRequests;
      case 6:
        return totalContracts;
      default:
        return 0;
    }
  };

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
            Admin Dashboard
          </Typography>
          <Typography variant="h5">
            Welcome, {adminProfile.first_name} {adminProfile.last_name}
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
          <Tab label="Employees" icon={<EmployeeIcon />} iconPosition="start" />
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
          <Tab label="Reports" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab
            label="Internet Usage"
            icon={<NetworkCheckIcon />}
            iconPosition="start"
          />
          <Tab label="Tariffs" icon={<TariffIcon />} iconPosition="start" />
          <Tab label="Services" icon={<ServiceIcon />} iconPosition="start" />
          <Tab
            label="Equipment"
            icon={<EquipmentIcon />}
            iconPosition="start"
          />
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
                  Total Employees
                </Typography>
                <Typography variant="h3">
                  {dashboardStats.total_employees}
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
                    onClick={() => setTabValue(5)}
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
      {tabValue === 2 && <EmployeesTab />}
      {tabValue === 3 && <InvoicesTab />}
      {/* Support Tickets Tab */}
      {tabValue === 4 && <SupportTicketsTab />}
      {/* Connection Requests Tab */}
      {tabValue === 5 && <ConnectionRequestsTab />}
      {tabValue === 6 && <ContractsTab />}
      {/* Reports Tab */}
      {tabValue === 7 && financialSummary && performanceMetrics && (
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
                      <Bar dataKey="Completed" fill="#82ca9d" />
                      <Bar dataKey="Resolved" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      {tabValue === 8 && <InternetUsageTab />}
      {tabValue === 9 && <TariffsTab />}
      {tabValue === 10 && <ServicesTab />}
      {tabValue === 11 && <EquipmentTab />}
    </Container>
  );
};

export default AdminDashboard;
