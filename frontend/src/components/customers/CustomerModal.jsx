import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent,
  Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Box, Table, TableHead, TableRow, TableCell, TableBody, TableContainer
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { StatusBadge } from '../shared/StatusBadge';

export default function CustomerModal({ open, onClose, loading, detailData }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Customer Details
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : detailData ? (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Name" secondary={detailData.user_details?.full_name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email" secondary={detailData.user_details?.email} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Phone" secondary={detailData.phone_number} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Status" secondary={<StatusBadge status={detailData.status_name?.toLowerCase()} />} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Balance" secondary={`₴${detailData.balance}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Customer Since" secondary={new Date(detailData.created_at).toLocaleDateString()} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            {/* Addresses */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Addresses</Typography>
                  {detailData.addresses && detailData.addresses.length > 0 ? (
                    <List dense>
                      {detailData.addresses.map((address) => (
                        <ListItem key={address.id}>
                          <ListItemText
                            primary={`${address.street}, ${address.city}`}
                            secondary={`Building: ${address.building}, Apt: ${address.apartment}, Region: ${address.region_name}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">No addresses found for this customer.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            {/* Contracts */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Contracts</Typography>
                  {detailData.contracts && detailData.contracts.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Contract ID</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Tariff</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detailData.contracts.map((contract) => (
                            <TableRow key={contract.id}>
                              <TableCell>{contract.id}</TableCell>
                              <TableCell>{`${contract.address_details?.street}, ${contract.address_details?.city}`}</TableCell>
                              <TableCell>{contract.tariff_details?.name}</TableCell>
                              <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
                              <TableCell><StatusBadge status={contract.is_active ? 'active' : 'inactive'} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : <Typography variant="body2" color="textSecondary">No contracts found for this customer.</Typography>}
                </CardContent>
              </Card>
            </Grid>
            {/* Recent Invoices */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Invoices</Typography>
                  {detailData.all_invoices && detailData.all_invoices.length > 0 ? (
                    <List dense>
                      {detailData.all_invoices.slice(0, 5).map((invoice) => (
                        <ListItem key={invoice.id}>
                          <ListItemText
                            primary={`Invoice #${invoice.id} - ₴${invoice.amount}`}
                            secondary={`Due: ${new Date(invoice.due_date).toLocaleDateString()} - Status: ${invoice.status}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="textSecondary">No invoices found for this customer.</Typography>}
                </CardContent>
              </Card>
            </Grid>
            {/* Support Tickets */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Support Tickets</Typography>
                  {detailData.support_tickets && detailData.support_tickets.length > 0 ? (
                    <List dense>
                      {detailData.support_tickets.slice(0, 5).map((ticket) => (
                        <ListItem key={ticket.id}>
                          <ListItemText
                            primary={ticket.subject}
                            secondary={`Created: ${new Date(ticket.created_at).toLocaleDateString()} - Status: ${ticket.status}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="textSecondary">No support tickets found for this customer.</Typography>}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : <Typography>No data available</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
