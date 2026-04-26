import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';

export default function EmployeeForm({ open, onClose, onSubmit, newEmployee, handleInputChange, availableRoles, error, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Employee</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField name="first_name" label="First Name" fullWidth required value={newEmployee.first_name} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="last_name" label="Last Name" fullWidth required value={newEmployee.last_name} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <TextField name="email" label="Email" type="email" fullWidth required value={newEmployee.email} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <TextField name="password" label="Password" type="password" fullWidth required value={newEmployee.password} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select name="role" value={newEmployee.role} onChange={handleInputChange} label="Role">
                {availableRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} color="primary" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
