import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, CircularProgress, Box, Paper, Chip
} from '@mui/material';
import { Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { StatusBadge } from '../shared/StatusBadge';

export default function CustomerTable({
  customers, loading, page, setPage, rowsPerPage, setRowsPerPage, totalCustomers,
  onView, onEdit, onDelete, detailLoading
}) {
  return (
    <Paper sx={{ width: "100%", mb: 2 }}>
      <TableContainer>
        <Table aria-label="customers table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No customers found</TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.id}</TableCell>
                  <TableCell>{customer.user_details?.full_name}</TableCell>
                  <TableCell>{customer.user_details?.email}</TableCell>
                  <TableCell>{customer.phone_number}</TableCell>
                  <TableCell>
                    <StatusBadge status={customer.status_name?.toLowerCase()} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={customer.current_score} 
                      color={
                        customer.current_score >= 80 ? "success" : 
                        customer.current_score >= 50 ? "warning" : "error"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>₴{customer.balance}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="View details">
                        <IconButton size="small" color="primary" onClick={() => onView(customer.id)} disabled={detailLoading}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit customer">
                        <IconButton size="small" color="secondary" onClick={() => onEdit(customer)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete customer">
                        <IconButton size="small" color="error" onClick={() => onDelete(customer)}>
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
        count={totalCustomers}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
