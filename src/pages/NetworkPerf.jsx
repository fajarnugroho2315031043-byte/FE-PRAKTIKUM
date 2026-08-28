import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Bell, Menu, Wifi, Activity, ArrowDownUp, ShieldAlert, Clock, ChevronDown,
  Layers, Database, CheckCircle2, Server
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import { fetchSensorData } from '../services/api'; // ← ganti dari fetchAnalytics

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

// =====================================================================
// HELPER: Hitung metrik jaringan dari data raw sensor
// =====================================================================
const computeNetworkMetrics = (rows) => {
  if (!rows || rows.length === 0) return {};

  // RSSI — rata-rata
  const rssiValues = rows.map(r => Number(r.rssi_dbm)).filter(v => !isNaN(v));
  const avgRssi = rssiValues.length > 0
    ? rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length
    : null;

  // Latency — selisih received_at dan timestamp (ms)
  const latencies = rows
    .filter(r => r.received_at && r.timestamp)
    .map(r => new Date(r.received_at) - new Date(r.timestamp))
    .filter(v => v >= 0);
  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : null;

  // Jitter — rata-rata selisih antar latency berurutan
  const jitterValues = latencies.slice(1).map((v, i) => Math.abs(v - latencies[i]));
  const avgJitter = jitterValues.length > 0
    ? jitterValues.reduce((a, b) => a + b, 0) / jitterValues.length
    : null;

  // Packet loss — hitung gap sequence yang hilang
  const sequences = rows.map(r => Number(r.sequence)).filter(v => !isNaN(v)).sort((a, b) => a - b);
  let lostPackets = 0;
  for (let i = 1; i < sequences.length; i++) {
    const gap = sequences[i] - sequences[i - 1] - 1;
    if (gap > 0) lostPackets += gap;
  }
  const expectedTotal = sequences.length + lostPackets;
  const packetLossPct = expectedTotal > 0 ? (lostPackets / expectedTotal) * 100 : 0;

  return {
    avgRssi,
    avgLatency,
    avgJitter,
    lostPackets,
    packetLossPct,
    totalRows: rows.length,
  };
};

