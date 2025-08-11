import { useState, useEffect } from 'react';
import { api, apiHelpers } from '../api/apiclient';

// Custom hook for fetching data
export const useApiData = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await endpoint();
        setData(response.data);
      } catch (err) {
        setError(apiHelpers.handleError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
};

// Hook for basic API operations
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiCall, onSuccess) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      if (onSuccess) onSuccess(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = apiHelpers.handleError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error };
};

// Example usage hooks
export const useProducts = () => {
  return useApiData(() => api.products.getAll());
};

export const useUserProfile = (userId) => {
  return useApiData(() => api.users.getProfile(userId), [userId]);
};