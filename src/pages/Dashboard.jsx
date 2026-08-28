import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Droplet, Recycle, Apple, 
  Bell, Menu, Search, ArrowRight
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import { fetchSensorData } from '../services/api'; // ← ganti dari fetchAnalytics

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Dashboard() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ← State langsung per node, bukan analyticsData
  const [kombuchaLatest, setKombuchaLatest] = useState(null);
  const [ecoLatest, setEcoLatest] = useState(null);
  const [fruitLatest, setFruitLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 10000;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // ← Fetch limit:1 per node, ambil index [0] karena backend DESC = data terbaru
  useEffect(() => {
    const loadAllNodes = async () => {
      try {
        const [kombuchaRes, ecoRes, fruitRes] = await Promise.all([
          fetchSensorData({ node_id: "KOMBUCHA_01", limit: 1 }).catch(() => null),
          fetchSensorData({ node_id: "ECO_02",      limit: 1 }).catch(() => null),
          fetchSensorData({ node_id: "FRUIT_03",    limit: 1 }).catch(() => null),
        ]);

        // Backend ORDER BY timestamp DESC, limit 1 → index [0] = data terbaru
        setKombuchaLatest(kombuchaRes?.data?.[0] || null);
        setEcoLatest(ecoRes?.data?.[0]           || null);
        setFruitLatest(fruitRes?.data?.[0]        || null);
      } catch (err) {
        console.error("Gagal memuat ringkasan dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllNodes();
    const intervalId = setInterval(loadAllNodes, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [POLLING_INTERVAL]);

  // Hitung rata-rata suhu dari 3 node
  const temps = [
    kombuchaLatest?.temperature_c,
    ecoLatest?.temperature_c,
    fruitLatest?.temperature_c,
  ].filter(t => t !== null && t !== undefined);

  const avgTemp = temps.length > 0
    ? (temps.reduce((a, b) => Number(a) + Number(b), 0) / temps.length).toFixed(1)
    : "-";

  // Helper format nilai sensor, tampilkan "..." saat loading
  const fmt = (val) => loading ? "..." : (val ?? "-");

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
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)} aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="truncate">
              <h1 className="text-lg md:text-xl font-black text-gray-900 truncate">Overview Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading ? "Memuat data dari Supabase..." : "Data real-time dari semua node aktif"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
              <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                type="text" placeholder="Cari data..."
                className="bg-transparent border-none outline-none text-sm w-32 md:w-48 text-gray-700 placeholder:text-gray-400"
              />
            </div>
            <button className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            
            {/* Kartu Ringkasan Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { 
                  title: "Sistem Berjalan", 
                  value: "3 Node", 
                  desc: "Kombucha, Eco, Fruit", 
                  icon: LayoutDashboard, 
                  color: "text-green-600", 
                  bg: "bg-green-50" 
                },
                { 
                  title: "Rata-rata Suhu", 
                  value: loading ? "..." : `${avgTemp}°C`, 
                  desc: "Berdasarkan sensor aktif", 
                  icon: LayoutDashboard, 
                  color: "text-blue-600", 
                  bg: "bg-blue-50" 
                },
                { 
                  title: "Status Koneksi", 
                  value: "Online", 
                  desc: "Sinkronisasi MQTT Lancar", 
                  icon: Bell, 
                  color: "text-orange-600", 
                  bg: "bg-orange-50" 
                },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5 truncate">{stat.title}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900">{stat.value}</h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 sm:mt-1 truncate">{stat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Akses Cepat per Node */}
            <div>
              <motion.h2 variants={fadeInUp} className="text-base sm:text-lg font-black text-gray-900 mb-4">Akses Cepat Sistem</motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { 
                    title: "Kombucha", 
                    desc: `pH: ${fmt(kombuchaLatest?.ph)} | Suhu: ${fmt(kombuchaLatest?.temperature_c)}°C`,
                    path: "/kombucha", icon: Droplet, status: "Node: KOMBUCHA_01"
                  },
                  { 
                    title: "Eco Enzyme", 
                    desc: `pH: ${fmt(ecoLatest?.ph)} | Suhu: ${fmt(ecoLatest?.temperature_c)}°C`,
                    path: "/eco-enzyme", icon: Recycle, status: "Node: ECO_02"
                  },
                  { 
                    title: "Fruit Enzyme", 
                    desc: `pH: ${fmt(fruitLatest?.ph)} | Suhu: ${fmt(fruitLatest?.temperature_c)}°C`,
                    path: "/fruit-enzyme", icon: Apple, status: "Node: FRUIT_03"
                  },
                ].map((item, i) => (
                  <motion.div 
                    key={i} variants={fadeInUp} whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
                          <item.icon size={20} />
                        </div>
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Online
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium mb-3">{item.status}</p>
                      <div className="bg-[#fcfcfb] rounded-xl p-3 mb-5 border border-gray-50 text-xs text-gray-600 font-semibold text-center truncate">
                        {item.desc}
                      </div>
                    </div>
                    <Link 
                      to={item.path} 
                      className="w-full py-3 bg-gray-50 text-green-700 rounded-2xl font-bold hover:bg-green-700 hover:text-white transition-colors flex justify-center items-center gap-2 text-xs sm:text-sm border border-gray-100 hover:border-green-700 group-hover:shadow-lg group-hover:shadow-green-700/20"
                    >
                      Buka Dashboard <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}