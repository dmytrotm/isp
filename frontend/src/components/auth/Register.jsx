import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Avatar, Link, Paper, Box, Typography, Container } from "@mui/material";
import { useRegister } from "../../hooks/useRegister";
import RegisterForm from "./RegisterForm";
import { useToast } from "../../context/ToastContext";
import { useEffect } from "react";

const Register = () => {
  const hookState = useRegister();
  const { showToast } = useToast();

  useEffect(() => {
    if (hookState.generalError) {
      showToast(hookState.generalError, "error");
    }
  }, [hookState.generalError, showToast]);

  useEffect(() => {
    if (hookState.success) {
      showToast("Registration successful! Redirecting to login...", "success");
    }
  }, [hookState.success, showToast]);

  return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "background.default" }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 0.5, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}><PersonAddIcon /></Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>Create an Account</Typography>

            <RegisterForm hookState={hookState} />
            <Box textAlign="center">
              <Link component={RouterLink} to="/login" variant="body2">Already have an account? Sign in</Link>
            </Box>
          </Paper>
        </Container>
      </Box>
  );
};
export default Register;
