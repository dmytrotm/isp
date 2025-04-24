import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import api from "../../../services/api";
import { useSnackbar } from "notistack";
import { useAuth } from "../../../context/AuthContext";

const SupportTicketsTab = () => {
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTickets, setTotalTickets] = useState(0);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const [modifyTicketOpen, setModifyTicketOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");

  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin, isManager, isSupport } = useAuth();

  // Role-based permissions
  const canModifyTicket = isAdmin || isManager || isSupport;
  const canAssignTechnician = isAdmin || isManager;

  useEffect(() => {
    fetchSupportTickets();
  }, [page, rowsPerPage]);

  // Add useEffect to fetch statuses and technicians when the modal opens
  useEffect(() => {
    if (modifyTicketOpen) {
      // Fetch available statuses for support tickets - all roles that can modify
      if (canModifyTicket) {
        api
          .get("/statuses/", {
            params: { context_name: "SupportTicket" },
          })
          .then((response) => {
            setAvailableStatuses(response.data.results || response.data);
          })
          .catch((error) => console.error("Error fetching statuses:", error));
      }

      // Fetch available technicians - only admin/manager
      if (canAssignTechnician) {
        api
          .get("/admin-dashboard/employees/", {
            params: { role_name: "technician" },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
          .then((response) => {
            setAvailableTechnicians(response.data.results || []);
          })
          .catch((error) =>
            console.error("Error fetching technicians:", error)
          );
      }
    }
  }, [modifyTicketOpen, canModifyTicket, canAssignTechnician]);

  const fetchSupportTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const ticketsResponse = await api.get(
        "/admin-dashboard/support_tickets/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1,
            page_size: rowsPerPage,
          },
        }
      );

      setSupportTickets(ticketsResponse.data.results || ticketsResponse.data);
      setTotalTickets(
        ticketsResponse.data.count || ticketsResponse.data.length
      );
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load support tickets");
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/admin-dashboard/${id}/support-ticket-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDetailData(response.data);
      setDetailDialogOpen(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || `Failed to load ticket details`);
      setLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setDetailData(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUpdateTicket = () => {
    const updateData = {};

    if (selectedStatus) {
      updateData.status = selectedStatus;
    }

    if (selectedTechnician && canAssignTechnician) {
      updateData.assigned_to = selectedTechnician;
    }

    api
      .put(`/admin-dashboard/${detailData.id}/update_ticket/`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setModifyTicketOpen(false);
        handleCloseDetail();
        fetchSupportTickets(); // Refresh data
        enqueueSnackbar("Ticket updated successfully", { variant: "success" });
      })
      .catch((error) => {
        console.error("Error updating ticket:", error);
        enqueueSnackbar("Failed to update ticket", { variant: "error" });
      });
  };

  if (loading && supportTickets.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="support tickets table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {supportTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.id}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>{`${ticket.customer_details?.user_details?.first_name} ${ticket.customer_details?.user_details?.last_name}`}</TableCell>
                <TableCell>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={ticket.status}
                    color={
                      ticket.status === "resolved"
                        ? "success"
                        : ticket.status === "open"
                        ? "warning"
                        : "default"
                    }
                  />
                </TableCell>
                <TableCell>
                  {ticket.assigned_to_details
                    ? `${ticket.assigned_to_details.user_details?.first_name} ${ticket.assigned_to_details.user_details?.last_name}`
                    : "Unassigned"}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetail(ticket.id)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalTickets}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Support Ticket Details</DialogTitle>
        <DialogContent dividers>
          {detailData && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Ticket Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>ID</strong>
                      </TableCell>
                      <TableCell>{detailData.id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Subject</strong>
                      </TableCell>
                      <TableCell>{detailData.subject}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Status</strong>
                      </TableCell>
                      <TableCell>{detailData.status}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Created</strong>
                      </TableCell>
                      <TableCell>
                        {new Date(detailData.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Updated</strong>
                      </TableCell>
                      <TableCell>
                        {new Date(detailData.updated_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Customer Information
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>Name</strong>
                      </TableCell>
                      <TableCell>{`${detailData.customer_details?.user_details?.first_name} ${detailData.customer_details?.user_details?.last_name}`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Email</strong>
                      </TableCell>
                      <TableCell>
                        {detailData.customer_details?.user_details?.email}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Phone</strong>
                      </TableCell>
                      <TableCell>
                        {detailData.customer_details?.phone_number}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Assigned To</strong>
                      </TableCell>
                      <TableCell>
                        {detailData.assigned_to_details
                          ? `${detailData.assigned_to_details.user_details?.first_name} ${detailData.assigned_to_details.user_details?.last_name}`
                          : "Unassigned"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {detailData.description}
                  </Typography>
                </Paper>
              </Grid>
              {detailData.comments && detailData.comments.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Comments
                  </Typography>
                  {detailData.comments.map((comment, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {comment.created_by_name} -{" "}
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body1">{comment.text}</Typography>
                    </Paper>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
          {canModifyTicket && (
            <Button color="primary" onClick={() => setModifyTicketOpen(true)}>
              Modify Ticket
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Modify Ticket Dialog - Only visible if user can modify tickets */}
      {canModifyTicket && (
        <Dialog
          open={modifyTicketOpen}
          onClose={() => setModifyTicketOpen(false)}
        >
          <DialogTitle>Update Support Ticket</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, minWidth: 400 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">
                    <em>No change</em>
                  </MenuItem>
                  {availableStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Only show technician assignment for admin/manager */}
              {canAssignTechnician && (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="technician-label">
                    Assigned Technician
                  </InputLabel>
                  <Select
                    labelId="technician-label"
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    label="Assigned Technician"
                  >
                    <MenuItem value="">
                      <em>No change</em>
                    </MenuItem>
                    {availableTechnicians.map((tech) => (
                      <MenuItem key={tech.id} value={tech.id}>
                        {`${tech.user_details?.first_name} ${tech.user_details?.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModifyTicketOpen(false)}>Cancel</Button>
            <Button color="primary" onClick={handleUpdateTicket}>
              Update Ticket
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default SupportTicketsTab;
