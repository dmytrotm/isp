// src/components/auth/Register.js
import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../../services/api"; // Adjust path as needed

// MUI imports
import {
  Avatar,
  Button,
  TextField,
  Link,
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  InputAdornment,
  IconButton,
  LinearProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ErrorIcon from "@mui/icons-material/Error";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#f50057",
    },
  },
});

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user: {
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    },
    status: 1,
    phone_number: "",
    preferred_notification: "email",
    addresses: [],
  });

  // Form validation states
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // API and submission states
  const [generalError, setGeneralError] = useState("");
  const [apiErrors, setApiErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  // Password strength calculation
  useEffect(() => {
    const calculatePasswordStrength = (password) => {
      if (!password) return 0;

      let strength = 0;

      // Length check
      if (password.length >= 8) strength += 20;

      // Character variety checks
      if (/[A-Z]/.test(password)) strength += 20; // Has uppercase
      if (/[a-z]/.test(password)) strength += 20; // Has lowercase
      if (/[0-9]/.test(password)) strength += 20; // Has number
      if (/[^A-Za-z0-9]/.test(password)) strength += 20; // Has special char

      return strength;
    };

    setPasswordStrength(calculatePasswordStrength(formData.user.password));
  }, [formData.user.password]);

  // Field validation
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "user.email":
        if (!value) {
          error = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Email address is invalid";
        }
        break;

      case "user.first_name":
        if (!value) error = "First name is required";
        break;

      case "user.last_name":
        if (!value) error = "Last name is required";
        break;

      case "phone_number":
        if (value && !/^\+[0-9]{10,15}$/.test(value)) {
          error =
            "Phone number must be in international format (e.g., +380xxxxxxxxx)";
        }
        break;

      case "user.password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 8) {
          error = "Password must be at least 8 characters";
        } else if (passwordStrength < 60) {
          error = "Password is too weak";
        }
        break;

      case "user.confirm_password":
        const password =
          name === "user.confirm_password" ? formData.user.password : value;
        const confirmValue =
          name === "user.confirm_password"
            ? value
            : formData.user.confirm_password;

        if (!confirmValue) {
          error = "Please confirm your password";
        } else if (password !== confirmValue) {
          error = "Passwords do not match";
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Validate whole form
  const validateForm = () => {
    const newErrors = {};

    // Validate each field
    newErrors["user.email"] = validateField("user.email", formData.user.email);
    newErrors["user.first_name"] = validateField(
      "user.first_name",
      formData.user.first_name
    );
    newErrors["user.last_name"] = validateField(
      "user.last_name",
      formData.user.last_name
    );
    newErrors["phone_number"] = validateField(
      "phone_number",
      formData.phone_number
    );
    newErrors["user.password"] = validateField(
      "user.password",
      formData.user.password
    );
    newErrors["user.confirm_password"] = validateField(
      "user.confirm_password",
      formData.user.confirm_password
    );

    setFormErrors(newErrors);

    // Check if there are any errors
    return !Object.values(newErrors).some((error) => error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("user.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        user: {
          ...formData.user,
          [field]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Mark field as touched
    setTouched({
      ...touched,
      [name]: true,
    });

    // Real-time validation
    if (touched[name] || submissionAttempted) {
      const error = validateField(name, value);
      setFormErrors({
        ...formErrors,
        [name]: error,
      });

      // Special case for password & confirm password relationship
      if (name === "user.password" && formData.user.confirm_password) {
        setFormErrors((prev) => ({
          ...prev,
          "user.confirm_password": validateField(
            "user.confirm_password",
            formData.user.confirm_password
          ),
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;

    // Mark field as touched
    setTouched({
      ...touched,
      [name]: true,
    });

    // Validate on blur
    const error = validateField(name, e.target.value);
    setFormErrors({
      ...formErrors,
      [name]: error,
    });
  };

  const formatErrorMessage = (errorData) => {
    if (!errorData) return "An unknown error occurred";

    // Handle different error formats
    if (typeof errorData === "string") return errorData;

    if (errorData.detail) return errorData.detail;

    // Handle nested error objects
    const errorMessages = [];
    Object.keys(errorData).forEach((key) => {
      const value = errorData[key];
      if (Array.isArray(value)) {
        errorMessages.push(`${key}: ${value.join(", ")}`);
      } else if (typeof value === "object") {
        Object.keys(value).forEach((subKey) => {
          errorMessages.push(`${key}.${subKey}: ${value[subKey]}`);
        });
      } else {
        errorMessages.push(`${key}: ${value}`);
      }
    });

    return errorMessages.join("\n");
  };

  const handleNetworkError = (error) => {
    if (!navigator.onLine) {
      return "No internet connection. Please check your network settings.";
    }

    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    return "Network error occurred. Please try again later.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setApiErrors({});
    setSuccess(false);
    setSubmissionAttempted(true);

    // Validate all fields
    const isValid = validateForm();
    if (!isValid) {
      setGeneralError("Please fix the errors in the form before submitting.");
      return;
    }

    setLoading(true);

    try {
      // Create a clean payload
      const payload = {
        user: {
          email: formData.user.email,
          first_name: formData.user.first_name,
          last_name: formData.user.last_name,
          password: formData.user.password,
          confirm_password: formData.user.confirm_password,
        },
        phone_number: formData.phone_number,
        preferred_notification: formData.preferred_notification,
        status: formData.status,
      };

      console.log("Sending registration data:", payload);

      // Make the API call with proper error handling and timeout
      const response = await api.post("customers/", payload, {
        timeout: 15000, // 15 seconds timeout
      });

      console.log("API Registration Response:", response);
      setSuccess(true);

      // Only redirect if registration was successful
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Registration error:", err);

      // Handle different types of errors
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        const statusCode = err.response.status;
        const errorData = err.response.data;

        console.log("Error response:", err.response);

        switch (statusCode) {
          case 400:
            setApiErrors(errorData);
            setGeneralError(
              "Invalid data provided. Please check the form and try again."
            );
            break;
          case 401:
            setGeneralError(
              "Authentication required. This API endpoint may not support public registration."
            );
            break;
          case 403:
            setGeneralError("You don't have permission to register.");
            break;
          case 409:
            setGeneralError(
              "This account already exists. Please try logging in instead."
            );
            break;
          case 429:
            setGeneralError(
              "Too many registration attempts. Please try again later."
            );
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            setGeneralError("Server error. Please try again later.");
            break;
          default:
            setGeneralError(formatErrorMessage(errorData));
            setApiErrors(errorData);
        }
      } else if (err.request) {
        // Request was made but no response received
        setGeneralError(handleNetworkError(err));
      } else {
        // Something else caused the error
        setGeneralError(
          err.message || "An unexpected error occurred during registration."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Helper to determine field error state
  const getFieldError = (fieldPath) => {
    // First check form validation errors
    if (formErrors[fieldPath] && (touched[fieldPath] || submissionAttempted)) {
      return formErrors[fieldPath];
    }

    // Then check API errors
    if (apiErrors) {
      const keys = fieldPath.split(".");
      let current = apiErrors;

      for (const key of keys) {
        if (!current[key]) return "";
        current = current[key];
      }

      return Array.isArray(current) ? current.join(", ") : current;
    }

    return "";
  };

  // Helper to get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "error";
    if (passwordStrength < 80) return "warning";
    return "success";
  };

  // Password strength label
  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
              <PersonAddIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
              Create an Account
            </Typography>

            {generalError && (
              <Alert
                severity="error"
                sx={{ width: "100%", mb: 2 }}
                icon={<ErrorIcon fontSize="inherit" />}
              >
                {generalError}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
                Registration successful! Redirecting to login...
              </Alert>
            )}

            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ width: "100%" }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="user.first_name"
                    label="First Name"
                    name="user.first_name"
                    autoComplete="given-name"
                    value={formData.user.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={!!getFieldError("user.first_name")}
                    helperText={getFieldError("user.first_name")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="user.last_name"
                    label="Last Name"
                    name="user.last_name"
                    autoComplete="family-name"
                    value={formData.user.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={!!getFieldError("user.last_name")}
                    helperText={getFieldError("user.last_name")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="user.email"
                    label="Email Address"
                    name="user.email"
                    autoComplete="email"
                    type="email"
                    value={formData.user.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={!!getFieldError("user.email")}
                    helperText={getFieldError("user.email")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="phone_number"
                    label="Phone Number"
                    name="phone_number"
                    type="tel"
                    placeholder="+380xxxxxxxxx"
                    value={formData.phone_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={!!getFieldError("phone_number")}
                    helperText={
                      getFieldError("phone_number") ||
                      "Include country code (e.g., +380)"
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    id="preferred_notification"
                    label="Preferred Notification"
                    name="preferred_notification"
                    value={formData.preferred_notification}
                    onChange={handleChange}
                    variant="outlined"
                    error={!!getFieldError("preferred_notification")}
                    helperText={getFieldError("preferred_notification")}
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="sms">SMS</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="user.password"
                    label="Password"
                    name="user.password"
                    type={showPassword ? "text" : "password"}
                    value={formData.user.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={!!getFieldError("user.password")}
                    helperText={
                      getFieldError("user.password") ||
                      "Minimum 8 characters with mixed case, numbers and symbols"
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {formData.user.password && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={passwordStrength}
                          color={getPasswordStrengthColor()}
                          sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {getPasswordStrengthLabel()}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="user.confirm_password"
                    label="Confirm Password"
                    name="user.confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.user.confirm_password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    variant="outlined"
                    error={!!getFieldError("user.confirm_password")}
                    helperText={getFieldError("user.confirm_password")}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Register"}
              </Button>
              <Box textAlign="center">
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Register;
