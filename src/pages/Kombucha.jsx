import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Droplet, Recycle, Apple, 
  Bell, Home, Menu, Search, Activity, 
  Thermometer, Wind, Gauge, Zap, CheckCircle2, 
  Clock, ChevronDown, Calendar
} from 'lucide-react';

import logo from '../assets/LOGO.png';
import kombuchaImage from '../assets/kombucha.png';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

function SidebarItem({ icon: Icon, label, path, activePath, isCollapsed }) {
  const isActive = path === '/'
    ? activePath === '/'
    : activePath === path || activePath.startsWith(`${path}/`);

  return (
    <Link to={path} title={isCollapsed ? label : ""}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-3 px-6 py-3 my-1 transition-all duration-200 border-r-4 ${
          isActive
            ? 'bg-red-50/80 border-red-600 text-red-600'
            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-red-600'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-red-600 flex-shrink-0" : "flex-shrink-0"} />
        {!isCollapsed && <span className={`text-sm whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>}
      </motion.div>
    </Link>
  );
}

export default function Kombucha() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFermenter, setSelectedFermenter] = useState("Fermenter 1");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [selectedIndicator, setSelectedIndicator] = useState("Suhu");
  const [selectedTimeRange, setSelectedTimeRange] = useState("24 Jam");
  const [selectedDate, setSelectedDate] = useState("2026-08-16");

  // Konfigurasi Sensor (Tanpa Glukosa)
  const indicatorConfig = {
    "Suhu": { unit: "°C", points: "0,65 100,55 200,70 300,45 400,50 500,35 600,40 700,30 800,45", color: "#dc2626", min: "24°C", max: "32°C" },
    "pH": { unit: "", points: "0,40 100,45 200,42 300,50 400,48 500,55 600,52 700,60 800,58", color: "#dc2626", min: "2.5", max: "4.5" },
    "TDS": { unit: "ppm", points: "0,50 100,60 200,40 300,55 400,35 500,45 600,30 700,40 800,35", color: "#dc2626", min: "400", max: "700" },
    "Gas (Amonia)": { unit: "ppm", points: "0,70 100,75 200,65 300,80 400,60 500,70 600,55 700,65 800,50", color: "#dc2626", min: "5 ppm", max: "20 ppm" },
    "Tekanan": { unit: "atm", points: "0,50 100,52 200,49 300,51 400,50 500,52 600,50 700,49 800,50", color: "#dc2626", min: "0.9 atm", max: "1.1 atm" },
    "Alkohol": { unit: "%", points: "0,80 100,75 200,70 300,60 400,55 500,45 600,40 700,30 800,25", color: "#dc2626", min: "0%", max: "2%" },
  };

  const currentConfig = indicatorConfig[selectedIndicator] || indicatorConfig["Suhu"];

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className={`bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col justify-between z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          {/* Logo Area */}
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src={logo} alt="Logo FermaSense" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              {!isCollapsed && (
                <div className="leading-tight whitespace-nowrap">
                  <span className="block text-lg font-black text-gray-900 tracking-tight">FermaSense</span>
                  <span className="block text-[9px] text-gray-400 font-medium">Monitor. Ferment. Perfect.</span>
                </div>
              )}
            </div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0 cursor-pointer" title={isCollapsed ? "Perbesar Sidebar" : "Kecilkan Sidebar"}>
              <Menu size={18} />
            </button>
          </div>

          {/* Menu Navigasi */}
          <nav className="mt-1 flex flex-col gap-1">
            <SidebarItem icon={Home} label="Beranda" path="/" activePath={currentPath} isCollapsed={isCollapsed} />
            {!isCollapsed && (
              <div className="px-6 mt-3 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Sistem Monitoring</span>
              </div>
            )}
            <SidebarItem icon={LayoutDashboard} label="Overview" path="/dashboard" activePath={currentPath} isCollapsed={isCollapsed} />
            <SidebarItem icon={Droplet} label="Kombucha" path="/kombucha" activePath={currentPath} isCollapsed={isCollapsed} />
            <SidebarItem icon={Recycle} label="Eco Enzyme" path="/eco-enzyme" activePath={currentPath} isCollapsed={isCollapsed} />
            <SidebarItem icon={Apple} label="Fruit Enzyme" path="/fruit-enzyme" activePath={currentPath} isCollapsed={isCollapsed} />
          </nav>
        </div>

        {/* Widget Gambar Kombucha di Bawah Sidebar */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="bg-[#fcfcfb] rounded-2xl p-2.5 border border-gray-100 overflow-hidden shadow-sm">
              <img src={kombuchaImage} alt="Kombucha" className="w-full h-20 object-cover object-top rounded-xl mb-1.5" />
              <h4 className="text-[11px] font-bold text-red-600 text-center">Kombucha Active</h4>
            </div>
          </div>
        )}
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Dashboard Kombucha</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Pantau kondisi fermentasi kombucha secara real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">
              <Clock size={14} className="text-red-600" />
              <span>16 Agustus 2026 - 10:30 WIB</span>
            </div>

            <div className="relative">
              <select value={selectedFermenter} onChange={(e) => setSelectedFermenter(e.target.value)} className="appearance-none bg-red-50 text-red-600 font-bold text-xs px-4 py-2.5 pr-8 rounded-2xl border border-red-200 outline-none cursor-pointer">
                <option value="Fermenter 1">Fermenter 1</option>
                <option value="Fermenter 2">Fermenter 2</option>
                <option value="Fermenter 3">Fermenter 3</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-red-600 pointer-events-none" />
            </div>

            <button className="relative w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-8">
            
            {/* --- GRID KARTU 6 SENSOR UTAMA --- */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Suhu", value: "28.4°C", status: "Normal", icon: Thermometer, color: "text-orange-500" },
                { label: "Gas (Amonia)", value: "12 ppm", status: "Normal", icon: Wind, color: "text-blue-500" },
                { label: "pH", value: "3.45", status: "Normal", icon: Droplet, color: "text-red-600" },
                { label: "Tekanan", value: "1.01 atm", status: "Normal", icon: Gauge, color: "text-purple-500" },
                { label: "TDS", value: "540 ppm", status: "Normal", icon: Activity, color: "text-indigo-500" },
                { label: "Alkohol", value: "1.2%", status: "Normal", icon: Zap, color: "text-amber-500" },
              ].map((sensor, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400">{sensor.label}</span>
                    <sensor.icon size={16} className={sensor.color} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">{sensor.value}</h4>
                    <span className="inline-block mt-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{sensor.status}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={fadeInUp} className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Grafik Time-Series {selectedIndicator}</h3>
                    <p className="text-xs text-gray-400">{selectedTimeRange === "Tanggal" ? `Menampilkan data tanggal ${selectedDate}` : "Pemantauan historis 24 jam terakhir"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <select value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)} className="appearance-none bg-red-50 text-red-600 font-bold text-xs px-3.5 py-2 pr-7 rounded-xl border border-red-200 outline-none cursor-pointer">
                        <option value="Suhu">Suhu</option>
                        <option value="pH">pH</option>
                        <option value="TDS">TDS</option>
                        <option value="Gas (Amonia)">Gas (Amonia)</option>
                        <option value="Tekanan">Tekanan</option>
                        <option value="Alkohol">Alkohol</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-3 text-red-600 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)} className="appearance-none bg-gray-50 text-gray-700 font-bold text-xs px-3.5 py-2 pr-7 rounded-xl border border-gray-200 outline-none cursor-pointer">
                        <option value="24 Jam">24 Jam</option>
                        <option value="Tanggal">Tanggal</option>
                        <option value="Minggu">Minggu</option>
                        <option value="Bulan">Bulan</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-3 text-gray-500 pointer-events-none" />
                    </div>

                    {selectedTimeRange === "Tanggal" && (
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-gray-700 font-bold">
                        <Calendar size={14} className="text-gray-400" />
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none text-xs text-gray-700 cursor-pointer"/>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-60 w-full bg-white rounded-2xl border border-gray-100 p-4 relative flex flex-col justify-between">
                  <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-[10px] font-bold text-gray-400 select-none pointer-events-none">
                    <span>{currentConfig.max}</span>
                    <span>{currentConfig.min}</span>
                  </div>

                  <div className="relative z-10 w-full h-40 flex items-center px-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 800 100" preserveAspectRatio="none">
                      <polyline fill="none" stroke={currentConfig.color} strokeWidth="2.5" points={currentConfig.points}/>
                      {currentConfig.points.split(" ").map((pt, index) => {
                        const [cx, cy] = pt.split(",");
                        return <circle key={index} cx={cx} cy={cy} r="3.5" fill="white" stroke={currentConfig.color} strokeWidth="2" />;
                      })}
                    </svg>
                  </div>

                  <div className="relative z-10 flex justify-between px-4 text-[10px] font-bold text-gray-400 select-none pt-2 border-t border-gray-100">
                    {selectedTimeRange === "24 Jam" || selectedTimeRange === "Tanggal" ? (
                      <><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>23:59</span></>
                    ) : selectedTimeRange === "Minggu" ? (
                      <><span>Senin</span><span>Selasa</span><span>Rabu</span><span>Kamis</span><span>Jumat</span><span>Sabtu</span><span>Minggu</span></>
                    ) : (
                      <><span>Minggu 1</span><span>Minggu 2</span><span>Minggu 3</span><span>Minggu 4</span></>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-black text-gray-900">Status Fermentasi</h3>
                    <span className="bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>Aktif
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">Hari ke-7 dari 14</p>
                  <p className="text-xs text-gray-400 mb-4">Estimasi selesai: 23 Agustus 2026</p>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div className="w-1/2 h-full bg-red-600 rounded-full"></div>
                  </div>
                </div>

                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-red-800">Kualitas Kombucha</span>
                    <span className="text-[11px] text-red-600">Parameter optimal & stabil</span>
                  </div>
                  <CheckCircle2 size={24} className="text-red-600" />
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
              <h3 className="text-base font-black text-gray-900 mb-4">Notifikasi Sistem</h3>
              <div className="space-y-3">
                {[
                  { text: "Suhu terpantau dalam rentang optimal (28.4°C)", time: "10:15 WIB" },
                  { text: "pH berada di tingkat ideal untuk hari ke-7", time: "09:30 WIB" }
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-[#fcfcfb] border border-gray-100 text-xs">
                    <CheckCircle2 size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
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