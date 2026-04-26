import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Grid, TextField, FormControlLabel, Switch, Typography, Divider, FormGroup, Checkbox, Button } from '@mui/material';

export default function TariffDialog({ open, onClose, mode, formData, handleInputChange, handleServiceChange, services, onSubmit }) {
  const isView = mode === "view";
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === "create" ? "Create New Tariff" : mode === "edit" ? "Edit Tariff" : "Tariff Details"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, overflowX: "auto" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Tariff Name" name="name" value={formData.name} onChange={handleInputChange} fullWidth margin="normal" disabled={isView} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Price" name="price" value={formData.price} onChange={handleInputChange} fullWidth margin="normal" type="number" inputProps={{ min: 0, step: "0.01" }} disabled={isView} required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Description" name="description" value={formData.description} onChange={handleInputChange} fullWidth margin="normal" multiline rows={3} disabled={isView} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel control={<Switch checked={formData.is_active} onChange={handleInputChange} name="is_active" color="primary" disabled={isView} />} label="Active" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom>Included Services</Typography>
              <Divider sx={{ mb: 2 }} />
              <FormGroup>
                <Box sx={{ overflowX: "auto" }}>
                  <Grid container spacing={2} sx={{ minWidth: 500 }}>
                    {services.map((service) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
                        <FormControlLabel control={<Checkbox checked={formData.services.includes(service.id)} onChange={() => handleServiceChange(service.id)} name={`service-${service.id}`} disabled={isView} />} label={service.name} />
                      </Grid>
                    ))}
                    {services.length === 0 && <Grid size={{ xs: 12 }}><Typography color="text.secondary">No services available</Typography></Grid>}
                  </Grid>
                </Box>
              </FormGroup>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{isView ? "Close" : "Cancel"}</Button>
        {!isView && (
          <Button onClick={onSubmit} variant="contained" color="primary" disabled={!formData.name || !formData.price}>
            {mode === "create" ? "Create" : "Update"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
