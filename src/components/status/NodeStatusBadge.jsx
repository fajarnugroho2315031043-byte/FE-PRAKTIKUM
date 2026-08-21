// Indikator Status Koneksi Node (Online/Offline)
import React from 'react';

export const NodeStatusBadge = ({ isOnline }) => (
  <span className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
    {isOnline ? 'Online' : 'Offline'}
  </span>
);
