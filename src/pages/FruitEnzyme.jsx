import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Droplet, Bell, Menu, Activity, Thermometer, Wind, Gauge, 
  Zap, CheckCircle2, Clock, ChevronDown
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import fruitEnzymeImage from '../assets/fruit-enzyme.png';
import { fetchSensorData } from '../services/api'; // ← ganti dari fetchAnalytics

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function FruitEnzyme() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState("FRUIT_03");
  const [selectedIndicator, setSelectedIndicator] = useState("temperature_c");

  // ← State dipisah langsung, tidak pakai analyticsData
  const [timeSeries, setTimeSeries] = useState([]);
  const [latest, setLatest] = useState({});
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 10000;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // ← Fetch pakai fetchSensorData, petakan { success, count, data }
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchSensorData({ node_id: selectedNode, limit: 100 });
        const rows = result?.data || [];
        const sorted = [...rows].reverse(); // backend DESC → balik untuk grafik kiri ke kanan

        setTimeSeries(sorted);
        setLatest(sorted[sorted.length - 1] || {});
        setTotalRows(result?.count || 0);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [selectedNode, POLLING_INTERVAL]);

  const indicatorMap = {
    "temperature_c": { label: "Suhu",          unit: "°C",  color: "#d97706", min: "20°C", max: "40°C" },
    "ph":            { label: "pH",             unit: "",    color: "#d97706", min: "2.0",  max: "7.0"  },
    "tds_ppm":       { label: "TDS",            unit: "ppm", color: "#d97706", min: "0",    max: "1000" },
    "gas_adc":       { label: "Gas (ADC)",      unit: "ADC", color: "#d97706", min: "0",    max: "1024" },
    "mq3_adc":       { label: "Alkohol / MQ3",  unit: "ADC", color: "#d97706", min: "0",    max: "1024" },
    "pressure_kpa":  { label: "Tekanan",        unit: "kPa", color: "#d97706", min: "90",   max: "110"  }
  };

  const currentConfig = indicatorMap[selectedIndicator] || indicatorMap["temperature_c"];

  const generateSvgPoints = (dataArray, field) => {
    if (!dataArray || dataArray.length === 0) return "0,50 800,50";
    const values = dataArray.map(item => Number(item[field]) || 0);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    return dataArray.map((item, index) => {
      const val = Number(item[field]) || 0;
      const x = (index / (dataArray.length - 1 || 1)) * 800;
      const y = 100 - ((val - minVal) / range) * 80 - 10;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  const chartPoints = generateSvgPoints(timeSeries, selectedIndicator);

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
        activeImage={fruitEnzymeImage} activeTitle="Fruit Enzyme Active"
      />

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4 truncate">
            <button 
              className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)} aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="truncate">
              <h1 className="text-base sm:text-xl font-black text-gray-900 truncate">Dashboard Fruit Enzyme</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading ? "Memuat data..." : error ? `Error: ${error}` : "Data real-time dari Supabase"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">
              <Clock size={14} className="text-amber-600" />
              <span>
                {latest?.timestamp
                  ? new Date(latest.timestamp).toLocaleString('id-ID')
                  : "Memuat waktu..."}
              </span>
            </div>

            <div className="relative">
              <select 
                value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)}
                className="appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-amber-200 outline-none cursor-pointer"
              >
                <option value="FRUIT_03">FRUIT_03</option>
                <option value="FRUIT_01">FRUIT_01</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-amber-600 pointer-events-none" />
            </div>

            <button className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            
            {/* --- GRID KARTU SENSOR --- */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Suhu",          value: loading ? "..." : `${latest?.temperature_c ?? '-'}°C`,  icon: Thermometer, color: "text-orange-500" },
                { label: "Gas (ADC)",     value: loading ? "..." : `${latest?.gas_adc ?? '-'}`,          icon: Wind,        color: "text-blue-500"   },
                { label: "pH",            value: loading ? "..." : `${latest?.ph ?? '-'}`,               icon: Droplet,     color: "text-amber-600"  },
                { label: "Tekanan",       value: loading ? "..." : `${latest?.pressure_kpa ?? '-'} kPa`, icon: Gauge,       color: "text-purple-500" },
                { label: "TDS",           value: loading ? "..." : `${latest?.tds_ppm ?? '-'} ppm`,      icon: Activity,    color: "text-indigo-500" },
                { label: "Alkohol (MQ3)", value: loading ? "..." : `${latest?.mq3_adc ?? '-'}`,          icon: Zap,         color: "text-amber-500"  },
              ].map((sensor, idx) => (
                <div key={idx} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] sm:text-xs font-bold text-gray-400 truncate">{sensor.label}</span>
                    <sensor.icon size={16} className={`${sensor.color} flex-shrink-0`} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-gray-900">{sensor.value}</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Normal</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* --- GRAFIK & STATUS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <motion.div variants={fadeInUp} className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Grafik Time-Series {currentConfig.label}</h3>
                    <p className="text-xs text-gray-400">Data langsung dari Supabase ({timeSeries.length} titik data)</p>
                  </div>
                  <div className="relative flex-1 sm:flex-initial">
                    <select 
                      value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)}
                      className="w-full appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 py-2 pr-7 rounded-xl border border-amber-200 outline-none cursor-pointer"
                    >
                      <option value="temperature_c">Suhu</option>
                      <option value="ph">pH</option>
                      <option value="tds_ppm">TDS</option>
                      <option value="gas_adc">Gas (ADC)</option>
                      <option value="pressure_kpa">Tekanan</option>
                      <option value="mq3_adc">Alkohol (MQ3)</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-3 text-amber-600 pointer-events-none" />
                  </div>
                </div>

                <div className="h-60 w-full bg-white rounded-2xl border border-gray-100 p-2 sm:p-4 relative flex flex-col justify-between">
                  <div className="absolute left-1 sm:left-2 top-4 bottom-8 flex flex-col justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pointer-events-none">
                    <span>{currentConfig.max}</span>
                    <span>{currentConfig.min}</span>
                  </div>
                  <div className="relative z-10 w-full h-40 flex items-center pl-6 sm:pl-8 pr-2">
                    {loading ? (
                      <div className="w-full text-center text-xs text-gray-400">Memuat data grafik...</div>
                    ) : timeSeries.length === 0 ? (
                      <div className="w-full text-center text-xs text-gray-400">Belum ada data riwayat sensor</div>
                    ) : (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 800 100" preserveAspectRatio="none">
                        <polyline fill="none" stroke={currentConfig.color} strokeWidth="2.5" points={chartPoints}/>
                        {timeSeries.map((_, index) => {
                          const pts = chartPoints.split(" ");
                          if (!pts[index]) return null;
                          const [cx, cy] = pts[index].split(",");
                          return <circle key={index} cx={cx} cy={cy} r="3" fill="white" stroke={currentConfig.color} strokeWidth="2" />;
                        })}
                      </svg>
                    )}
                  </div>
                  <div className="relative z-10 flex justify-between pl-6 sm:pl-8 pr-2 text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pt-2 border-t border-gray-100">
                    <span>Awal Data</span>
                    <span>Terbaru</span>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-black text-gray-900">Status Node</h3>
                    <span className={`font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${error ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-gray-400' : 'bg-amber-500 animate-pulse'}`}></span>
                      {error ? 'Error' : 'Connected'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">Node ID: {selectedNode}</p>
                  <p className="text-xs text-gray-400 mb-4">Total Record: {totalRows}</p>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div className="w-full h-full bg-amber-500 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-amber-800">Kualitas Jaringan</span>
                    <span className="text-[11px] text-amber-600">
                      RSSI: {loading ? "..." : `${latest?.rssi_dbm ?? '-'} dBm`}
                    </span>
                  </div>
                  <CheckCircle2 size={24} className="text-amber-600 flex-shrink-0" />
                </div>
              </motion.div>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}