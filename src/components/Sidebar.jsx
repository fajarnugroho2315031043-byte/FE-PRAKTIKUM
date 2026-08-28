import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Droplet, Recycle, Apple, 
  Home, Activity, Menu, X 
} from 'lucide-react';

import logo from '../assets/LOGO.png';

function SidebarItem({ icon: Icon, label, path, activePath, isCollapsed, onClick }) {
  const isActive = path === '/'
    ? activePath === '/'
    : activePath === path || activePath.startsWith(`${path}/`);

  return (
    <Link to={path} title={isCollapsed ? label : ""} onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-3 px-6 py-3 my-1 transition-all duration-200 border-r-4 ${
          isActive
            ? 'bg-green-50/80 border-green-700 text-green-700 font-bold'
            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-green-700 font-medium'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-green-700 flex-shrink-0" : "flex-shrink-0"} />
        {!isCollapsed && <span className="text-sm whitespace-nowrap">{label}</span>}
      </motion.div>
    </Link>
  );
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen, activeImage, activeTitle }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Drawer (Slide-in) */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo FermaSense" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="leading-tight">
                <span className="block text-lg font-black text-gray-900 tracking-tight">FermaSense</span>
                <span className="block text-[9px] text-gray-400 font-medium">Monitor. Ferment. Perfect.</span>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>

          <nav className="mt-4 flex flex-col gap-1">
            <SidebarItem icon={Home} label="Beranda" path="/" activePath={currentPath} onClick={() => setIsMobileMenuOpen(false)} />
            <div className="px-6 mt-4 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sistem Monitoring</span>
            </div>
            <SidebarItem icon={LayoutDashboard} label="Overview" path="/dashboard" activePath={currentPath} onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarItem icon={Droplet} label="Kombucha" path="/kombucha" activePath={currentPath} onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarItem icon={Recycle} label="Eco Enzyme" path="/eco-enzyme" activePath={currentPath} onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarItem icon={Apple} label="Fruit Enzyme" path="/fruit-enzyme" activePath={currentPath} onClick={() => setIsMobileMenuOpen(false)} />
            
            <div className="px-6 mt-4 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performa Jaringan</span>
            </div>
            <SidebarItem icon={Activity} label="Network Perf" path="/network-perf" activePath={currentPath} onClick={() => setIsMobileMenuOpen(false)} />
          </nav>
        </div>

        {activeImage && (
          <div className="p-4">
            <div className="bg-[#fcfcfb] rounded-2xl p-2.5 border border-gray-100 overflow-hidden shadow-sm">
              <img src={activeImage} alt={activeTitle} className="w-full h-20 object-cover object-top rounded-xl mb-1.5" />
              <h4 className="text-[11px] font-bold text-green-700 text-center">{activeTitle}</h4>
            </div>
          </div>
        )}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col justify-between z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
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
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0 cursor-pointer">
              <Menu size={18} />
            </button>
          </div>

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

            {!isCollapsed && (
              <div className="px-6 mt-3 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Performa Jaringan</span>
              </div>
            )}
            <SidebarItem icon={Activity} label="Network Perf" path="/network-perf" activePath={currentPath} isCollapsed={isCollapsed} />
          </nav>
        </div>

        {!isCollapsed && activeImage && (
          <div className="px-4 pb-4">
            <div className="bg-[#fcfcfb] rounded-2xl p-2.5 border border-gray-100 overflow-hidden shadow-sm">
              <img src={activeImage} alt={activeTitle} className="w-full h-20 object-cover object-top rounded-xl mb-1.5" />
              <h4 className="text-[11px] font-bold text-green-700 text-center">{activeTitle}</h4>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}