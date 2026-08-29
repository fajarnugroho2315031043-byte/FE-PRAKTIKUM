// src/components/charts/LineChart.jsx
import React, { useMemo } from "react";

export default function LineChart({
  data = [],
  title = "Grafik Sensor",
  dataKey = "temperature_c",
  color = "#16a34a",
  unit = "",
}) {
  // Data kosong
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-black text-gray-900">
          {title}
        </h3>

        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
          Belum ada data riwayat untuk ditampilkan
        </div>
      </div>
    );
  }

  // Normalisasi data
  const chartData = useMemo(() => {
    return data
      .map((item) => ({
        value: Number(item[dataKey]),
        timestamp:
          item.timestamp ||
          item.created_at ||
          item.createdAt ||
          item.time ||
          item.datetime ||
          null,
      }))
      .filter((item) => Number.isFinite(item.value));
  }, [data, dataKey]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-black text-gray-900">
          {title}
        </h3>

        <div className="h-64 flex items-center justify-center text-xs text-gray-400">
          Data sensor tidak valid
        </div>
      </div>
    );
  }

  // Nilai sensor
  const values = chartData.map((item) => item.value);

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const latestValue = values[values.length - 1];

  // Berikan sedikit ruang atas dan bawah grafik
  const paddingValue = range * 0.1;

  const chartMin = minVal - paddingValue;
  const chartMax = maxVal + paddingValue;
  const chartRange = chartMax - chartMin || 1;

  // Ukuran SVG
  const width = 1200;
  const height = 320;

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  // Koordinat grafik
  const coordinates = chartData.map((item, index) => {
    const x =
      paddingLeft +
      (index / Math.max(chartData.length - 1, 1)) * graphWidth;

    const y =
      paddingTop +
      (1 - (item.value - chartMin) / chartRange) * graphHeight;

    return {
      x,
      y,
      value: item.value,
      timestamp: item.timestamp,
    };
  });

  // Garis grafik
  const points = coordinates
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  // Format waktu
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Label waktu hanya beberapa titik agar tidak penuh
  const labelIndexes = [];

  const desiredLabels = 7;

  if (chartData.length === 1) {
    labelIndexes.push(0);
  } else {
    for (let i = 0; i < desiredLabels; i++) {
      const index = Math.round(
        (i / (desiredLabels - 1)) * (chartData.length - 1)
      );

      if (!labelIndexes.includes(index)) {
        labelIndexes.push(index);
      }
    }
  }

  // Garis grid horizontal
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = paddingTop + ratio * graphHeight;

    const value = chartMax - ratio * chartRange;

    return {
      y,
      value,
    };
  });

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-base font-black text-gray-900">
            {title}
          </h3>

          <p className="text-xs text-gray-400 mt-1">
            Data monitoring ({chartData.length.toLocaleString("id-ID")} titik)
          </p>
        </div>

        <div className="text-right">
          <div
            className="text-xl font-black"
            style={{ color }}
          >
            {latestValue.toFixed(2)} {unit}
          </div>

          <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide">
            Terbaru
          </span>
        </div>
      </div>

      {/* CHART */}
      <div className="relative w-full h-[340px] bg-[#fcfcfb] rounded-2xl border border-gray-100 overflow-hidden">

        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >

          {/* GRID */}
          {gridLines.map((line, index) => (
            <g key={index}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={line.y}
                y2={line.y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 5"
              />

              <text
                x={paddingLeft - 10}
                y={line.y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#9ca3af"
              >
                {line.value.toFixed(1)}
              </text>
            </g>
          ))}

          {/* AXIS */}
          <line
            x1={paddingLeft}
            x2={width - paddingRight}
            y1={height - paddingBottom}
            y2={height - paddingBottom}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* GRAPH */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* LABEL WAKTU */}
          {labelIndexes.map((index) => {
            const point = coordinates[index];

            if (!point) return null;

            return (
              <text
                key={index}
                x={point.x}
                y={height - 18}
                textAnchor="middle"
                fontSize="11"
                fill="#9ca3af"
                fontWeight="600"
              >
                {formatTime(point.timestamp) || `Data ${index + 1}`}
              </text>
            );
          })}
        </svg>

        {/* INTERVAL */}
        <div className="absolute top-3 right-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-lg border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400">
            Interval 30 detik
          </span>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-gray-400">
        <span>
          Min: {minVal.toFixed(2)} {unit}
        </span>

        <span>
          {chartData.length.toLocaleString("id-ID")} data
        </span>

        <span>
          Max: {maxVal.toFixed(2)} {unit}
        </span>
      </div>
    </div>
  );
}