import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";
import api from "../../services/api";

// Tab Components
import SupportTicketsTab from "./tabs/SupportTicketsTab";
import ConnectionRequestsTab from "./tabs/ConnectionRequestsTab";

import {
  Container,
  Box,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  AppBar,
} from "@mui/material";
import { LogOut, Home } from "lucide-react";
import { 
  SupportAgent as SupportIcon,
  Engineering as TechIcon 
} from "@mui/icons-material";

const TechnicianDashboard = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  const fetchProfile = async () => {
    try {
      const userData = await AuthService.getCurrentUser();

      if (userData) {
        setProfile({
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch technician profile:", err);
      setError("Failed to load technician profile");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", mt: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>Technician Dashboard</Typography>
          <Typography variant="subtitle1">
            Welcome, {profile.first_name} {profile.last_name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <button onClick={() => navigate("/")} className="flex items-center text-gray-500 hover:text-gray-700">
            <Home className="h-4 w-4 mr-1" /> Home
          </button>
          <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-gray-700">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </button>
        </Box>
      </Box>

      <AppBar position="static" color="default" elevation={1} sx={{ mb: 3, borderRadius: 1 }}>
        <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="My Support Tickets" icon={<SupportIcon />} iconPosition="start" />
          <Tab label="Installation Requests" icon={<TechIcon />} iconPosition="start" />
        </Tabs>
      </AppBar>

      {activeTab === 0 && <SupportTicketsTab />}
      {activeTab === 1 && <ConnectionRequestsTab />}
    </Container>
  );
};

export default TechnicianDashboard;
