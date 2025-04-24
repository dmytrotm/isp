import { useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

const ConnectionRequest = () => {
  // Connection Request states
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [tariffs, setTariffs] = useState([]);
  const [selectedTariff, setSelectedTariff] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState([]);
  const navigate = useNavigate();

  // Address creation dialog states
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [addressForm, setAddressForm] = useState({
    apartment: "",
    building: "",
    street: "",
    city: "",
    region: null,
  });
  const [addressFormError, setAddressFormError] = useState("");
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/services/");
        setServices(response.data);
      } catch (err) {
        console.error("Failed to load services:", err);
        setError("Failed to load services");
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    api
      .get("regions")
      .then((res) => {
        setRegions(res.data); // assuming API returns an array of { id, name }
      })
      .catch((err) => {
        console.error("Failed to fetch regions", err);
      });
  }, []);

  // Fetch tariffs when a service is selected
  useEffect(() => {
    if (selectedService) {
      const fetchTariffs = async () => {
        try {
          const response = await api.get(
            `/tariffs/by_service?service_id=${selectedService}`
          );
          setTariffs(response.data);
        } catch (err) {
          console.error("Failed to load tariffs:", err);
          setError("Failed to load tariffs");
        }
      };
      fetchTariffs();
    }
  }, [selectedService]);

  // Fetch addresses on mount and when new one is added
  const fetchAddresses = async () => {
    try {
      const response = await api.get("/addresses/");
      setAddresses(response.data);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      setError("Failed to load addresses");
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/connection-requests/", {
        address: addressId,
        tariff: selectedTariff,
        notes,
      });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to create connection request");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: value,
    });
  };

  const handleAddressSubmit = async () => {
    setAddressSubmitting(true);
    setAddressFormError("");

    try {
      // Get the customer ID - assuming it's available through the API or context
      const customerResponse = await api.get("/customers/");
      console.log(customerResponse);
      const customerId = customerResponse.data[0]?.id;

      // Submit the new address
      await api.post(`/customers/${customerId}/add_address/`, addressForm);

      // Refresh addresses list
      await fetchAddresses();

      // Close dialog and reset form
      setOpenAddressDialog(false);
      setAddressForm({
        apartment: "",
        building: "",
        street: "",
        city: "",
        region: null,
        postal_code: "",
      });
    } catch (err) {
      console.error("Failed to create address:", err);
      setAddressFormError("Failed to create address. Please try again.");
    } finally {
      setAddressSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5", // optional: adds a background color
          px: 2, // optional: padding on smaller screens
        }}
      >
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            New Connection Request
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel id="service-label">Select Service</InputLabel>
                  <Select
                    labelId="service-label"
                    value={selectedService}
                    label="Select Service"
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <MenuItem value="">-- Choose Service --</MenuItem>
                    {services.map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {selectedService && (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="tariff-label">Select Tariff</InputLabel>
                    <Select
                      labelId="tariff-label"
                      value={selectedTariff}
                      label="Select Tariff"
                      onChange={(e) => setSelectedTariff(e.target.value)}
                    >
                      <MenuItem value="">-- Choose Tariff --</MenuItem>
                      {tariffs.map((tariff) => (
                        <MenuItem key={tariff.id} value={tariff.id}>
                          {tariff.name} - ${tariff.price}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FormControl fullWidth required>
                    <InputLabel id="address-label">Select Address</InputLabel>
                    <Select
                      labelId="address-label"
                      value={addressId}
                      label="Select Address"
                      onChange={(e) => setAddressId(e.target.value)}
                    >
                      <MenuItem value="">-- Choose Address --</MenuItem>
                      {addresses.map((addr) => (
                        <MenuItem key={addr.id} value={addr.id}>
                          {`${addr.apartment || ""} ${addr.building || ""} ${
                            addr.street || ""
                          }, ${addr.city || ""} (${addr.region || null})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton
                    color="primary"
                    sx={{ ml: 1 }}
                    onClick={() => setOpenAddressDialog(true)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Address Creation Dialog */}
      <Dialog
        open={openAddressDialog}
        onClose={() => setOpenAddressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Address
          <IconButton
            aria-label="close"
            onClick={() => setOpenAddressDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {addressFormError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addressFormError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                name="apartment"
                label="Apartment"
                fullWidth
                value={addressForm.apartment}
                onChange={handleAddressInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="building"
                label="Building"
                fullWidth
                value={addressForm.building}
                onChange={handleAddressInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="street"
                label="Street"
                fullWidth
                required
                value={addressForm.street}
                onChange={handleAddressInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="city"
                label="City"
                fullWidth
                required
                value={addressForm.city}
                onChange={handleAddressInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel id="region-label">Region</InputLabel>
                <Select
                  labelId="region-label"
                  name="region"
                  value={addressForm.region}
                  onChange={handleAddressInputChange}
                >
                  {regions.map((region) => (
                    <MenuItem key={region.id} value={region.id}>
                      {region.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddressDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddressSubmit}
            variant="contained"
            disabled={addressSubmitting}
          >
            {addressSubmitting ? <CircularProgress size={24} /> : "Add Address"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConnectionRequest;
