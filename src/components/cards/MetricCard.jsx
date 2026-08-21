// Card Data Real-time (Suhu, pH, Gas, Tekanan, TDS)
import React from 'react';

export const MetricCard = ({ label, value, unit }) => (
  <div className="metric-card">
    <span>{label}</span>
    <h4>{value} {unit}</h4>
  </div>
);
