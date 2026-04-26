import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import api from '../services/api';

export function useManagerDashboard(navigate) {
  const [managerProfile, setManagerProfile] = useState({});
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [financialSummary, setFinancialSummary] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  const { enqueueSnackbar } = useSnackbar();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const managerResponse = await api.get("/auth/user/", { headers: { Authorization: `Bearer ${token}` } });
      if (managerResponse.data) {
        setManagerProfile({
          first_name: managerResponse.data.first_name,
          last_name: managerResponse.data.last_name,
          email: managerResponse.data.email,
        });
      }

      const statsResponse = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
      setDashboardStats(statsResponse.data.data || statsResponse.data);

      if (tabValue === 6) {
        const fRes = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
        setFinancialSummary(fRes.data);
        const pRes = await api.get("/dashboard/manager/", { headers: { Authorization: `Bearer ${token}` } });
        setPerformanceMetrics(pRes.data);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return {
    managerProfile, dashboardStats, loading, error, tabValue, setTabValue, handleTabChange,
    financialSummary, performanceMetrics
  };
}
