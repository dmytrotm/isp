import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import api from '../services/api';

export function useEmployees(globalSearch) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  const [availableRoles, setAvailableRoles] = useState([]);
  
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
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    api.get("/employee-roles/")
      .then(res => setAvailableRoles(res.data.results || res.data))
      .catch(err => console.error("Error fetching roles:", err));
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = { page: page + 1, page_size: rowsPerPage };
      
      if (searchValue) params.search = searchValue;

      const res = await api.get("/employees/", {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setEmployees(res.data.results || res.data);
      setTotalEmployees(res.data.count || res.data.length);
    } catch (err) {
      enqueueSnackbar("Failed to load employees", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchValue, enqueueSnackbar]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, globalSearch]);

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/employees/export_csv/", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employees.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar("Employees exported successfully", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to export employees", { variant: "error" });
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) return;
    try {
      setImportLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("csv_file", importFile);
      
      const res = await api.post("/employees/import_csv/", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      enqueueSnackbar(`Successfully imported ${res.data.count} employees`, { variant: "success" });
      fetchEmployees();
      setImportDialogOpen(false);
      setImportFile(null);
    } catch (err) {
      enqueueSnackbar("Failed to import employees", { variant: "error" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateEmployee = async (newEmployee) => {
    try {
      setCreateLoading(true);
      const token = localStorage.getItem("token");
      await api.post("/employees/", newEmployee, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCreateDialogOpen(false);
      enqueueSnackbar("Employee created successfully", { variant: "success" });
      fetchEmployees();
    } catch (err) {
      enqueueSnackbar("Failed to create employee", { variant: "error" });
      throw err;
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.delete(`/employees/${employeeToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const message = res.data?.message || "Employee deleted successfully";
      enqueueSnackbar(message, { variant: "success" });
      setDeleteDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      enqueueSnackbar("Failed to delete employee", { variant: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateEmployee = async (updateData) => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");
      await api.patch(`/employees/${employeeToEdit.id}/`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditDialogOpen(false);
      enqueueSnackbar("Employee updated successfully", { variant: "success" });
      fetchEmployees();
    } catch (err) {
      enqueueSnackbar("Failed to update employee", { variant: "error" });
      throw err;
    } finally {
      setEditLoading(false);
    }
  };

  const fetchEmployeeDetails = async (id, isEdit = false) => {
    try {
      const token = localStorage.getItem("token");
      if(isEdit) setEditLoading(true); else setDetailLoading(true);
      const res = await api.get(`/employees/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(isEdit) {
        const userData = res.data.user_details || {};
        setEmployeeToEdit({
          id,
          user_id: res.data.user,
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          role: res.data.role || "",
        });
        setEditDialogOpen(true);
      } else {
        setDetailData(res.data);
        setDetailDialogOpen(true);
      }
    } catch (err) {
      enqueueSnackbar("Failed to load employee details", { variant: "error" });
    } finally {
      setEditLoading(false);
      setDetailLoading(false);
    }
  };

  return {
    employees, loading, page, setPage, rowsPerPage, setRowsPerPage, totalEmployees,
    availableRoles,
    localSearch, setLocalSearch, searchValue, setSearchValue,
    fetchEmployees, handleExportCSV, handleImportCSV,
    importFile, setImportFile, importDialogOpen, setImportDialogOpen, importLoading,
    detailDialogOpen, setDetailDialogOpen, detailData, setDetailData, detailLoading, fetchEmployeeDetails,
    createDialogOpen, setCreateDialogOpen, createLoading, handleCreateEmployee,
    deleteDialogOpen, setDeleteDialogOpen, employeeToDelete, setEmployeeToDelete, deleteLoading, handleDeleteEmployee,
    editDialogOpen, setEditDialogOpen, employeeToEdit, setEmployeeToEdit, editLoading, handleUpdateEmployee
  };
}
