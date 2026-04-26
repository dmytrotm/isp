import { useState, useEffect } from 'react';
import api from '../services/api';

export function useDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/manager/');
            setData(res.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);
    
    const markRecommendationReviewed = async (id) => {
        try {
            await api.patch(`/recommendations/${id}/`, 
                { is_reviewed: true }
            );
            setData(prev => ({
                ...prev,
                pending_recommendations: prev.pending_recommendations
                    .filter(r => r.id !== id)
            }));
            return true;
        } catch (err) {
            console.error('Error marking recommendation as reviewed:', err);
            return false;
        }
    };
    
    return { data, loading, error, markRecommendationReviewed, refresh: fetchDashboardData };
}
