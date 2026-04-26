import { GetApp as GetAppIcon, Upload as UploadIcon } from '@mui/icons-material';
import React, { useState } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useEmployees } from '../../../hooks/useEmployees';
import EmployeeTable from '../../employees/EmployeeTable';
import EmployeeModal from '../../employees/EmployeeModal';
import EmployeeForm from '../../employees/EmployeeForm';
import EmployeeEditModal from '../../employees/EmployeeEditModal';
import EmployeeImportDialog from '../../employees/EmployeeImportDialog';
import { ConfirmDialog } from '../../shared/ConfirmDialog';

const EmployeesTab = ({ search: globalSearch }) => {
  const hookState = useEmployees(globalSearch);

  const [newEmployee, setNewEmployee] = useState({ first_name: '', last_name: '', email: '', password: '', role: '' });

  const handleCreateEmployeeSubmit = () => {
    hookState.handleCreateEmployee(newEmployee).then(() => {
        setNewEmployee({ first_name: '', last_name: '', email: '', password: '', role: '' });
    }).catch(()=>{});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
        <Typography variant="h5" component="h2">Employees</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" color="primary" startIcon={<GetAppIcon />} onClick={hookState.handleExportCSV}>Export CSV</Button>
          <Button variant="outlined" color="primary" startIcon={<UploadIcon />} onClick={() => hookState.setImportDialogOpen(true)}>Import CSV</Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => hookState.setCreateDialogOpen(true)}>Add Employee</Button>
        </Box>
      </Box>

      {/* Toolbar / Search */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
        <TextField label="Search Employees" variant="outlined" size="small" value={hookState.localSearch} onChange={(e) => hookState.setLocalSearch(e.target.value)} sx={{ flexGrow: 1 }} placeholder="Name or email" onKeyPress={(e) => e.key === "Enter" && hookState.setSearchValue(hookState.localSearch)} />
        <Button variant="contained" color="primary" onClick={() => { hookState.setSearchValue(hookState.localSearch); hookState.setPage(0); }} startIcon={<SearchIcon />}>Search</Button>
        {hookState.searchValue && <Button variant="outlined" onClick={() => { hookState.setLocalSearch(""); hookState.setSearchValue(""); hookState.setPage(0); hookState.fetchEmployees(); }}>Clear</Button>}
      </Box>

      <EmployeeTable {...hookState} onView={(id) => hookState.fetchEmployeeDetails(id)} onEdit={(e) => hookState.fetchEmployeeDetails(e.id, true)} onDelete={(e) => { hookState.setEmployeeToDelete(e); hookState.setDeleteDialogOpen(true); }} />

      <EmployeeModal open={hookState.detailDialogOpen} onClose={() => { hookState.setDetailDialogOpen(false); hookState.setDetailData(null); }} loading={hookState.detailLoading} detailData={hookState.detailData} />

      <EmployeeForm open={hookState.createDialogOpen} onClose={() => hookState.setCreateDialogOpen(false)} onSubmit={handleCreateEmployeeSubmit} newEmployee={newEmployee} handleInputChange={handleInputChange} availableRoles={hookState.availableRoles} error="" loading={hookState.createLoading} />

      <EmployeeEditModal open={hookState.editDialogOpen} onClose={() => { hookState.setEditDialogOpen(false); hookState.setEmployeeToEdit(null); }} onSubmit={() => hookState.handleUpdateEmployee(hookState.employeeToEdit)} employeeToEdit={hookState.employeeToEdit} handleEditInputChange={(e) => hookState.setEmployeeToEdit(p => ({ ...p, [e.target.name]: e.target.value }))} availableRoles={hookState.availableRoles} error="" loading={hookState.editLoading} />

      <ConfirmDialog open={hookState.deleteDialogOpen} title="Confirm Deletion" content={`Are you sure you want to delete this employee?`} onConfirm={hookState.handleDeleteEmployee} onCancel={() => { hookState.setDeleteDialogOpen(false); hookState.setEmployeeToDelete(null); }} confirmText="Delete" confirmColor="error" />

      <EmployeeImportDialog open={hookState.importDialogOpen} onClose={() => { hookState.setImportDialogOpen(false); hookState.setImportFile(null); }} onSubmit={hookState.handleImportCSV} file={hookState.importFile} setFile={hookState.setImportFile} error="" loading={hookState.importLoading} />
    </Box>
  );
};

export default EmployeesTab;