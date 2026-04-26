import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';

export default function EmployeeEditModal({ open, onClose, onSubmit, employeeToEdit, handleEditInputChange, availableRoles, error, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Employee</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {employeeToEdit && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField name="first_name" label="First Name" fullWidth required value={employeeToEdit.first_name} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="last_name" label="Last Name" fullWidth required value={employeeToEdit.last_name} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="email" label="Email" type="email" fullWidth required value={employeeToEdit.email} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select name="role" value={employeeToEdit.role} onChange={handleEditInputChange} label="Role">
                  {availableRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
