// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ApiTester from "./components/debug/ApiTester";
import Homelanding from "./components/Home";

import CustomerDashboard from "./components/customer/CustomerDashboard";
import Payment from "./components/customer/Payment";
import SupportTicket from "./components/customer/SupportTicket";
import Contracts from "./components/customer/Contracts";
import ContractDetails from "./components/customer/ContractDetails";
import NetworkUsage from "./components/customer/NetworkUsage";
import ConnectionRequest from "./components/customer/ConnectionRequest";

// Add these imports (create components if missing)
import ManagerDashboard from "./components/employee/ManagerDashboard";
import SupportDashboard from "./components/employee/SupportDashboard";
import AdminDashboard from "./components/employee/AdminDashboard";

const DashboardRouter = () => {
  const {
    loading,
    isAuthenticated,
    isCustomer,
    isManager,
    isSupport,
    isAdmin,
  } = useAuth();

  if (loading) return null; // or <Loader /> if you have one

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (isCustomer) return <CustomerDashboard />;
  if (isManager) return <ManagerDashboard />;
  if (isSupport) return <SupportDashboard />;
  if (isAdmin) return <AdminDashboard />;

  return <Navigate to="/not-found" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/debug/api-test" element={<ApiTester />} />
          <Route path="/" element={<Homelanding />} />

          {/* Authenticated routes */}
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/make-payment" element={<Payment />} />
          <Route path="/support/new" element={<SupportTicket />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id" element={<ContractDetails />} />
          <Route path="/network-usage" element={<NetworkUsage />} />
          <Route path="/connection-request" element={<ConnectionRequest />} />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
