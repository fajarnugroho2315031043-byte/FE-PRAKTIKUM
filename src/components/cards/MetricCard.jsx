// src/components/cards/MetricCard.jsx
import React from 'react';

export default function MetricCard({ label, value, unit, icon: Icon, color = "text-gray-900" }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-400 truncate">{label}</span>
        {Icon && <Icon size={16} className={`${color} flex-shrink-0`} />}
      </div>
      <div>
        <h4 className="text-lg font-black text-gray-900">{value} <span className="text-xs font-normal text-gray-500">{unit}</span></h4>
      </div>
    </div>
  );
}