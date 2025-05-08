import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import { PaymentOutlined } from "@mui/icons-material";

const Payment = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        // Fetch available payment methods
        const response = await api.get("/payment-methods/");
        setPaymentMethods(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching payment methods:", err);
        setError("Failed to load payment methods. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !selectedMethod) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Make payment request to the backend
      const token = localStorage.getItem("token");
      await api.post(
        "/payments/",
        {
          amount: parseFloat(amount),
          method: selectedMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show success message
      setSuccess(true);
      setOpenSnackbar(true);
      // Reset form
      setAmount("");
      setSelectedMethod("");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.detail || "Payment failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <PaymentOutlined
            sx={{ fontSize: 28, mr: 2, color: "primary.main" }}
          />
          <Typography variant="h4" component="h1" fontWeight="500">
            Make a Payment
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="amount"
            label="Amount"
            variant="outlined"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            inputProps={{ min: "0.01", step: "0.01" }}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="payment-method-label">Payment Method</InputLabel>
            <Select
              labelId="payment-method-label"
              id="method"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              label="Payment Method"
              disabled={loading}
              required
            >
              <MenuItem value="" disabled>
                {loading
                  ? "Loading payment methods..."
                  : "Select a payment method"}
              </MenuItem>
              {paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.id}>
                  {method.method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting || loading}
            sx={{
              py: 1.5,
              fontSize: "1rem",
              backgroundColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            {submitting ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} sx={{ mr: 1, color: "white" }} />
                Processing...
              </Box>
            ) : (
              "Pay Now"
            )}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Payment successful! Redirecting to dashboard...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Payment;
