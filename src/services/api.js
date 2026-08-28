// src/services/api.js
const API_BASE_URL = '/api';

export const fetchSensorData = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/sensors?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    throw error;
  }
};

export const fetchAnalytics = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};

export const fetchActiveNodes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/sensors/nodes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching active nodes:", error);
    throw error;
  }
};