export default function NetworkPerf() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState("");

  // ← State langsung dari data raw
  const [rows, setRows] = useState([]);
  const [latest, setLatest] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State per-node untuk tabel status
  const [nodeLatest, setNodeLatest] = useState({
    KOMBUCHA_01: null,
    ECO_02: null,
    FRUIT_03: null,
  });

  const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 10000;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // Fetch data utama (bisa difilter per node atau semua)
  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        const filters = selectedNode ? { node_id: selectedNode, limit: 100 } : { limit: 100 };
        const result = await fetchSensorData(filters);
        const data = result?.data || [];

        // Backend DESC → index [0] = terbaru
        setLatest(data[0] || {});
        // Balik untuk kalkulasi berurutan (ASC)
        setRows([...data].reverse());
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNetworkData();
    const intervalId = setInterval(loadNetworkData, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [selectedNode, POLLING_INTERVAL]);

  // Fetch data terbaru per node untuk tabel status
  useEffect(() => {
    const loadNodeStatus = async () => {
      try {
        const [k, e, f] = await Promise.all([
          fetchSensorData({ node_id: "KOMBUCHA_01", limit: 1 }).catch(() => null),
          fetchSensorData({ node_id: "ECO_02",      limit: 1 }).catch(() => null),
          fetchSensorData({ node_id: "FRUIT_03",    limit: 1 }).catch(() => null),
        ]);
        setNodeLatest({
          KOMBUCHA_01: k?.data?.[0] || null,
          ECO_02:      e?.data?.[0] || null,
          FRUIT_03:    f?.data?.[0] || null,
        });
      } catch (err) {
        console.error("Gagal fetch node status:", err);
      }
    };

    loadNodeStatus();
    const intervalId = setInterval(loadNodeStatus, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [POLLING_INTERVAL]);

  // Hitung metrik dari data raw
  const metrics = computeNetworkMetrics(rows);

  const fmt = (val, decimals = 1) =>
    loading ? "..." : val !== null && val !== undefined ? Number(val).toFixed(decimals) : "-";

  const metricSpecs = [
    { metric: "RSSI",                          source: "rssi_dbm",                    function: "Kekuatan sinyal" },
    { metric: "Packet Loss",                   source: "sequence",                    function: "Mengetahui paket yang hilang" },
    { metric: "Latency / Delay",               source: "timestamp + received_at",     function: "Waktu tempuh data sensor → backend" },
    { metric: "Jitter",                        source: "timestamp + received_at",     function: "Variasi delay antar paket" },
    { metric: "Packet Rate",                   source: "sequence / timestamp",        function: "Berapa paket diterima per satuan waktu" },
    { metric: "Inter-arrival Time",            source: "timestamp",                   function: "Jarak waktu antar paket sensor" },
    { metric: "Reception Rate / Delivery Rate",source: "sequence",                    function: "Persentase paket yang berhasil diterima" },
    { metric: "Duplicate Packet",              source: "sequence",                    function: "Paket yang diterima lebih dari sekali" },
    { metric: "Out-of-Order Packet",           source: "sequence",                    function: "Paket datang tidak berurutan" },
    { metric: "Connection/Node Availability",  source: "keberadaan data per node_id", function: "Menilai apakah node aktif/terhubung" },
    { metric: "Data Freshness",                source: "received_at",                 function: "Seberapa baru data yang diterima" },
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar 
        isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4 truncate">
            <button 
              className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="truncate">
              <h1 className="text-base sm:text-xl font-black text-gray-900 truncate">Performa Jaringan IoT</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading ? "Memuat data..." : error ? `Error: ${error}` : "Pantau latensi, RSSI, jitter, dan packet loss secara real-time"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">
              <Clock size={14} className="text-blue-600" />
              <span>
                {latest?.timestamp
                  ? new Date(latest.timestamp).toLocaleString('id-ID')
                  : "Sinkronisasi..."}
              </span>
            </div>

            <div className="relative">
              <select 
                value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)}
                className="appearance-none bg-blue-50 text-blue-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-blue-200 outline-none cursor-pointer"
              >
                <option value="">Semua Node</option>
                <option value="KOMBUCHA_01">KOMBUCHA_01</option>
                <option value="ECO_02">ECO_02</option>
                <option value="FRUIT_03">FRUIT_03</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-blue-600 pointer-events-none" />
            </div>

            <button className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            
            {/* GRID KARTU METRIK JARINGAN */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Sinyal (RSSI)",   value: `${fmt(metrics.avgRssi)} dBm`,         status: "Rata-rata",    icon: Wifi,        color: "text-blue-600"   },
                { label: "Latensi",         value: `${fmt(metrics.avgLatency)} ms`,        status: "Rata-rata",    icon: Activity,    color: "text-green-600"  },
                { label: "Packet Loss",     value: `${fmt(metrics.packetLossPct, 2)}%`,    status: `${loading ? "..." : metrics.lostPackets ?? 0} hilang`, icon: ShieldAlert, color: "text-purple-600" },
                { label: "Jitter",          value: `${fmt(metrics.avgJitter)} ms`,         status: "Variasi Delay",icon: Layers,      color: "text-amber-500"  },
                { label: "Total Record",    value: `${loading ? "..." : rows.length} pkt`, status: "Terekam",     icon: ArrowDownUp, color: "text-indigo-600" },
                { label: "Data Freshness",  value: latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString('id-ID') : "-", status: "Real-time", icon: Database, color: "text-teal-600" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] sm:text-xs font-bold text-gray-400 truncate">{item.label}</span>
                    <item.icon size={16} className={`${item.color} flex-shrink-0`} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-gray-900">{item.value}</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.status}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* TABEL STATUS NODE — data realtime per node */}
            <motion.div variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-black text-gray-900 mb-4">Status Perangkat & Node Terhubung</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Node ID</th>
                      <th className="p-3">Batch ID</th>
                      <th className="p-3">RSSI Terakhir</th>
                      <th className="p-3">Data Terakhir Masuk</th>
                      <th className="p-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {[
                      { nodeId: "KOMBUCHA_01", data: nodeLatest.KOMBUCHA_01 },
                      { nodeId: "ECO_02",      data: nodeLatest.ECO_02      },
                      { nodeId: "FRUIT_03",    data: nodeLatest.FRUIT_03    },
                    ].map((row, i) => {
                      const d = row.data;
                      const isOnline = !!d?.timestamp;
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 font-bold text-gray-800">{row.nodeId}</td>
                          <td className="p-3 text-gray-500 font-mono">{d?.batch_id ?? "-"}</td>
                          <td className="p-3">{d?.rssi_dbm != null ? `${d.rssi_dbm} dBm` : "-"}</td>
                          <td className="p-3">{d?.timestamp ? new Date(d.timestamp).toLocaleString('id-ID') : "-"}</td>
                          <td className="p-3">
                            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* TABEL SPESIFIKASI METRIK */}
            <motion.div variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Server size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-gray-900">Spesifikasi Parameter & Sumber Data Metrik</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-blue-50/60 text-blue-900 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Metrik</th>
                      <th className="p-3">Sumber Data</th>
                      <th className="p-3 rounded-r-xl">Fungsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {metricSpecs.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3 font-bold text-gray-900">{item.metric}</td>
                        <td className="p-3 font-mono text-blue-700">{item.source}</td>
                        <td className="p-3 text-gray-600">{item.function}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}