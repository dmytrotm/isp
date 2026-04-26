import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import api from '../services/api';

export function useAdminDashboard(navigate) {
  const [adminProfile, setAdminProfile] = useState({});
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Tab Data states
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

  // Detail Modal States
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailType, setDetailType] = useState(""); 
  const [detailData, setDetailData] = useState(null);

  // Ticket Modal States
  const [modifyTicketOpen, setModifyTicketOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");

  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [contractData, setContractData] = useState({});
  const [equipmentOptions, setEquipmentOptions] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (modifyTicketOpen) {
      api.get("/statuses/", { params: { context_name: "SupportTicket" } })
         .then((res) => setAvailableStatuses(res.data.results || res.data))
         .catch((err) => console.error(err));
         
      const token = localStorage.getItem("token");
      api.get("/employees/", {
        params: { role_name: "technician" },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAvailableTechnicians(res.data.results || []))
      .catch((err) => console.error(err));
    }
  }, [modifyTicketOpen]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    api.get("/equipment/", { headers: { Authorization: `Bearer ${token}` } })
       .then((res) => setEquipmentOptions(res.data.results || res.data))
       .catch((err) => console.error(err));
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const adminResponse = await api.get("/auth/user/", { headers: { Authorization: `Bearer ${token}` } });
      if (adminResponse.data) {
        setAdminProfile({
          first_name: adminResponse.data.first_name,
          last_name: adminResponse.data.last_name,
          email: adminResponse.data.email,
        });
      }

      const statsResponse = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
      setDashboardStats(statsResponse.data.data || statsResponse.data);

      const params = { page: page + 1, page_size: rowsPerPage };
      const config = { headers: { Authorization: `Bearer ${token}` }, params };

      if (tabValue === 1) {
        const res = await api.get("/customers/", config);
        setCustomers(res.data.results || res.data);
        setTotalCustomers(res.data.count || res.data.length);
      } else if (tabValue === 2) {
        const res = await api.get("/employees/", config);
        setEmployees(res.data.results || res.data);
        setTotalEmployees(res.data.count || res.data.length);
      } else if (tabValue === 3) {
        const res = await api.get("/invoices/", config);
        setInvoices(res.data.results || res.data);
        setTotalInvoices(res.data.count || res.data.length);
      } else if (tabValue === 4) {
        const res = await api.get("/support-tickets/", config);
        setSupportTickets(res.data.results || res.data);
        setTotalTickets(res.data.count || res.data.length);
      } else if (tabValue === 5) {
        const res = await api.get("/connection-requests/", config);
        setConnectionRequests(res.data.results || res.data);
        setTotalRequests(res.data.count || res.data.length);
      } else if (tabValue === 6) {
        const res = await api.get("/contracts/", config);
        setContracts(res.data.results || res.data);
        setTotalContracts(res.data.count || res.data.length);
      } else if (tabValue === 7) {
        // Financial summary not defined on backend, let's just use dashboard/manager/
        const fRes = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
        setFinancialSummary(fRes.data);
        const pRes = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
        setPerformanceMetrics(pRes.data);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      setLoading(false);
    }
  }, [tabValue, page, rowsPerPage]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleUpdateTicket = async () => {
    const updateData = {};
    if (selectedStatus) updateData.status = selectedStatus;
    if (selectedTechnician) updateData.assigned_to = selectedTechnician;

    try {
      await api.patch(`/support-tickets/${detailData.id}/`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setModifyTicketOpen(false);
      setDetailDialogOpen(false);
      setDetailData(null);
    } catch (error) {
      alert("Failed to update ticket. Please try again.");
    }
  };

  const terminateContract = async (contractId) => {
    try {
      await api.patch(`/contracts/${contractId}/`, { is_active: false }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Contract terminated successfully");
      setDetailData({ ...detailData });
    } catch (error) {
      alert("Failed to terminate contract. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to decline this connection request?")) {
      try {
        setLoading(true);
        // Assuming we update the status ID to a generic rejected status, e.g., status 3
        await api.patch(`/connection-requests/${requestId}/`, { status: 3 });
        const response = await api.get(`/connection-requests/${requestId}/`);
        setDetailData(response.data);
        enqueueSnackbar("Request rejected successfully", { variant: "success" });
      } catch (error) {
        enqueueSnackbar("Failed to reject request: " + (error.response?.data?.error || error.message), { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApproveRequest = (requestId) => {
    if (window.confirm("Are you sure you want to approve this connection request?")) {
      setContractData({
        connection_request: requestId,
        customer: detailData.customer,
        address: detailData.address,
        tariff: detailData.tariff,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        equipment: [],
      });
      setOpenContractDialog(true);
    }
  };

  const handleCreateContract = async () => {
    try {
      setLoading(true);
      // create contract directly
      await api.post(`/contracts/`, contractData);
      const response = await api.get(`/connection-requests/${contractData.connection_request}/`);
      setDetailData(response.data);
      setOpenContractDialog(false);
      enqueueSnackbar("Contract created successfully", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to create contract: " + (error.response?.data?.error || error.message), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (type, id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let endpoint = "";
      switch (type) {
        case "customer": endpoint = `/customers/${id}/`; break;
        case "employee": endpoint = `/employees/${id}/`; break;
        case "invoice": endpoint = `/invoices/${id}/`; break;
        case "ticket": endpoint = `/support-tickets/${id}/`; break;
        case "request": endpoint = `/connection-requests/${id}/`; break;
        case "contract": endpoint = `/contracts/${id}/`; break;
        case "tariff": endpoint = `/tariffs/${id}/`; break;
        default: throw new Error("Unknown detail type");
      }
      const response = await api.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setDetailData(response.data);
      setDetailType(type);
      setDetailDialogOpen(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || `Failed to load ${type} details`);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  return {
    adminProfile, dashboardStats, loading, error, tabValue, handleTabChange,
    page, setPage, rowsPerPage, setRowsPerPage,
    totalCustomers, totalEmployees, totalInvoices, totalTickets, totalRequests, totalContracts,
    fetchDashboardData, handleUpdateTicket, terminateContract, handleRejectRequest, handleApproveRequest, handleCreateContract, handleViewDetail,
    detailDialogOpen, setDetailDialogOpen, detailType, setDetailType, detailData, setDetailData,
    modifyTicketOpen, setModifyTicketOpen, availableStatuses, availableTechnicians, selectedStatus, setSelectedStatus, selectedTechnician, setSelectedTechnician,
    openContractDialog, setOpenContractDialog, contractData, setContractData, equipmentOptions, setEquipmentOptions,
    customers, employees, invoices, supportTickets, contracts, connectionRequests, financialSummary, performanceMetrics
  };
}
