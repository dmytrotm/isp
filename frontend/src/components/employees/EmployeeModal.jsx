import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent,
  Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Box, Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function EmployeeModal({ open, onClose, loading, detailData }) {
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin": return "error";
      case "manager": return "primary";
      case "support": return "success";
      default: return "default";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Employee Details
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}><CircularProgress /></Box>
        ) : detailData ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Employee Information</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Name" secondary={detailData.user_details?.full_name} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email" secondary={detailData.user_details?.email} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Role" secondary={<Chip label={detailData.role_name} color={getRoleColor(detailData.role_name)} size="small" />} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Staff Member Since" secondary={new Date(detailData.created_at).toLocaleDateString()} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Permissions & Groups</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Is Staff" secondary={detailData.user_details?.is_staff ? "Yes" : "No"} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Is Superuser" secondary={detailData.user_details?.is_superuser ? "Yes" : "No"} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="User Groups" secondary={detailData.user_groups?.length > 0 ? detailData.user_groups.join(", ") : "No groups assigned"} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activities */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Activities</Typography>
                  {detailData.recent_activities?.length > 0 ? (
                    <List dense>
                      {detailData.recent_activities.map((activity, index) => (
                        <ListItem key={index} divider={index < detailData.recent_activities.length - 1}>
                          <ListItemText primary={activity.action} secondary={`${new Date(activity.timestamp).toLocaleString()} - ${activity.details}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="textSecondary">No recent activities recorded.</Typography>}
                </CardContent>
              </Card>
            </Grid>

            {/* Assigned Tickets */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Assigned Support Tickets</Typography>
                  {detailData.assigned_tickets?.length > 0 ? (
                    <List dense>
                      {detailData.assigned_tickets.slice(0, 5).map((ticket) => (
                        <ListItem key={ticket.id}>
                          <ListItemText primary={ticket.subject} secondary={`Created: ₴{new Date(ticket.created_at).toLocaleDateString()} - Status: ₴{ticket.status}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="textSecondary">No tickets currently assigned to this employee.</Typography>}
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
