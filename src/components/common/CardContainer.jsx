// Container Card Wrapper
import React from 'react';

export const CardContainer = ({ title, children }) => (
  <div className="card-container">
    <h3>{title}</h3>
    {children}
  </div>
);
