import { Visibility, VisibilityOff } from '@mui/icons-material';
import React from 'react';
import { Grid, TextField, MenuItem, InputAdornment, IconButton, Box, LinearProgress, Typography, Button, CircularProgress } from '@mui/material';

export default function RegisterForm({ hookState }) {
  const {
    formData, handleChange, handleBlur, handleSubmit, loading,
    showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    passwordStrength, getFieldError
  } = hookState;

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "error";
    if (passwordStrength < 80) return "warning";
    return "success";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth id="user.first_name" label="First Name" name="user.first_name" autoComplete="given-name" value={formData.user.first_name} onChange={handleChange} onBlur={handleBlur} variant="outlined" error={!!getFieldError("user.first_name")} helperText={getFieldError("user.first_name")} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth id="user.last_name" label="Last Name" name="user.last_name" autoComplete="family-name" value={formData.user.last_name} onChange={handleChange} onBlur={handleBlur} variant="outlined" error={!!getFieldError("user.last_name")} helperText={getFieldError("user.last_name")} />
        </Grid>
        <Grid item xs={12}>
          <TextField required fullWidth id="user.email" label="Email Address" name="user.email" autoComplete="email" type="email" value={formData.user.email} onChange={handleChange} onBlur={handleBlur} variant="outlined" error={!!getFieldError("user.email")} helperText={getFieldError("user.email")} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth id="phone_number" label="Phone Number" name="phone_number" type="tel" placeholder="+380xxxxxxxxx" value={formData.phone_number} onChange={handleChange} onBlur={handleBlur} variant="outlined" error={!!getFieldError("phone_number")} helperText={getFieldError("phone_number") || "Include country code (e.g., +380)"} />
        </Grid>
        <Grid item xs={12}>
          <TextField select fullWidth id="preferred_notification" label="Preferred Notification" name="preferred_notification" value={formData.preferred_notification} onChange={handleChange} variant="outlined" error={!!getFieldError("preferred_notification")} helperText={getFieldError("preferred_notification")}>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField required fullWidth id="user.password" label="Password" name="user.password" type={showPassword ? "text" : "password"} value={formData.user.password} onChange={handleChange} onBlur={handleBlur} variant="outlined" error={!!getFieldError("user.password")} helperText={getFieldError("user.password") || "Minimum 8 characters with mixed case, numbers and symbols"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} onMouseDown={(e) => e.preventDefault()} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {formData.user.password && (
            <Box sx={{ width: "100%", mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <LinearProgress variant="determinate" value={passwordStrength} color={getPasswordStrengthColor()} sx={{ flexGrow: 1, mr: 1 }} />
                <Typography variant="caption" color="text.secondary">{getPasswordStrengthLabel()}</Typography>
              </Box>
            </Box>
          )}
        </Grid>
        <Grid item xs={12}>
          <TextField required fullWidth id="user.confirm_password" label="Confirm Password" name="user.confirm_password" type={showConfirmPassword ? "text" : "password"} value={formData.user.confirm_password} onChange={handleChange} onBlur={handleBlur} variant="outlined" error={!!getFieldError("user.confirm_password")} helperText={getFieldError("user.confirm_password")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} onMouseDown={(e) => e.preventDefault()} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : "Register"}
      </Button>
    </Box>
  );
}
