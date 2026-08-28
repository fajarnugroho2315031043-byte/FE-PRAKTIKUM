import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Droplet, Bell, Menu, Activity, Thermometer, Wind, Gauge, 
  Zap, CheckCircle2, Clock, ChevronDown, Calendar
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import fruitEnzymeImage from '../assets/fruit-enzyme.png';

// =====================================================================
// ANIMASI
// =====================================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// =====================================================================
// KOMPONEN UTAMA FRUIT ENZYME
// =====================================================================
export default function FruitEnzyme() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // State Navigasi Sidebar & Drawer Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State Filter & Sensor
  const [selectedFermenter, setSelectedFermenter] = useState("Fermenter 1");
  const [selectedIndicator, setSelectedIndicator] = useState("Suhu");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24 Jam");
  const [selectedDate, setSelectedDate] = useState("2026-08-16");

  // Otomatis menutup menu mobile jika halaman berubah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // Konfigurasi Sensor (Tanpa Glukosa)
  const indicatorConfig = {
    "Suhu": { unit: "°C", points: "0,60 100,55 200,65 300,50 400,45 500,40 600,45 700,35 800,42", color: "#d97706", min: "24°C", max: "32°C" },
    "pH": { unit: "", points: "0,42 100,45 200,48 300,50 400,52 500,55 600,58 700,60 800,62", color: "#d97706", min: "2.5", max: "4.5" },
    "TDS": { unit: "ppm", points: "0,55 100,60 200,45 300,50 400,40 500,45 600,35 700,40 800,36", color: "#d97706", min: "400", max: "800" },
    "Gas (Amonia)": { unit: "ppm", points: "0,75 100,70 200,65 300,80 400,55 500,65 600,50 700,60 800,45", color: "#d97706", min: "2 ppm", max: "15 ppm" },
    "Tekanan": { unit: "atm", points: "0,50 100,51 200,49 300,50 400,50 500,51 600,50 700,49 800,50", color: "#d97706", min: "0.9 atm", max: "1.1 atm" },
    "Alkohol": { unit: "%", points: "0,90 100,85 200,80 300,70 400,60 500,50 600,40 700,35 800,25", color: "#d97706", min: "0%", max: "2%" },
  };

  const currentConfig = indicatorConfig[selectedIndicator] || indicatorConfig["Suhu"];

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">
      
      {/* --- OVERLAY MOBILE MENU (BACKDROP) --- */}
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

      {/* --- SIDEBAR COMPONENT (REUSABLE) --- */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeImage={fruitEnzymeImage}
        activeTitle="Fruit Enzyme Active"
      />

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        
        {/* HEADER TOP BAR */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-4 truncate">
            <button 
              className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="truncate">
              <h1 className="text-base sm:text-xl font-black text-gray-900 truncate">Dashboard Fruit Enzyme</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Pantau kondisi fermentasi fruit enzyme secara real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">
              <Clock size={14} className="text-amber-600" />
              <span>16 Agustus 2026 - 10:30 WIB</span>
            </div>

            <div className="relative">
              <select 
                value={selectedFermenter} 
                onChange={(e) => setSelectedFermenter(e.target.value)} 
                className="appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-amber-200 outline-none cursor-pointer"
              >
                <option value="Fermenter 1">Fermenter 1</option>
                <option value="Fermenter 2">Fermenter 2</option>
                <option value="Fermenter 3">Fermenter 3</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-amber-600 pointer-events-none" />
            </div>

            <button className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* AREA KONTEN SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            
            {/* --- GRID KARTU 6 SENSOR UTAMA --- */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Suhu", value: "26.8°C", status: "Normal", icon: Thermometer, color: "text-orange-500" },
                { label: "Gas (Amonia)", value: "8 ppm", status: "Normal", icon: Wind, color: "text-blue-500" },
                { label: "pH", value: "3.65", status: "Optimal", icon: Droplet, color: "text-amber-600" },
                { label: "Tekanan", value: "0.99 atm", status: "Normal", icon: Gauge, color: "text-purple-500" },
                { label: "TDS", value: "610 ppm", status: "Normal", icon: Activity, color: "text-indigo-500" },
                { label: "Alkohol", value: "0.6%", status: "Normal", icon: Zap, color: "text-amber-500" },
              ].map((sensor, idx) => (
                <div key={idx} className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] sm:text-xs font-bold text-gray-400 truncate">{sensor.label}</span>
                    <sensor.icon size={16} className={`${sensor.color} flex-shrink-0`} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-gray-900">{sensor.value}</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{sensor.status}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* --- GRAFIK & STATUS FERMENTASI --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* AREA GRAFIK */}
              <motion.div variants={fadeInUp} className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Grafik Time-Series {selectedIndicator}</h3>
                    <p className="text-xs text-gray-400">{selectedTimeRange === "Tanggal" ? `Menampilkan data tanggal ${selectedDate}` : "Pemantauan historis 24 jam terakhir"}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <select 
                        value={selectedIndicator} 
                        onChange={(e) => setSelectedIndicator(e.target.value)} 
                        className="w-full appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 py-2 pr-7 rounded-xl border border-amber-200 outline-none cursor-pointer"
                      >
                        <option value="Suhu">Suhu</option>
                        <option value="pH">pH</option>
                        <option value="TDS">TDS</option>
                        <option value="Gas (Amonia)">Gas (Amonia)</option>
                        <option value="Tekanan">Tekanan</option>
                        <option value="Alkohol">Alkohol</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-3 text-amber-600 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 sm:flex-initial">
                      <select 
                        value={selectedTimeRange} 
                        onChange={(e) => setSelectedTimeRange(e.target.value)} 
                        className="w-full appearance-none bg-gray-50 text-gray-700 font-bold text-xs px-3 py-2 pr-7 rounded-xl border border-gray-200 outline-none cursor-pointer"
                      >
                        <option value="24 Jam">24 Jam</option>
                        <option value="Tanggal">Tanggal</option>
                        <option value="Minggu">Minggu</option>
                        <option value="Bulan">Bulan</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-500 pointer-events-none" />
                    </div>

                    {selectedTimeRange === "Tanggal" && (
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-gray-700 font-bold w-full sm:w-auto">
                        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none text-xs text-gray-700 cursor-pointer w-full"/>
                      </div>
                    )}
                  </div>
                </div>

                {/* SVG CHART CONTAINER */}
                <div className="h-60 w-full bg-white rounded-2xl border border-gray-100 p-2 sm:p-4 relative flex flex-col justify-between">
                  <div className="absolute left-1 sm:left-2 top-4 bottom-8 flex flex-col justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pointer-events-none">
                    <span>{currentConfig.max}</span>
                    <span>{currentConfig.min}</span>
                  </div>

                  <div className="relative z-10 w-full h-40 flex items-center pl-6 sm:pl-8 pr-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 800 100" preserveAspectRatio="none">
                      <polyline fill="none" stroke={currentConfig.color} strokeWidth="2.5" points={currentConfig.points}/>
                      {currentConfig.points.split(" ").map((pt, index) => {
                        const [cx, cy] = pt.split(",");
                        return <circle key={index} cx={cx} cy={cy} r="3.5" fill="white" stroke={currentConfig.color} strokeWidth="2" />;
                      })}
                    </svg>
                  </div>

                  <div className="relative z-10 flex justify-between pl-6 sm:pl-8 pr-2 text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pt-2 border-t border-gray-100">
                    {selectedTimeRange === "24 Jam" || selectedTimeRange === "Tanggal" ? (
                      <><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>23:59</span></>
                    ) : selectedTimeRange === "Minggu" ? (
                      <><span>Senin</span><span>Selasa</span><span>Rabu</span><span>Kamis</span><span>Jumat</span><span>Sabtu</span><span>Minggu</span></>
                    ) : (
                      <><span>Mng 1</span><span>Mng 2</span><span>Mng 3</span><span>Mng 4</span></>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* KARTU STATUS FERMENTASI */}
              <motion.div variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-black text-gray-900">Status Fermentasi</h3>
                    <span className="bg-amber-50 text-amber-600 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>Aktif
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">Hari ke-15 dari 60</p>
                  <p className="text-xs text-gray-400 mb-4">Estimasi selesai: 30 September 2026</p>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div className="w-[25%] h-full bg-amber-500 rounded-full"></div>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-amber-800">Kualitas Fruit Enzyme</span>
                    <span className="text-[11px] text-amber-600">Fermentasi berjalan stabil & berkualitas</span>
                  </div>
                  <CheckCircle2 size={24} className="text-amber-600 flex-shrink-0" />
                </div>
              </motion.div>
            </div>

            {/* NOTIFIKASI SISTEM */}
            <motion.div variants={fadeInUp} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
              <h3 className="text-base font-black text-gray-900 mb-4">Notifikasi Sistem</h3>
              <div className="space-y-3">
                {[
                  { text: "Suhu sedikit di bawah optimal (26.8°C)", time: "10:10 WIB" },
                  { text: "pH berada dalam rentang optimal untuk fruit enzyme (3.65)", time: "09:30 WIB" }
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-[#fcfcfb] border border-gray-100 text-xs">
                    <CheckCircle2 size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{notif.text}</p>
                      <span className="text-[10px] text-gray-400">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}