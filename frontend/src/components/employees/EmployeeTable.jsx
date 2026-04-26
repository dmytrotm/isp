import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, CircularProgress, Box, Paper, Chip
} from '@mui/material';
import { Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function EmployeeTable({
  employees, loading, page, setPage, rowsPerPage, setRowsPerPage, totalEmployees,
  onView, onEdit, onDelete, detailLoading
}) {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "error";
      case "manager": return "primary";
      case "support": return "success";
      default: return "default";
    }
  };

  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <TableContainer>
        <Table aria-label="employees table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No employees found</TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>{employee.id}</TableCell>
                  <TableCell>{employee.user_details?.full_name}</TableCell>
                  <TableCell>{employee.user_details?.email}</TableCell>
                  <TableCell>
                    <Chip label={employee.role_name} color={getRoleColor(employee.role_name)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="View details">
                        <IconButton size="small" color="primary" onClick={() => onView(employee.id)} disabled={detailLoading}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit employee">
                        <IconButton size="small" color="secondary" onClick={() => onEdit(employee)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete employee">
                        <IconButton size="small" color="error" onClick={() => onDelete(employee)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalEmployees}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
