import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export function useRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user: { email: "", first_name: "", last_name: "", password: "", confirm_password: "" },
    phone_number: "", preferred_notification: "email", addresses: [],
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [generalError, setGeneralError] = useState("");
  const [apiErrors, setApiErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  useEffect(() => {
    const calcStrength = (pwd) => {
      if (!pwd) return 0;
      let s = 0;
      if (pwd.length >= 8) s += 20;
      if (/[A-Z]/.test(pwd)) s += 20;
      if (/[a-z]/.test(pwd)) s += 20;
      if (/[0-9]/.test(pwd)) s += 20;
      if (/[^A-Za-z0-9]/.test(pwd)) s += 20;
      return s;
    };
    setPasswordStrength(calcStrength(formData.user.password));
  }, [formData.user.password]);

  const validateField = (name, value) => {
    let err = "";
    switch (name) {
      case "user.email":
        if (!value) err = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value)) err = "Email address is invalid";
        break;
      case "user.first_name": if (!value) err = "First name is required"; break;
      case "user.last_name": if (!value) err = "Last name is required"; break;
      case "phone_number":
        if (value && !/^\+[0-9]{10,15}$/.test(value)) err = "Phone number must be in international format (e.g., +380xxxxxxxxx)";
        break;
      case "user.password":
        if (!value) err = "Password is required";
        else if (value.length < 8) err = "Password must be at least 8 characters";
        else if (passwordStrength < 60) err = "Password is too weak";
        break;
      case "user.confirm_password":
        const pwd = name === "user.confirm_password" ? formData.user.password : value;
        const confirmValue = name === "user.confirm_password" ? value : formData.user.confirm_password;
        if (!confirmValue) err = "Please confirm your password";
        else if (pwd !== confirmValue) err = "Passwords do not match";
        break;
      default: break;
    }
    return err;
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors["user.email"] = validateField("user.email", formData.user.email);
    newErrors["user.first_name"] = validateField("user.first_name", formData.user.first_name);
    newErrors["user.last_name"] = validateField("user.last_name", formData.user.last_name);
    newErrors["phone_number"] = validateField("phone_number", formData.phone_number);
    newErrors["user.password"] = validateField("user.password", formData.user.password);
    newErrors["user.confirm_password"] = validateField("user.confirm_password", formData.user.confirm_password);
    
    setFormErrors(newErrors);
    return !Object.values(newErrors).some((err) => err);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("user.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({ ...prev, user: { ...prev.user, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setTouched(prev => ({ ...prev, [name]: true }));

    if (touched[name] || submissionAttempted) {
      setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
      if (name === "user.password" && formData.user.confirm_password) {
        setFormErrors(prev => ({ ...prev, "user.confirm_password": validateField("user.confirm_password", formData.user.confirm_password) }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setFormErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const formatErrorMessage = (errorData) => {
    if (!errorData) return "An unknown error occurred";
    if (typeof errorData === "string") return errorData;
    if (errorData.detail) return errorData.detail;
    const msg = [];
    Object.keys(errorData).forEach((key) => {
      const val = errorData[key];
      if (Array.isArray(val)) msg.push(`${key}: ${val.join(", ")}`);
      else if (typeof val === "object") {
        Object.keys(val).forEach((subKey) => msg.push(`${key}.${subKey}: ${val[subKey]}`));
      } else msg.push(`${key}: ${val}`);
    });
    return msg.join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(""); setApiErrors({}); setSuccess(false); setSubmissionAttempted(true);

    if (!validateForm()) {
      setGeneralError("Please fix the errors in the form before submitting.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        user: { ...formData.user },
        phone_number: formData.phone_number,
        preferred_notification: formData.preferred_notification,
      };
      await api.post("customers/", payload, { timeout: 15000 });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 400) { setApiErrors(data); setGeneralError("Invalid data provided."); }
        else if (status === 401) setGeneralError("Authentication required.");
        else if (status === 403) setGeneralError("You don't have permission to register.");
        else if (status === 409) setGeneralError("This account already exists.");
        else if (status === 429) setGeneralError("Too many registration attempts.");
        else if (status >= 500) setGeneralError("Server error.");
        else { setGeneralError(formatErrorMessage(data)); setApiErrors(data); }
      } else if (err.request) {
        setGeneralError(!navigator.onLine ? "No internet connection." : "Network error.");
      } else {
        setGeneralError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldPath) => {
    if (formErrors[fieldPath] && (touched[fieldPath] || submissionAttempted)) return formErrors[fieldPath];
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

  return {
    formData, handleChange, handleBlur, handleSubmit,
    generalError, success, loading,
    showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword,
    passwordStrength, getFieldError
  };
}
