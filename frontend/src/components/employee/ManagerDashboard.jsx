import React from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";
import TariffsTab from "./tabs/TariffsTab";
import ServicesTab from "./tabs/ServicesTab";
import CustomersTab from "./tabs/CustomersTab";
import InvoicesTab from "./tabs/InvoicesTab";
import ContractsTab from "./tabs/ContractsTab";
import ConnectionRequestsTab from "./tabs/ConnectionRequestsTab";
import SupportTicketsTab from "./tabs/SupportTicketsTab";
import { Container, Box, Typography, Tabs, Tab } from "@mui/material";
import { LogOut, Home } from "lucide-react";
import { Dashboard as DashboardIcon, AccountCircle as CustomerIcon, Receipt as InvoiceIcon, SupportAgent as SupportIcon, Warning as AlertIcon, TrendingUp as TrendingUpIcon, Description } from "@mui/icons-material";
import { useManagerDashboard } from "../../hooks/useManagerDashboard";
import ManagerOverviewTab from "../dashboard/ManagerOverviewTab";
import AdminReportsTab from "../dashboard/AdminReportsTab";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { ErrorMessage } from "../shared/ErrorMessage";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const hookState = useManagerDashboard(navigate);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const getColorForSegment = (index) => {
    const colors = ["#4CAF50", "#FFC107", "#F44336", "#2196F3"];
    return colors[index % colors.length];
  };

  const paymentStatusData = hookState.dashboardStats ? [
    { name: "Paid", value: hookState.dashboardStats.paid_invoices || 0 },
    { name: "Pending", value: hookState.dashboardStats.pending_invoices || 0 },
    { name: "Overdue", value: hookState.dashboardStats.overdue_invoices || 0 },
  ] : [];

  if (hookState.loading && !hookState.dashboardStats) {
    return <LoadingSpinner />;
  }

  if (hookState.error) {
    return <ErrorMessage message={hookState.error} />;
  }

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ overflowX: "auto", width: "100%", whiteSpace: "nowrap" }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Manager Dashboard
          </Typography>
          <Typography variant="h5">
            Welcome, {hookState.managerProfile.first_name} {hookState.managerProfile.last_name}
          </Typography>
        </Box>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/dashboard/manager")} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            <TrendingUpIcon className="h-4 w-4 mr-1" /> Analytics
          </button>
          <button onClick={() => navigate("/")} className="flex items-center text-gray-500 hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" /> Home
          </button>
          <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-gray-700">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </button>
        </div>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={hookState.tabValue} onChange={hookState.handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Customers" icon={<CustomerIcon />} iconPosition="start" />
          <Tab label="Invoices" icon={<InvoiceIcon />} iconPosition="start" />
          <Tab label="Support Tickets" icon={<SupportIcon />} iconPosition="start" />
          <Tab label="Connection Requests" icon={<AlertIcon />} iconPosition="start" />
          <Tab label="Contracts" icon={<Description />} iconPosition="start" />
          <Tab label="Reports" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {hookState.tabValue === 0 && <ManagerOverviewTab dashboardStats={hookState.dashboardStats} setTabValue={hookState.setTabValue} paymentStatusData={paymentStatusData} getColorForSegment={getColorForSegment} />}
      {hookState.tabValue === 1 && <CustomersTab />}
      {hookState.tabValue === 2 && <InvoicesTab />}
      {hookState.tabValue === 3 && <SupportTicketsTab />}
      {hookState.tabValue === 4 && <ConnectionRequestsTab />}
      {hookState.tabValue === 5 && <ContractsTab />}
      {hookState.tabValue === 6 && <AdminReportsTab financialSummary={hookState.financialSummary} performanceMetrics={hookState.performanceMetrics} />}
      {hookState.tabValue === 7 && <TariffsTab viewOnly={true} />}
      {hookState.tabValue === 8 && <ServicesTab viewOnly={true} />}
    </Container>
  );
};

export default ManagerDashboard;