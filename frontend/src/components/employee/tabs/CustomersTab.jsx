import { GetApp as GetAppIcon, Upload as UploadIcon } from '@mui/icons-material';
import React, { useState } from 'react';
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../hooks/useCustomers';
import CustomerTable from '../../customers/CustomerTable';
import CustomerModal from '../../customers/CustomerModal';
import CustomerForm from '../../customers/CustomerForm';
import CustomerEditModal from '../../customers/CustomerEditModal';
import CustomerImportDialog from '../../customers/CustomerImportDialog';
import { ConfirmDialog } from '../../shared/ConfirmDialog';

const CustomersTab = ({ search: globalSearch }) => {
  const { isAdmin } = useAuth();
  const hookState = useCustomers(globalSearch);

  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', email: '', phone_number: '', password: '', status: 4 });

  const handleCreateCustomerSubmit = () => {
    hookState.handleCreateCustomer(newCustomer).then(() => {
        setNewCustomer({ first_name: '', last_name: '', email: '', phone_number: '', password: '', status: 4 });
    }).catch(()=>{});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
        <Typography variant="h5" component="h2">Customers</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {isAdmin && (
            <>
              <Button variant="outlined" color="primary" startIcon={<GetAppIcon />} onClick={hookState.handleExportCSV}>Export CSV</Button>
              <Button variant="outlined" color="primary" startIcon={<UploadIcon />} onClick={() => hookState.setImportDialogOpen(true)}>Import CSV</Button>
            </>
          )}
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => hookState.setCreateDialogOpen(true)}>Add Customer</Button>
        </Box>
      </Box>

      {/* Toolbar / Search */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <TextField label="Search Customers" variant="outlined" size="small" value={hookState.localSearch} onChange={(e) => hookState.setLocalSearch(e.target.value)} sx={{ flexGrow: 1 }} placeholder="Name, email or phone" onKeyPress={(e) => e.key === "Enter" && hookState.setSearchValue(hookState.localSearch)} />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select value={hookState.statusFilter} onChange={(e) => {hookState.setStatusFilter(e.target.value); hookState.setPage(0);}} label="Filter by Status">
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                {hookState.availableStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>{status.status}</MenuItem>
                ))}
            </Select>
        </FormControl>

        {(hookState.statusFilter || hookState.searchValue) && <Button variant="outlined" onClick={() => { hookState.setStatusFilter(""); hookState.setLocalSearch(""); hookState.setSearchValue(""); hookState.setPage(0); hookState.fetchCustomers(); }}>Clear All Filters</Button>}

        <Button variant="contained" color="primary" onClick={() => { hookState.setSearchValue(hookState.localSearch); hookState.setPage(0); }} startIcon={<SearchIcon />}>Search</Button>
        {hookState.searchValue && <Button variant="outlined" onClick={() => { hookState.setLocalSearch(""); hookState.setSearchValue(""); hookState.setPage(0); hookState.fetchCustomers(); }}>Clear</Button>}
      </Box>

      <CustomerTable {...hookState} onView={(id) => hookState.fetchCustomerDetails(id)} onEdit={(c) => hookState.fetchCustomerDetails(c.id, true)} onDelete={(c) => { hookState.setCustomerToDelete(c); hookState.setDeleteDialogOpen(true); }} />

      <CustomerModal open={hookState.detailDialogOpen} onClose={() => { hookState.setDetailDialogOpen(false); hookState.setDetailData(null); }} loading={hookState.detailLoading} detailData={hookState.detailData} />

      <CustomerForm open={hookState.createDialogOpen} onClose={() => hookState.setCreateDialogOpen(false)} onSubmit={handleCreateCustomerSubmit} newCustomer={newCustomer} handleInputChange={handleInputChange} availableStatuses={hookState.availableStatuses} error="" loading={hookState.createLoading} />

      <CustomerEditModal open={hookState.editDialogOpen} onClose={() => { hookState.setEditDialogOpen(false); hookState.setCustomerToEdit(null); }} onSubmit={() => hookState.handleUpdateCustomer(hookState.customerToEdit)} customerToEdit={hookState.customerToEdit} handleEditInputChange={(e) => hookState.setCustomerToEdit(p => ({ ...p, [e.target.name]: e.target.value }))} availableStatuses={hookState.availableStatuses} error="" loading={hookState.editLoading} />

      <ConfirmDialog open={hookState.deleteDialogOpen} title="Confirm Deletion" content={`Are you sure you want to delete this customer?`} onConfirm={hookState.handleDeleteCustomer} onCancel={() => { hookState.setDeleteDialogOpen(false); hookState.setCustomerToDelete(null); }} confirmText="Delete" confirmColor="error" />

      <CustomerImportDialog open={hookState.importDialogOpen} onClose={() => { hookState.setImportDialogOpen(false); hookState.setImportFile(null); }} onSubmit={hookState.handleImportCSV} file={hookState.importFile} setFile={hookState.setImportFile} error="" loading={hookState.importLoading} />
    </Box>
  );
};
export default CustomersTab;
