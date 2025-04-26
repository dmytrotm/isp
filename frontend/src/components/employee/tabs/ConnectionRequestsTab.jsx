import React, { useState, useEffect } from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Chip,
  TablePagination,
  CircularProgress,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
} from "@mui/material";
import api from "../../../services/api";
import { useSnackbar } from "notistack";

const ConnectionRequestsTab = () => {
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [contractData, setContractData] = useState({});
  const [equipmentOptions, setEquipmentOptions] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  // Fetch connection requests data
  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const requestsResponse = await api.get(
        "/admin-dashboard/connection_requests/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1, // API might use 1-based indexing
            page_size: rowsPerPage,
          },
        }
      );

      setConnectionRequests(
        requestsResponse.data.results || requestsResponse.data
      );
      setTotalRequests(
        requestsResponse.data.count || requestsResponse.data.length
      );
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load connection requests");
      setLoading(false);
    }
  };

  // Fetch equipment options for contract creation
  const fetchEquipmentOptions = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/equipment/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const equipmentArray = Object.values(response.data || {});
      setEquipmentOptions(equipmentArray);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  useEffect(() => {
    fetchConnectionRequests();
    fetchEquipmentOptions();
  }, [page, rowsPerPage]);

  // Handle page change for pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change for pagination
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle view request details
  const handleViewDetail = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/admin-dashboard/${id}/connection-request-details/`,
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
      setError(err.message || "Failed to load connection request details");
      setLoading(false);
    }
  };

  // Handle close detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setDetailData(null);
  };

  // Handle reject request
  const handleRejectRequest = async (requestId) => {
    if (
      window.confirm(
        "Are you sure you want to decline this connection request?"
      )
    ) {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Call reject endpoint
        await api.patch(
          `/admin-dashboard/${requestId}/decline/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Refresh the request data
        const response = await api.get(
          `/admin-dashboard/${requestId}/connection-request-details/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDetailData(response.data);

        // Refresh the list
        fetchConnectionRequests();

        enqueueSnackbar("Request rejected successfully", {
          variant: "success",
        });
      } catch (error) {
        console.error("Error rejecting request:", error);
        enqueueSnackbar(
          "Failed to reject request: " +
            (error.response?.data?.error || error.message),
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle approve request - open contract form dialog
  const handleApproveRequest = (requestId) => {
    if (
      window.confirm(
        "Are you sure you want to approve this connection request?"
      )
    ) {
      // Initialize contract data with connection request info
      const requestData =
        detailData || connectionRequests.find((req) => req.id === requestId);

      if (!requestData) {
        enqueueSnackbar("Request data not found", { variant: "error" });
        return;
      }

      setContractData({
        connection_request: requestId,
        customer: requestData.customer || requestData.customer_id,
        address: requestData.address || requestData.address_id,
        tariff: requestData.tariff || requestData.tariff_id,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        equipment: [],
      });

      // Open the dialog
      setOpenContractDialog(true);
    }
  };

  // Handle close contract dialog
  const handleCloseContractDialog = () => {
    setOpenContractDialog(false);
  };

  // Handle contract creation
  const handleCreateContract = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Call approve endpoint which creates contract
      await api.post(
        `/admin-dashboard/${contractData.connection_request}/approve/`,
        contractData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh the request data
      const response = await api.get(
        `/admin-dashboard/${contractData.connection_request}/connection-request-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDetailData(response.data);

      // Refresh the list
      fetchConnectionRequests();

      // Close the dialog
      setOpenContractDialog(false);

      enqueueSnackbar("Contract created successfully", { variant: "success" });
    } catch (error) {
      console.error("Error creating contract:", error);
      enqueueSnackbar(
        "Failed to create contract: " +
          (error.response?.data?.error || error.message),
        {
          variant: "error",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Equipment selection handler
  const handleEquipmentChange = (event) => {
    setContractData({
      ...contractData,
      equipment: event.target.value,
    });
  };

  // Date change handlers
  const handleStartDateChange = (event) => {
    setContractData({
      ...contractData,
      start_date: event.target.value,
    });
  };

  const handleEndDateChange = (event) => {
    setContractData({
      ...contractData,
      end_date: event.target.value,
    });
  };

  if (loading && connectionRequests.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
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
        minHeight="80vh"
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
        <Table aria-label="connection requests table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Tariff</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {connectionRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{`${
                  request.customer_details?.user_details?.first_name || ""
                } ${
                  request.customer_details?.user_details?.last_name || ""
                }`}</TableCell>
                <TableCell>{`${request.address_details?.street || ""}, ${
                  request.address_details?.city || ""
                }`}</TableCell>
                <TableCell>{request.tariff_details?.name || ""}</TableCell>
                <TableCell>
                  {request.created_at
                    ? new Date(request.created_at).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.status_name || "unknown"}
                    color={
                      request.status_name === "completed"
                        ? "success"
                        : request.status_name === "pending"
                        ? "warning"
                        : "default"
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetail(request.id)}
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  {(request.status_name === "Pending" ||
                    request.status_name === "New") && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleApproveRequest(request.id)}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRequests}
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
        <DialogTitle>Connection Request Details</DialogTitle>
        <DialogContent>
          {detailData && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Request ID:</strong> {detailData.id}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Status:</strong> {detailData.status_name}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Created:</strong>{" "}
                  {new Date(detailData.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Customer:</strong>{" "}
                  {`${
                    detailData.customer_details?.user_details?.first_name || ""
                  } ${
                    detailData.customer_details?.user_details?.last_name || ""
                  }`}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Email:</strong>{" "}
                  {detailData.customer_details?.user_details?.email || ""}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Phone:</strong>{" "}
                  {detailData.customer_details?.phone_number || ""}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Address:</strong>{" "}
                  {`${detailData.address_details?.street || ""}, ${
                    detailData.address_details?.city || ""
                  }, ${detailData.address_details?.region_name || ""} `}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Tariff:</strong>{" "}
                  {detailData.tariff_details?.name || ""}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Monthly Rate:</strong> $
                  {detailData.tariff_details?.price || "0"}
                </Typography>
              </Grid>
              {detailData.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Notes:</strong>
                  </Typography>
                  <Typography variant="body1">{detailData.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
          {detailData && detailData.status_name === "pending" && (
            <>
              <Button
                onClick={() => handleRejectRequest(detailData.id)}
                color="error"
                variant="contained"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleApproveRequest(detailData.id)}
                color="primary"
                variant="contained"
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Contract Creation Dialog */}
      <Dialog
        open={openContractDialog}
        onClose={handleCloseContractDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Contract</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={contractData.start_date}
                onChange={handleStartDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={contractData.end_date}
                onChange={handleEndDateChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="equipment-select-label">Equipment</InputLabel>
                <Select
                  labelId="equipment-select-label"
                  id="equipment-select"
                  multiple
                  value={contractData.equipment || []}
                  onChange={handleEquipmentChange}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {equipmentOptions.map((equipment) => (
                    <MenuItem key={equipment.id} value={equipment.id}>
                      {equipment.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContractDialog}>Cancel</Button>
          <Button
            onClick={handleCreateContract}
            color="primary"
            variant="contained"
          >
            Create Contract
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConnectionRequestsTab;
