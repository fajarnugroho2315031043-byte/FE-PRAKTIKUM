import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Bell, Menu, Wifi, Activity, ArrowDownUp, ShieldAlert, Clock, ChevronDown,
  Layers, Database, CheckCircle2, Server
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import { fetchAnalytics } from '../services/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function NetworkPerf() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState(""); // Kosong = Semua Node / Gateway

  // State untuk data jaringan dari Backend
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const POLLING_INTERVAL = import.meta.env.VITE_POLLING_INTERVAL || 10000;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // Fetch data analytics jaringan dari backend secara berkala
  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        const filters = selectedNode ? { node_id: selectedNode } : {};
        const result = await fetchAnalytics(filters);
        setNetworkData(result);
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
  }, [selectedNode]);

  // Ekstraksi data dari respons backend
  const net = networkData?.network || {};
  const signal = net.signal || {};
  const delay = net.delay || {};
  const jitter = net.jitter || {};
  const packetLoss = net.packet_loss || {};
  const latest = networkData?.kpi?.latest_reading || {};

  // Data Referensi Spesifikasi Metrik Jaringan
  const metricSpecs = [
    { metric: "RSSI", source: "rssi_dbm", function: "Kekuatan sinyal" },
    { metric: "Packet Loss", source: "sequence", function: "Mengetahui paket yang hilang" },
    { metric: "Latency / Delay", source: "timestamp + received_at", function: "Waktu tempuh data sensor → backend" },
    { metric: "Jitter", source: "timestamp + received_at", function: "Variasi delay antar paket" },
    { metric: "Packet Rate", source: "sequence / timestamp", function: "Berapa paket diterima per satuan waktu" },
    { metric: "Inter-arrival Time", source: "timestamp", function: "Jarak waktu antar paket sensor" },
    { metric: "Reception Rate / Delivery Rate", source: "sequence", function: "Persentase paket yang berhasil diterima" },
    { metric: "Duplicate Packet", source: "sequence", function: "Paket yang diterima lebih dari sekali" },
    { metric: "Out-of-Order Packet", source: "sequence", function: "Paket datang tidak berurutan" },
    { metric: "Connection/Node Availability", source: "keberadaan data per node_id", function: "Menilai apakah node aktif/terhubung" },
    { metric: "Data Freshness", source: "received_at", function: "Seberapa baru data yang diterima" },
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">
      
      {/* OVERLAY MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* COMPONENT SIDEBAR TERPISAH */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        
        {/* HEADER TOP BAR */}
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
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Pantau latensi, sinyal RSSI, jitter, dan metrik kualitas koneksi sensor real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">
              <Clock size={14} className="text-blue-600" />
              <span>{latest?.timestamp ? new Date(latest.timestamp).toLocaleString('id-ID') : "Sinkronisasi..."}</span>
            </div>

            <div className="relative">
              <select 
                value={selectedNode} 
                onChange={(e) => setSelectedNode(e.target.value)} 
                className="appearance-none bg-blue-50 text-blue-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-blue-200 outline-none cursor-pointer"
              >
                <option value="">Semua Node (Gateway)</option>
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

        {/* AREA KONTEN SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            
            {/* GRID KARTU METRIK JARINGAN UTAMA DARI BACKEND */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Sinyal (RSSI)", value: `${signal.average_dbm ? signal.average_dbm.toFixed(1) : 0} dBm`, status: "Sinyal Aktif", icon: Wifi, color: "text-blue-600" },
                { label: "Latensi (Delay)", value: `${delay.average_ms ? delay.average_ms.toFixed(1) : 0} ms`, status: "Optimal", icon: Activity, color: "text-green-600" },
                { label: "Packet Loss", value: `${packetLoss.packet_loss_percent ? packetLoss.packet_loss_percent.toFixed(2) : 0}%`, status: "Hilang: " + (packetLoss.lost_packets || 0), icon: ShieldAlert, color: "text-purple-600" },
                { label: "Jitter", value: `${jitter.jitter_ms ? jitter.jitter_ms.toFixed(1) : 0} ms`, status: "Variasi Delay", icon: Layers, color: "text-amber-500" },
                { label: "Total Record", value: `${net.total_rows || 0} pkt`, status: "Terekam", icon: ArrowDownUp, color: "text-indigo-600" },
                { label: "Data Freshness", value: latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : "-", status: "Real-time", icon: Database, color: "text-teal-600" },
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

            {/* TABEL STATUS NODE JARINGAN */}
            <motion.div variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-black text-gray-900 mb-4">Status Perangkat & Node Terhubung (Supabase)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Nama Node / ID</th>
                      <th className="p-3">Total Batch</th>
                      <th className="p-3">Sinyal Terakhir (RSSI)</th>
                      <th className="p-3">Data Terakhir Masuk</th>
                      <th className="p-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {[
                      { node: "KOMBUCHA_01", batch: "KB_2026_01", rssi: `${latest?.rssi_dbm || '-'} dBm`, time: latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : '-', status: "Online" },
                      { node: "ECO_02", batch: "EE_2026_02", rssi: "Terhubung", time: "Real-time", status: "Online" },
                      { node: "FRUIT_03", batch: "FR_2026_03", rssi: "Terhubung", time: "Real-time", status: "Online" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-bold text-gray-800">{row.node}</td>
                        <td className="p-3 text-gray-500 font-mono">{row.batch}</td>
                        <td className="p-3">{row.rssi}</td>
                        <td className="p-3">{row.time}</td>
                        <td className="p-3">
                          <span className="bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* TABEL SPESIFIKASI METRIK JARINGAN IOT */}
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
                        <td className="p-3 font-mono text-blue-700 bg-blue-50/30 rounded-md my-1 inline-block">{item.source}</td>
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