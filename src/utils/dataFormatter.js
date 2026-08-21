// Filtering Outlier & Formatting Data
export const formatSensorValue = (val, decimals = 2) => {
  if (val === null || val === undefined) return '-';
  return Number(val).toFixed(decimals);
};
