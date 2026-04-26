import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  TablePagination
} from "@mui/material";
import api from "../../../services/api";
import { useSnackbar } from "notistack";
import { StatusBadge } from "../../shared/StatusBadge";

const TariffRecommendationsTab = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const { enqueueSnackbar } = useSnackbar();

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/recommendations/", {
        params: {
          page: page + 1,
          page_size: rowsPerPage
        }
      });
      setRecommendations(response.data.results || response.data);
      setTotal(response.data.count || response.data.length);
      setLoading(false);
    } catch (err) {
      setError("Failed to load recommendations");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [page, rowsPerPage]);

  const handleMarkReviewed = async (id) => {
    try {
      await api.patch(`/recommendations/${id}/`, { is_reviewed: true });
      enqueueSnackbar("Recommendation marked as reviewed", { variant: "success" });
      fetchRecommendations();
    } catch (err) {
      enqueueSnackbar("Failed to update recommendation", { variant: "error" });
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Smart Tariff Recommendations</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Based on actual network usage patterns from the last 90 days.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Current Tariff</TableCell>
              <TableCell>Recommended Tariff</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Usage %</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recommendations.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>{rec.customer_name}</TableCell>
                <TableCell>{rec.current_tariff_details?.name} (₴{rec.current_tariff_details?.price})</TableCell>
                <TableCell>
                  <Typography color="primary" sx={{ fontWeight: 'bold' }}>
                    {rec.recommended_tariff_details?.name} (₴{rec.recommended_tariff_details?.price})
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={rec.reason.toUpperCase()} 
                    size="small" 
                    color={rec.reason === 'overusing' ? 'warning' : 'info'} 
                  />
                </TableCell>
                <TableCell>{rec.avg_usage_percent}%</TableCell>
                <TableCell>
                  <Chip 
                    label={rec.is_reviewed ? "Reviewed" : "New"} 
                    size="small" 
                    variant={rec.is_reviewed ? "outlined" : "filled"}
                    color={rec.is_reviewed ? "default" : "primary"}
                  />
                </TableCell>
                <TableCell>
                  {!rec.is_reviewed && (
                    <Button size="small" variant="outlined" onClick={() => handleMarkReviewed(rec.id)}>
                      Mark Reviewed
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {recommendations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">No recommendations found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
      />
    </Box>
  );
};

export default TariffRecommendationsTab;
