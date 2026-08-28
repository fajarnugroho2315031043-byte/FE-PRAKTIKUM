// src/components/status/NodeStatusBadge.jsx
import React from 'react';

export default function NodeStatusBadge({ isOnline = true, lastUpdate = null }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-xs font-bold text-gray-700">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {lastUpdate && (
        <span className="text-[10px] text-gray-400 font-medium border-l border-gray-200 pl-2">
          {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}