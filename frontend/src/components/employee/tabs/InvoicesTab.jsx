import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TablePagination,
  Box,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import api from "../../../services/api";

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // State for invoice detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const invoicesResponse = await api.get("/admin-dashboard/invoices/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page + 1,
          page_size: rowsPerPage,
        },
      });

      setInvoices(invoicesResponse.data.results || invoicesResponse.data);
      setTotalInvoices(
        invoicesResponse.data.count || invoicesResponse.data.length
      );
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load invoices data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage]);

  const handleViewDetail = async (invoiceId) => {
    try {
      setLoadingDetails(true);
      setDetailError(null);
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/admin-dashboard/${invoiceId}/invoice-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedInvoice(response.data);
      setDetailDialogOpen(true);
      setLoadingDetails(false);
    } catch (err) {
      setDetailError(err.message || "Failed to load invoice details");
      setLoadingDetails(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to mark invoice as paid
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem("token");

      await api.put(
        `/admin-dashboard/${invoiceId}/update-invoice-status/`,
        { status: "paid" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh invoice details
      const response = await api.get(
        `/admin-dashboard/${invoiceId}/invoice-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedInvoice(response.data);

      // Also refresh invoice list
      fetchInvoices();

      setLoadingDetails(false);
    } catch (err) {
      setDetailError(err.message || "Failed to update invoice status");
      setLoadingDetails(false);
    }
  };

  // Function to send invoice reminder
  const handleSendReminder = async (invoiceId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem("token");

      await api.post(
        `/admin-dashboard/${invoiceId}/send-reminder/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success message (you might want to use a snackbar or toast here)
      alert("Payment reminder sent successfully");

      setLoadingDetails(false);
    } catch (err) {
      setDetailError(err.message || "Failed to send reminder");
      setLoadingDetails(false);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
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
        minHeight="300px"
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
        <Table aria-label="invoices table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.id}</TableCell>
                <TableCell>{invoice.contract_details?.customer}</TableCell>
                <TableCell>${invoice.amount}</TableCell>
                <TableCell>
                  {new Date(invoice.issue_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(invoice.due_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={
                      invoice.status === "paid"
                        ? "success"
                        : invoice.status === "overdue"
                        ? "error"
                        : "warning"
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetail(invoice.id)}
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
        count={totalInvoices}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Invoice Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Invoice Details
          {loadingDetails && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent>
          {detailError && (
            <Typography color="error" gutterBottom>
              Error: {detailError}
            </Typography>
          )}

          {selectedInvoice && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      General Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Invoice ID"
                          secondary={selectedInvoice.id}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Amount"
                          secondary={`$${selectedInvoice.amount}`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Chip
                              label={selectedInvoice.status}
                              color={
                                selectedInvoice.status === "paid"
                                  ? "success"
                                  : selectedInvoice.status === "overdue"
                                  ? "error"
                                  : "warning"
                              }
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Issue Date"
                          secondary={new Date(
                            selectedInvoice.issue_date
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Due Date"
                          secondary={new Date(
                            selectedInvoice.due_date
                          ).toLocaleDateString()}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Customer & Contract Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Customer"
                          secondary={selectedInvoice.contract_details?.customer}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Contract ID"
                          secondary={selectedInvoice.contract_details?.id}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Service"
                          secondary={selectedInvoice.contract_details?.service}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Tariff"
                          secondary={selectedInvoice.contract_details?.tariff}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Description"
                          secondary={
                            selectedInvoice.description
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoicesTab;
