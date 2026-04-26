import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';

export default function CustomerEditModal({ open, onClose, onSubmit, customerToEdit, handleEditInputChange, availableStatuses, error, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Customer</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {customerToEdit && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField name="first_name" label="First Name" fullWidth required value={customerToEdit.first_name} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="last_name" label="Last Name" fullWidth required value={customerToEdit.last_name} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="email" label="Email" type="email" fullWidth required value={customerToEdit.email} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="phone_number" label="Phone Number" fullWidth value={customerToEdit.phone_number} onChange={handleEditInputChange} margin="normal" />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select name="status" value={customerToEdit.status} onChange={handleEditInputChange} label="Status">
                  {availableStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>{status.status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Preferred Notification</InputLabel>
                <Select name="preferred_notification" value={customerToEdit.preferred_notification} onChange={handleEditInputChange} label="Preferred Notification">
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
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
