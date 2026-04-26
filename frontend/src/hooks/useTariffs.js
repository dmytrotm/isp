import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import api from '../services/api';

export function useTariffs(viewOnly = false) {
  const [tariffs, setTariffs] = useState([]);
  const [services, setServices] = useState([]);
  const [tariffStats, setTariffStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTariffs, setTotalTariffs] = useState(0);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const fileInputRef = useRef(null);

  const [openTariffDialog, setOpenTariffDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedTariff, setSelectedTariff] = useState(null);

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", is_active: true, services: [],
  });

  const { enqueueSnackbar } = useSnackbar();

  const fetchTariffs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/tariffs/?page=${page + 1}&page_size=${rowsPerPage}`, { headers: { Authorization: `Bearer ${token}` } });
      setTariffs(response.data.results || response.data);
      setTotalTariffs(response.data.count || (response.data.results ? response.data.results.length : response.data.length));
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load tariffs");
      setLoading(false);
      enqueueSnackbar("Failed to load tariffs", { variant: "error" });
    }
  }, [enqueueSnackbar, page, rowsPerPage]);

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/services/", { headers: { Authorization: `Bearer ${token}` } });
      setServices(response.data.results || response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load services", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const fetchTariffStatistics = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
      setTariffStats(response.data.data || response.data);
    } catch (err) {
      enqueueSnackbar("Failed to load tariff statistics", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTariffs();
    fetchServices();
    fetchTariffStatistics();
  }, [fetchTariffs, fetchServices, fetchTariffStatistics]);

  const handleExportTariffs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/tariffs/export_csv/", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tariffs.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar("Tariffs exported successfully", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to export tariffs", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImportTariffs = async () => {
    if (!csvFile) { enqueueSnackbar("Please select a CSV file to import", { variant: "warning" }); return; }
    try {
      setImporting(true); setImportError(null); setImportSuccess(null);
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("csv_file", csvFile);
      const response = await api.post("/tariffs/import_csv/", form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      setImportSuccess(`Successfully imported ${response.data.count} tariffs`);
      if (response.data.errors?.length > 0) setImportError(`There were ${response.data.errors.length} errors during import.`);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchTariffs(); fetchTariffStatistics();
      enqueueSnackbar("Tariffs imported successfully", { variant: "success" });
    } catch (err) {
      setImportError(err.response?.data?.message || err.message);
      enqueueSnackbar("Failed to import tariffs", { variant: "error" });
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (dialogMode === "create") {
        await api.post("/tariffs/", formData, { headers: { Authorization: `Bearer ${token}` } });
        enqueueSnackbar("Tariff created successfully", { variant: "success" });
      } else if (dialogMode === "edit") {
        await api.patch(`/tariffs/${selectedTariff.id}/`, formData, { headers: { Authorization: `Bearer ${token}` } });
        enqueueSnackbar("Tariff updated successfully", { variant: "success" });
      }
      fetchTariffs(); fetchTariffStatistics();
      setOpenTariffDialog(false);
    } catch (err) {
      enqueueSnackbar(`Failed to ${dialogMode === "create" ? "create" : "update"} tariff: ${err.response?.data?.error || err.message}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTariff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.delete(`/tariffs/${selectedTariff.id}/`, { headers: { Authorization: `Bearer ${token}` } });
      enqueueSnackbar("Tariff deleted successfully", { variant: "success" });
      fetchTariffs(); fetchTariffStatistics();
      setOpenDeleteDialog(false);
    } catch (err) {
      enqueueSnackbar(`Failed to delete tariff: ${err.response?.data?.error || err.message}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return {
    tariffs, services, tariffStats, loading, error, importing, importError, importSuccess, csvFile, setCsvFile, fileInputRef,
    openTariffDialog, setOpenTariffDialog, openDeleteDialog, setOpenDeleteDialog, openStatsDialog, setOpenStatsDialog,
    dialogMode, setDialogMode, selectedTariff, setSelectedTariff, formData, setFormData, viewOnly,
    page, setPage, rowsPerPage, setRowsPerPage, totalTariffs,
    handleExportTariffs, handleImportTariffs, handleSubmit, handleDeleteTariff
  };
}
