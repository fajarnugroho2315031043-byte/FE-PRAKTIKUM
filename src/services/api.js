// src/services/api.js

const API_BASE_URL = '/api';

/**
 * Helper untuk membuat query string.
 */
const buildQueryParams = (filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ''
    )
  );

  return new URLSearchParams(
    cleanFilters
  ).toString();
};

/**
 * Fetch data sensor mentah.
 *
 * Endpoint:
 * GET /api/sensors
 */
export const fetchSensorData = async (
  filters = {}
) => {
  try {
    const params =
      buildQueryParams(filters);

    const url = params
      ? `${API_BASE_URL}/sensors?${params}`
      : `${API_BASE_URL}/sensors`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}`
      );
    }

    const result =
      await response.json();

    return result;
  } catch (error) {
    console.error(
      'Error fetching sensor data:',
      error
    );

    throw error;
  }
};

/**
 * Fetch analytics dashboard.
 *
 * Endpoint:
 * GET /api/analytics/dashboard
 */
export const fetchAnalytics = async (
  filters = {}
) => {
  try {
    const params =
      buildQueryParams(filters);

    const url = params
      ? `${API_BASE_URL}/analytics/dashboard?${params}`
      : `${API_BASE_URL}/analytics/dashboard`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}`
      );
    }

    const result =
      await response.json();

    return result;
  } catch (error) {
    console.error(
      'Error fetching analytics:',
      error
    );

    throw error;
  }
};

/**
 * Fetch Business Intelligence dashboard.
 *
 * Endpoint:
 * GET /api/bi
 *
 * Digunakan oleh:
 * - Kombucha
 * - Eco Enzyme
 * - Fruit Enzyme
 */
export const fetchBI = async (
  filters = {}
) => {
  try {
    const params =
      buildQueryParams(filters);

    const url = params
      ? `${API_BASE_URL}/bi?${params}`
      : `${API_BASE_URL}/bi`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}`
      );
    }

    const result =
      await response.json();

    return result;
  } catch (error) {
    console.error(
      'Error fetching BI data:',
      error
    );

    throw error;
  }
};

/**
 * Fetch node yang aktif.
 *
 * Endpoint:
 * GET /api/sensors/nodes
 */
export const fetchActiveNodes =
  async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sensors/nodes`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`
        );
      }

      const result =
        await response.json();

      return result?.data || [];
    } catch (error) {
      console.error(
        'Error fetching active nodes:',
        error
      );

      throw error;
    }
  };