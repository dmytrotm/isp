import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import AuthService from "../../services/auth.service";
import api from "../../services/api";

// Tab Components
import SupportTicketsTab from "./tabs/SupportTicketsTab";

import {
  Container,
  Box,
  Typography,
  Tab,
  CircularProgress,
  AppBar,
} from "@mui/material";
import { LogOut } from "lucide-react";
import { SupportAgent as SupportIcon } from "@mui/icons-material";

const SupportDashboard = () => {
  const [supportProfile, setSupportProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const fetchSupportProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const supportResponse = await api.get("/auth/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (supportResponse.data) {
        setSupportProfile({
          first_name: supportResponse.data.first_name,
          last_name: supportResponse.data.last_name,
          email: supportResponse.data.email,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch support profile:", err);
      setError("Failed to load support profile");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportProfile();
  }, []);

  if (loading) {
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
    <Container maxWidth="xl">
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Support Dashboard
          </Typography>
          <Typography variant="subtitle1">
            Welcome, {supportProfile.first_name} {supportProfile.last_name}
          </Typography>
        </Box>
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </button>
      </Box>

      <AppBar position="static" color="default" elevation={1} sx={{ mb: 3 }}>
        <Tab
          label="Support Tickets"
          icon={<SupportIcon />}
          iconPosition="start"
        />
      </AppBar>

      {/* Render the appropriate tab content */}
      <SupportTicketsTab />
    </Container>
  );
};

export default SupportDashboard;
