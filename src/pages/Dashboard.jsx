import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Droplet, Recycle, Apple, 
  Bell, Home, Menu, 
  Search, ArrowRight
} from 'lucide-react';

import logo from '../assets/LOGO.png';

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
// KOMPONEN SIDEBAR ITEM
// =====================================================================
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
            ? 'bg-green-50/80 border-green-700 text-green-700'
            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-green-700'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-green-700 flex-shrink-0" : "flex-shrink-0"} />
        {!isCollapsed && <span className={`text-sm whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>}
      </motion.div>
    </Link>
  );
}

// =====================================================================
// KOMPONEN UTAMA DASHBOARD
// =====================================================================
export default function Dashboard() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State untuk Minimize/Collapse Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">
      
      {/* --- SIDEBAR (DESKTOP) DENGAN FITUR COLLAPSE/MINIMIZE --- */}
      <aside className={`bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col justify-between z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          {/* Logo Area & Toggle Button (Dinaikkan py-5 agar sejajar) */}
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
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0 cursor-pointer"
              title={isCollapsed ? "Perbesar Sidebar" : "Kecilkan Sidebar"}
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Menu Navigasi (Dinaikkan marginnya) */}
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

        {/* Widget Status Sistem di Bawah Sidebar Asli (Tanpa Gambar Keranjang) */}
        {!isCollapsed && (
          <div className="p-6">
            <div className="bg-[#fcfcfb] rounded-2xl p-4 border border-gray-100">
              <h4 className="text-xs font-bold text-gray-900 mb-1">Sistem Aktif</h4>
              <p className="text-[10px] text-gray-500 mb-3">3 / 3 Sistem beroperasi dengan baik.</p>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-full h-full bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* HEADER TOP BAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Overview Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Pantau semua sistem fermentasi dalam satu layar</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden md:flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Cari data..." 
                className="bg-transparent border-none outline-none text-sm w-48 text-gray-700 placeholder:text-gray-400"
              />
            </div>
            
            <button className="relative w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* AREA KONTEN SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="max-w-6xl mx-auto space-y-8"
          >
            {/* Kartu Ringkasan (Top Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Sistem Berjalan", value: "3", desc: "Kombucha, Eco, Fruit", icon: LayoutDashboard, color: "text-green-600", bg: "bg-green-50" },
                { title: "Rata-rata Suhu", value: "27.5°C", desc: "Optimal pada semua tangki", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-50" },
                { title: "Peringatan", value: "0", desc: "Semua parameter normal", icon: Bell, color: "text-orange-600", bg: "bg-orange-50" }
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-0.5">{stat.title}</p>
                    <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                    <p className="text-[11px] text-gray-400 mt-1">{stat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Menu Navigasi ke Masing-masing Sistem */}
            <div>
              <motion.h2 variants={fadeInUp} className="text-lg font-black text-gray-900 mb-4">Akses Cepat Sistem</motion.h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { title: "Kombucha", desc: "pH: 3.45 | Suhu: 28.4°C", path: "/kombucha", icon: Droplet, status: "Aktif Hari ke-7" },
                  { title: "Eco Enzyme", desc: "pH: 3.72 | Suhu: 27.6°C", path: "/eco-enzyme", icon: Recycle, status: "Aktif Hari ke-12" },
                  { title: "Fruit Enzyme", desc: "pH: 3.65 | Suhu: 26.8°C", path: "/fruit-enzyme", icon: Apple, status: "Aktif Hari ke-15" }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center">
                          <item.icon size={22} />
                        </div>
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Online
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 font-medium mb-2">{item.status}</p>
                      <div className="bg-[#fcfcfb] rounded-xl p-3 mb-6 border border-gray-50 text-xs text-gray-600 font-medium text-center">
                        {item.desc}
                      </div>
                    </div>
                    
                    <Link to={item.path} className="w-full py-3 bg-gray-50 text-green-700 rounded-2xl font-bold hover:bg-green-700 hover:text-white transition-colors flex justify-center items-center gap-2 text-sm border border-gray-100 hover:border-green-700 group-hover:shadow-lg group-hover:shadow-green-700/20">
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