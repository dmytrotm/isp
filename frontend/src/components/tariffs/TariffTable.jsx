import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, Chip, IconButton, Box, CircularProgress } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';

export default function TariffTable({ tariffs, loading, viewOnly, onOpenDialog, onOpenDeleteDialog, page, setPage, rowsPerPage, setRowsPerPage, totalTariffs }) {
  if (loading && tariffs.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ overflowX: "auto", width: "100%" }}>
      <TableContainer component={Paper}>
        <Table aria-label="tariffs table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tariffs.map((tariff) => (
              <TableRow key={tariff.id}>
                <TableCell>{tariff.id}</TableCell>
                <TableCell>{tariff.name}</TableCell>
                <TableCell>{tariff.description || "N/A"}</TableCell>
                <TableCell>₴{parseFloat(tariff.price || 0).toFixed(2)}</TableCell>
                <TableCell><Chip label={tariff.is_active ? "Active" : "Inactive"} color={tariff.is_active ? "success" : "default"} /></TableCell>
                <TableCell>{tariff.services?.length || 0} service(s)</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => onOpenDialog("view", tariff)}><ViewIcon /></IconButton>
                  {!viewOnly && <IconButton size="small" color="info" onClick={() => onOpenDialog("edit", tariff)}><EditIcon /></IconButton>}
                  {!viewOnly && <IconButton size="small" color="error" onClick={() => onOpenDeleteDialog(tariff)}><DeleteIcon /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
            {tariffs.length === 0 && <TableRow><TableCell colSpan={7} align="center">No tariffs found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalTariffs}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
}
