import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';

export default function CustomerForm({ open, onClose, onSubmit, newCustomer, handleInputChange, availableStatuses, error, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Customer</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField name="first_name" label="First Name" fullWidth required value={newCustomer.first_name} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="last_name" label="Last Name" fullWidth required value={newCustomer.last_name} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <TextField name="email" label="Email" type="email" fullWidth required value={newCustomer.email} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <TextField name="phone_number" label="Phone Number" fullWidth value={newCustomer.phone_number} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <TextField name="password" label="Password" type="password" fullWidth required value={newCustomer.password} onChange={handleInputChange} margin="normal" />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select name="status" value={newCustomer.status} onChange={handleInputChange} label="Status">
                {availableStatuses.map((status) => (
                  <MenuItem key={status.id} value={status.id}>{status.status}</MenuItem>
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
