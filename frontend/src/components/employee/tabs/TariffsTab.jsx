import React from "react";
import { Box, Typography, Button, Alert, CircularProgress } from "@mui/material";
import { Add as AddIcon, TrendingUp as TrendingUpIcon } from "@mui/icons-material";
import { CloudUpload as UploadIcon, CloudDownload as DownloadIcon } from "@mui/icons-material";
import { useTariffs } from "../../../hooks/useTariffs";
import TariffTable from "../../tariffs/TariffTable";
import TariffDialog from "../../tariffs/TariffDialog";
import TariffStatsDialog from "../../tariffs/TariffStatsDialog";
import { ConfirmDialog } from "../../shared/ConfirmDialog";

const TariffsTab = ({ viewOnly = false }) => {
  const hookState = useTariffs(viewOnly);

  const handleOpenDialog = (mode, tariff = null) => {
    hookState.setDialogMode(mode);
    if (tariff) {
      hookState.setSelectedTariff(tariff);
      const serviceIds = tariff.services?.map((service) => service.id) || [];
      hookState.setFormData({
        name: tariff.name,
        description: tariff.description || "",
        price: tariff.price,
        is_active: tariff.is_active,
        services: serviceIds,
      });
    } else {
      hookState.setSelectedTariff(null);
      hookState.setFormData({ name: "", description: "", price: "", is_active: true, services: [] });
    }
    hookState.setOpenTariffDialog(true);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "is_active") {
      hookState.setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "price") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        hookState.setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      hookState.setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceChange = (serviceId) => {
    hookState.setFormData((prev) => {
      const currentServices = [...prev.services];
      const serviceIndex = currentServices.indexOf(serviceId);
      if (serviceIndex === -1) currentServices.push(serviceId);
      else currentServices.splice(serviceIndex, 1);
      return { ...prev, services: currentServices };
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ overflowX: "auto", width: "100%", whiteSpace: "nowrap" }}>
        <Typography variant="h5" component="h2">Tariff Management</Typography>
        <Box display="flex" justifyContent="flex-end" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
          {!viewOnly && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog("create")}>Add Tariff</Button>
          )}
          <Button variant="outlined" color="success" startIcon={<DownloadIcon />} onClick={hookState.handleExportTariffs}>Export</Button>
          {!viewOnly && (
            <>
              <Button variant="outlined" color="secondary" startIcon={<UploadIcon />} onClick={() => hookState.fileInputRef.current.click()}>Import</Button>
              <input type="file" ref={hookState.fileInputRef} onChange={(e) => hookState.setCsvFile(e.target.files[0])} accept=".csv" style={{ display: "none" }} />
            </>
          )}
          <Button variant="outlined" color="info" startIcon={<TrendingUpIcon />} onClick={() => hookState.setOpenStatsDialog(true)}>Statistics</Button>
        </Box>
      </Box>

      {hookState.csvFile && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" sx={{ mr: 2 }}>Selected file: {hookState.csvFile.name}</Typography>
          <Button variant="contained" color="primary" size="small" onClick={hookState.handleImportTariffs} disabled={hookState.importing}>
            {hookState.importing ? <CircularProgress size={24} /> : "Import Now"}
          </Button>
        </Box>
      )}

      {hookState.importSuccess && <Alert severity="success" sx={{ mb: 2 }}>{hookState.importSuccess}</Alert>}
      {hookState.importError && <Alert severity="warning" sx={{ mb: 2 }}>{hookState.importError}</Alert>}
      {hookState.error && <Alert severity="error" sx={{ mb: 2 }}>{hookState.error}</Alert>}

      <TariffTable 
        tariffs={hookState.tariffs} 
        loading={hookState.loading} 
        viewOnly={viewOnly} 
        onOpenDialog={handleOpenDialog} 
        onOpenDeleteDialog={(tariff) => { hookState.setSelectedTariff(tariff); hookState.setOpenDeleteDialog(true); }}
        page={hookState.page}
        setPage={hookState.setPage}
        rowsPerPage={hookState.rowsPerPage}
        setRowsPerPage={hookState.setRowsPerPage}
        totalTariffs={hookState.totalTariffs}
      />

      <TariffDialog open={hookState.openTariffDialog} onClose={() => { hookState.setOpenTariffDialog(false); hookState.setSelectedTariff(null); }} mode={hookState.dialogMode} formData={hookState.formData} handleInputChange={handleInputChange} handleServiceChange={handleServiceChange} services={hookState.services} onSubmit={hookState.handleSubmit} />

      <ConfirmDialog open={hookState.openDeleteDialog} title="Confirm Delete" content={`Are you sure you want to delete the tariff "${hookState.selectedTariff?.name}"? This action cannot be undone.`} onCancel={() => { hookState.setOpenDeleteDialog(false); hookState.setSelectedTariff(null); }} onConfirm={hookState.handleDeleteTariff} confirmText="Delete" confirmColor="error" />

      <TariffStatsDialog open={hookState.openStatsDialog} onClose={() => hookState.setOpenStatsDialog(false)} stats={hookState.tariffStats} />
    </Box>
  );
};
export default TariffsTab;
