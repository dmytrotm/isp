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
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import api from "../../../services/api";
import { useSnackbar } from "notistack";

const ContractsTab = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalContracts, setTotalContracts] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // Fetch contracts data
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/admin-dashboard/contracts/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page + 1, // API uses 1-based indexing
          page_size: rowsPerPage,
        },
      });

      setContracts(response.data.results || response.data);
      setTotalContracts(response.data.count || response.data.length);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load contracts data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
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

  // View contract details
  const handleViewDetail = async (contractId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/admin-dashboard/${contractId}/contract-details/`,
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
      enqueueSnackbar(err.message || "Failed to load contract details", {
        variant: "error",
      });
      setLoading(false);
    }
  };

  // Close detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setDetailData(null);
  };

  // Open terminate contract dialog
  const handleOpenTerminateDialog = (contractId) => {
    setSelectedContractId(contractId);
    setTerminateDialogOpen(true);
  };

  // Close terminate contract dialog
  const handleCloseTerminateDialog = () => {
    setTerminateDialogOpen(false);
    setSelectedContractId(null);
  };

  // Check if a contract is active by querying its status
  const checkContractStatus = async (contractId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/admin-dashboard/${contractId}/contract-details/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.is_active;
    } catch (err) {
      console.error("Error checking contract status:", err);
      return null; // Return null if we couldn't determine status
    }
  };

  // Terminate contract with improved error handling
  const handleTerminateContract = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const contractId = selectedContractId;

      // First check if the contract is active
      const isActive = await checkContractStatus(contractId);

      if (isActive === false) {
        // Contract is already inactive, just refresh and close dialog
        enqueueSnackbar("Contract is already inactive", { variant: "info" });
        handleCloseTerminateDialog();
        fetchContracts();
        return;
      }

      try {
        // Try to terminate with PATCH first
        await api.patch(
          `/admin-dashboard/${contractId}/terminate-contract/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (patchError) {
        console.error("Error with PATCH request:", patchError);

        // If PATCH failed, try PUT as fallback
        try {
          await api.put(
            `/admin-dashboard/${contractId}/terminate-contract/`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (putError) {
          console.error("Error with PUT request:", putError);

          // Even if both methods fail, check if contract was actually terminated
          const currentStatus = await checkContractStatus(contractId);

          if (currentStatus === false) {
            // Contract is now inactive despite errors, so operation succeeded
            enqueueSnackbar(
              "Contract terminated successfully (with server warning)",
              { variant: "success" }
            );
          } else if (currentStatus === true) {
            // Contract is still active, operation truly failed
            throw new Error("Failed to terminate contract");
          } else {
            // Couldn't determine status, assume it might have worked
            enqueueSnackbar(
              "Contract status unknown - please refresh the page",
              { variant: "warning" }
            );
          }
        }
      }

      // Show success message
      enqueueSnackbar("Contract terminated successfully", {
        variant: "success",
      });

      // Close the dialog
      handleCloseTerminateDialog();

      // Always refresh contracts data
      await fetchContracts();

      // If detail dialog is open with the terminated contract, update it
      if (detailDialogOpen && detailData && detailData.id === contractId) {
        handleViewDetail(contractId);
      }
    } catch (error) {
      console.error("Error terminating contract:", error);
      enqueueSnackbar(
        "Failed to terminate contract. Please refresh the page to see current status.",
        { variant: "error" }
      );

      // Refresh data anyway since backend might have succeeded despite the error
      await fetchContracts();
    } finally {
      setLoading(false);
    }
  };

  if (loading && contracts.length === 0) {
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

  if (error && contracts.length === 0) {
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
        <Table aria-label="contracts table">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
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
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>{contract.id}</TableCell>
                <TableCell>{`${
                  contract.customer_details?.user_details?.first_name || ""
                } ${
                  contract.customer_details?.user_details?.last_name || ""
                }`}</TableCell>
                <TableCell>{`${contract.address_details?.street || ""}, ${
                  contract.address_details?.city || ""
                }`}</TableCell>
                <TableCell>{contract.tariff_details?.name || ""}</TableCell>
                <TableCell>
                  {new Date(contract.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={contract.is_active ? "Active" : "Inactive"}
                    color={contract.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewDetail(contract.id)}
                    sx={{ mr: 1, mb: { xs: 1, md: 0 } }}
                  >
                    View
                  </Button>
                  {contract.is_active && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenTerminateDialog(contract.id)}
                    >
                      Terminate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalContracts}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Contract Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Contract Details
          {detailData?.is_active ? (
            <Chip label="Active" color="success" size="small" sx={{ ml: 2 }} />
          ) : (
            <Chip label="Inactive" size="small" sx={{ ml: 2 }} />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailData && (
            <>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="body1">
                  <strong>Contract ID:</strong> {detailData.id}
                </Typography>
                <Typography variant="body1">
                  <strong>Created:</strong>{" "}
                  {new Date(detailData.created_at).toLocaleString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Start Date:</strong>{" "}
                  {new Date(detailData.start_date).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  <strong>End Date:</strong>{" "}
                  {detailData.end_date
                    ? new Date(detailData.end_date).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="body1">
                  <strong>Customer:</strong>{" "}
                  {`${
                    detailData.customer_details?.user_details?.first_name || ""
                  } ${
                    detailData.customer_details?.user_details?.last_name || ""
                  }`}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong>{" "}
                  {detailData.customer_details?.user_details?.email || "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong>{" "}
                  {detailData.customer_details?.phone_number || "N/A"}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Service Information
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="body1">
                  <strong>Address:</strong>{" "}
                  {`${detailData.address_details?.street || ""}, ${
                    detailData.address_details?.city || ""
                  }`}
                </Typography>
                <Typography variant="body1">
                  <strong>Tariff:</strong>{" "}
                  {detailData.tariff_details?.name || "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Monthly Fee:</strong> $
                  {detailData.tariff_details?.price || "N/A"}
                </Typography>
              </Box>

              {detailData.equipment && detailData.equipment.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Equipment
                  </Typography>
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Serial Number</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailData.equipment.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name || "N/A"}</TableCell>
                            <TableCell>{item.type || "N/A"}</TableCell>
                            <TableCell>{item.serial_number || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {detailData?.is_active && (
            <Button
              onClick={() => handleOpenTerminateDialog(detailData.id)}
              color="error"
            >
              Terminate Contract
            </Button>
          )}
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Terminate Contract Confirmation Dialog */}
      <Dialog open={terminateDialogOpen} onClose={handleCloseTerminateDialog}>
        <DialogTitle>Terminate Contract</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to terminate this contract? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTerminateDialog}>Cancel</Button>
          <Button onClick={handleTerminateContract} color="error" autoFocus>
            Terminate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual refresh button - for emergency cases */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button onClick={fetchContracts} variant="outlined" size="small">
          Refresh Data
        </Button>
      </Box>
    </>
  );
};

export default ContractsTab;
