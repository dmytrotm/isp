import { Upload as UploadIcon } from '@mui/icons-material';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography, Alert } from '@mui/material';

export default function EmployeeImportDialog({ open, onClose, onSubmit, file, setFile, error, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Employees from CSV</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" gutterBottom>
          Upload a CSV file with employee data to bulk import. The file should
          follow the required format.
        </Typography>
        <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ mt: 2 }} fullWidth>
          Select CSV File
          <input type="file" accept=".csv" hidden onChange={(e) => setFile(e.target.files[0])} />
        </Button>
        {file && <Typography variant="body2" sx={{ mt: 1 }}>Selected file: {file.name}</Typography>}
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
