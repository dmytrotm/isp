import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import for navigation
import api from "../../services/api";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // For back button icon

const SupportTicket = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (subject.trim() && description.trim()) {
      try {
        setSubmitting(true);

        // Include the customer ID in the request
        const customerId = 1; // Replace with actual customer ID from your auth context

        await api.post("/support-tickets/", {
          subject,
          description,
          customer: customerId,
        });

        setSubmitSuccess(true);
        setSubject("");
        setDescription("");

        // Redirect to dashboard after successful submission
        // Short delay to show success message before redirect
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Failed to submit ticket:", error);
        setError(
          error.response?.data?.message ||
            "Failed to submit ticket. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Function to navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h1" fontWeight="bold">
            Create New Support Ticket
          </Typography>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Snackbar
          open={submitSuccess}
          autoHideDuration={1500}
          onClose={() => setSubmitSuccess(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="success" sx={{ width: "100%" }}>
            Your support ticket has been submitted successfully! Redirecting to
            dashboard...
          </Alert>
        </Snackbar>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="subject"
            label="Subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="description"
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={6}
            sx={{ mb: 3 }}
          />

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting}
              sx={{ py: 1.5 }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Submitting...
                </Box>
              ) : (
                "Submit Ticket"
              )}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={handleBackToDashboard}
              sx={{ py: 1.5 }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default SupportTicket;
