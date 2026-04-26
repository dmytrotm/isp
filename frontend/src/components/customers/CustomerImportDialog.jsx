import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography, Alert } from '@mui/material';

export default function CustomerImportDialog({ open, onClose, onSubmit, file, setFile, error, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Customers from CSV</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" paragraph>
          Please upload a CSV file with the following columns: first_name, last_name, email, password, phone_number, status.
        </Typography>
        <Button variant="contained" component="label" fullWidth sx={{ mb: 2 }}>
          Select CSV File
          <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files[0])} />
        </Button>
        {file && <Typography variant="body2" color="primary">Selected file: {file.name}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} color="primary" variant="contained" disabled={loading || !file}>
          {loading ? <CircularProgress size={24} /> : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
