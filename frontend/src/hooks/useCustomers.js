import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import api from '../services/api';

export function useCustomers(globalSearch) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  
  const [localSearch, setLocalSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  
  const { enqueueSnackbar } = useSnackbar();

  // Dialog & Flow States
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    api.get("/statuses/", { params: { context_name: "Customer" } })
      .then(res => setAvailableStatuses(res.data.results || res.data))
      .catch(err => console.error("Error fetching statuses:", err));
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = { page: page + 1, page_size: rowsPerPage };
      
      if (searchValue) params.search = searchValue;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/customers/", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setCustomers(res.data.results || res.data);
      setTotalCustomers(res.data.count || res.data.length);
    } catch (err) {
      enqueueSnackbar("Failed to load customers", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchValue, statusFilter, enqueueSnackbar]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, globalSearch]);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/customers/export_csv/", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "customers.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar("Customers exported successfully", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to export customers", { variant: "error" });
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) return;
    try {
      setImportLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("csv_file", importFile);
      
      const res = await api.post("/customers/import_csv/", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      enqueueSnackbar(`Successfully imported ${res.data.count} customers`, { variant: "success" });
      fetchCustomers();
      setImportDialogOpen(false);
      setImportFile(null);
    } catch (err) {
      enqueueSnackbar("Failed to import customers", { variant: "error" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateCustomer = async (newCustomer) => {
    try {
      setCreateLoading(true);
      const token = localStorage.getItem("token");
      await api.post("/customers/", newCustomer, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCreateDialogOpen(false);
      enqueueSnackbar("Customer created successfully", { variant: "success" });
      fetchCustomers();
    } catch (err) {
      enqueueSnackbar("Failed to create customer", { variant: "error" });
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.delete(`/customers/${customerToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const message = res.data?.message || "Customer deleted successfully";
      enqueueSnackbar(message, { variant: "success" });
      setDeleteDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      enqueueSnackbar("Failed to delete customer", { variant: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateCustomer = async (updateData) => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");
      await api.patch(`/customers/${customerToEdit.id}/`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditDialogOpen(false);
      enqueueSnackbar("Customer updated successfully", { variant: "success" });
      fetchCustomers();
    } catch (err) {
      enqueueSnackbar("Failed to update customer", { variant: "error" });
      throw err;
    } finally {
      setEditLoading(false);
    }
  };

  const fetchCustomerDetails = async (id, isEdit = false) => {
    try {
      const token = localStorage.getItem("token");
      if(isEdit) setEditLoading(true); else setDetailLoading(true);
      const res = await api.get(`/customers/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(isEdit) {
        const userData = res.data.user_details || {};
        setCustomerToEdit({
          id,
          user_id: res.data.user,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          phone_number: res.data.phone_number || "",
          status: res.data.status,
          preferred_notification: res.data.preferred_notification || "email",
        });
        setEditDialogOpen(true);
      } else {
        setDetailData(res.data);
        setDetailDialogOpen(true);
      }
    } catch (err) {
      enqueueSnackbar("Failed to load customer details", { variant: "error" });
    } finally {
      setEditLoading(false);
      setDetailLoading(false);
    }
  };

  return {
    customers, loading, page, setPage, rowsPerPage, setRowsPerPage, totalCustomers,
    availableStatuses, statusFilter, setStatusFilter,
    localSearch, setLocalSearch, searchValue, setSearchValue,
    fetchCustomers, handleExportCSV, handleImportCSV,
    importFile, setImportFile, importDialogOpen, setImportDialogOpen, importLoading,
    detailDialogOpen, setDetailDialogOpen, detailData, setDetailData, detailLoading, fetchCustomerDetails,
    createDialogOpen, setCreateDialogOpen, createLoading, handleCreateCustomer,
    deleteDialogOpen, setDeleteDialogOpen, customerToDelete, setCustomerToDelete, deleteLoading, handleDeleteCustomer,
    editDialogOpen, setEditDialogOpen, customerToEdit, setCustomerToEdit, editLoading, handleUpdateCustomer
  };
}
