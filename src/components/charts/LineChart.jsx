// src/components/charts/LineChart.jsx
import React from 'react';

export default function LineChart({ data = [], title = "Grafik Sensor", dataKey = "temperature_c", color = "#dc2626", unit = "" }) {
  // Jika data kosong
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-64">
        <h3 className="text-base font-black text-gray-900 mb-2">{title}</h3>
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Belum ada data riwayat untuk ditampilkan
        </div>
      </div>
    );
  }

  // Ekstraksi nilai dan normalisasi untuk koordinat SVG
  const values = data.map(item => Number(item[dataKey]) || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const width = 800;
  const height = 120;

  const points = data.map((item, index) => {
    const val = Number(item[dataKey]) || 0;
    const x = (index / (data.length - 1 || 1)) * width;
    // Normalisasi posisi Y (SVG sumbu Y terbalik)
    const y = height - ((val - minVal) / range) * (height - 20) - 10;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const latestValue = values[values.length - 1] ?? 0;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-black text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">Total {data.length} titik data terekam</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-gray-900">{latestValue} {unit}</span>
          <span className="block text-[10px] text-gray-400 font-bold uppercase">Terakhir</span>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full h-36 bg-[#fcfcfb] rounded-2xl border border-gray-100 p-3 flex flex-col justify-between">
        <div className="absolute left-2 top-2 text-[9px] font-bold text-gray-400">
          Max: {maxVal.toFixed(1)} {unit}
        </div>
        <div className="absolute left-2 bottom-2 text-[9px] font-bold text-gray-400">
          Min: {minVal.toFixed(1)} {unit}
        </div>

        <div className="relative z-10 w-full h-24 flex items-center pl-12 pr-2">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <polyline 
              fill="none" 
              stroke={color} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {data.map((_, index) => {
              const pts = points.split(" ");
              if (!pts[index]) return null;
              const [cx, cy] = pts[index].split(",");
              return (
                <circle 
                  key={index} 
                  cx={cx} 
                  cy={cy} 
                  r="3" 
                  fill="white" 
                  stroke={color} 
                  strokeWidth="2" 
                />
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between pl-12 pr-2 text-[9px] font-bold text-gray-400 border-t border-gray-100 pt-1">
          <span>Awal Sesi</span>
          <span>Waktu Nyata (Real-time)</span>
        </div>
      </div>
    </div>
  );
}