import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wifi, TrendingUp, Bell, Leaf, Droplet, Recycle, Apple,
  Target, Hand, Lock, ShieldCheck, MapPin, Phone, ArrowRight
} from 'lucide-react';

import logo from '../assets/LOGO.png';
import heroImage from '../assets/hero-kombucha.png';
import keranjangImage from '../assets/keranjang.png';
import kombuchaImage from '../assets/kombucha.png';
import ecoEnzymeImage from '../assets/eco-enzyme.png';
import fruitEnzymeImage from '../assets/fruit-enzyme.png';

// =====================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// Dekorasi daun mengambang - murni hiasan, aman diabaikan/diedit
function FloatingLeaf({ className = "", delay = 0, duration = 6, rotate = -10, size = 34 }) {
  return (
    <motion.svg
      className={`absolute pointer-events-none select-none hidden sm:block ${className}`}
      width={size} height={size} viewBox="0 0 36 36" fill="none"
      initial={{ opacity: 0, rotate }}
      animate={{ opacity: 0.55, y: [0, -14, 0], rotate: [rotate, rotate + 14, rotate] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <path d="M18 2C10 6 4 14 6 24C8 33 18 34 24 28C30 22 30 10 18 2Z" fill="#4a7c59" fillOpacity="0.35" />
      <path d="M18 3C13 12 9 19 6 23" stroke="#3f6b4b" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" />
    </motion.svg>
  );
}

// Ikon sosial - bentuk generik sederhana, boleh diganti dengan aset/logo resmi
function SocialIcon({ type }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24" };
  if (type === "facebook") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M13.5 9H15V6.5h-1.75C11.5 6.5 10 7.9 10 9.75V11H8.5v2.5H10V19h2.5v-5.5H14l.5-2.5h-2v-1c0-.55.2-1 1-1Z" />
      </svg>
    );
  }
  if (type === "instagram") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="16.3" cy="7.7" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm4.8 12.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.1.1.3 0 .5-.1.2-.1.3-.3.5-.1.2-.3.4-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1 .2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.6-.1 1.2Z" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-x-hidden">

      {/* --- NAVBAR --- */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center px-6 md:px-16 py-6 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src={logo}
            alt="Logo FermaSense"
            className="w-12 h-12 rounded-full object-cover"
          />

          <div className="leading-tight">
            <span className="block text-xl font-black text-gray-900 tracking-tight">
              FermaSense
            </span>
            <span className="block text-[10px] text-gray-400 font-medium tracking-wide">
              Monitor. Ferment. Perfect.
            </span>
          </div>
        </div>

        <div className="hidden md:flex gap-10 font-medium text-gray-600 text-sm">
          <Link to="/" className="text-green-700 font-semibold border-b-2 border-green-700 pb-1"> Beranda </Link>
          <Link to="/dashboard" className="hover:text-green-700 transition-colors"> Dashboard</Link>
          <a href="#tentang" className="hover:text-green-700 transition-colors">Tentang</a>
          <a href="#fitur" className="hover:text-green-700 transition-colors">Fitur</a>
          <a href="#kontak" className="hover:text-green-700 transition-colors">Kontak </a>
        </div>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-6 md:px-16 mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative"
      >
        <FloatingLeaf className="top-0 left-4 lg:left-0" delay={0.2} duration={7} rotate={-20} />

        <motion.div variants={fadeInUp} className="z-10">
          <div className="inline-flex items-center px-4 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
            <span className="w-2 h-2 inline-block bg-green-600 rounded-full mr-2"></span>
            Sistem Monitoring Fermentasi IoT
          </div>
          <h1 className="text-5xl lg:text-[62px] font-black leading-[1.1] mb-6 text-gray-900">
            Pantau Setiap <span className="text-green-700">Proses,</span><br />
            Sempurnakan Setiap <span className="text-green-700">Rasa.</span>
          </h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-lg">
            FermaSense membantu kamu memantau kondisi fermentasi secara real-time dengan data akurat, visualisasi informatif, dan notifikasi cerdas untuk hasil fermentasi terbaik setiap saat.
          </p>

          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { icon: Wifi, title: "Real-time", desc: "Data sensor terkini setiap saat" },
              { icon: TrendingUp, title: "Analitik", desc: "Grafik historis yang mudah dipahami" },
              { icon: Bell, title: "Notifikasi", desc: "Peringatan otomatis jika kondisi tidak normal" },
            ].map((f, i) => (
              <div key={i}>
                <div className="w-9 h-9 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-700 mb-2">
                  <f.icon size={16} strokeWidth={2} />
                </div>
                <strong className="block text-gray-900 font-bold text-sm">{f.title}</strong>
                <span className="text-gray-500 text-xs leading-snug">{f.desc}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/dashboard"
                className="px-8 py-4 rounded-2xl bg-green-700 text-white font-bold hover:bg-green-800 shadow-xl shadow-green-700/25 inline-flex items-center gap-2"
              >
                Lihat Dashboard <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* GAMBAR HERO KANAN */}
        <motion.div variants={fadeInUp} className="relative h-[420px] lg:h-[550px] flex items-center justify-center w-full">
          <FloatingLeaf className="-top-2 right-6" delay={0.6} duration={5.5} rotate={15} />

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-6 left-0 lg:-left-6 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/50 w-64 z-20"
          >
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">Sistem Aktif</h4>
                <p className="text-[10px] text-gray-500">Semua Sistem Online</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs font-semibold mb-3">
              {["Kombucha", "Eco Enzyme", "Fruit Enzyme"].map((name) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-gray-700">{name}</span>
                  <span className="text-green-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Online
                  </span>
                </div>
              ))}
            </div>
            <Link to="/dashboard" className="text-green-700 text-xs font-bold flex items-center gap-1 pt-2 border-t border-gray-100">
              Lihat Status Lengkap <ArrowRight size={12} />
            </Link>
          </motion.div>

          <img
            src={heroImage}
            alt="Toples Kombucha dan Perangkat IoT"
            className="w-full h-full object-cover rounded-[3rem]"
          />
        </motion.div>
      </motion.main>

      {/* --- SECTION PILIHAN SISTEM (3 KARTU) --- */}
      <motion.section
        id="fitur"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-6 md:px-16 mt-32 mb-28 text-center relative"
      >
        <FloatingLeaf className="left-2 top-4" delay={0.1} duration={6.5} rotate={-8} />
        <FloatingLeaf className="right-4 bottom-0" delay={1} duration={7} rotate={10} size={28} />

        <motion.div variants={fadeInUp} className="flex flex-col items-center">
          <Leaf className="text-green-600 mb-2" size={20} />
          <span className="text-green-700 font-bold text-sm uppercase tracking-widest block mb-2">Pilih Objek</span>
          <h2 className="text-3xl md:text-[40px] font-black mb-4 text-gray-900">Pilih Sistem yang Ingin <span className="text-green-700">Dipantau</span></h2>
          <p className="text-gray-500 mb-16 text-lg">Monitor kondisi fermentasi secara real-time untuk setiap sistem</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { 
              title: "Kombucha", 
              path: "/kombucha", 
              desc: "Pantau fermentasi kombucha secara real-time untuk hasil terbaik setiap saat.", 
              icon: Droplet 
            },
            { 
              title: "Eco Enzyme", 
              path: "/eco-enzyme", 
              desc: "Pantau fermentasi eco enzyme secara real-time untuk kualitas optimal.", 
              icon: Recycle 
            },
            { 
              title: "Fruit Enzyme", 
              path: "/fruit-enzyme", 
              desc: "Pantau fermentasi fruit enzyme secara real-time untuk hasil terbaik setiap saat.", 
              icon: Apple 
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-56 bg-white rounded-3xl mb-6 relative overflow-hidden border border-gray-100 flex items-center justify-center p-4">
                  <img 
                    src={
                      item.title === "Kombucha" 
                        ? kombuchaImage 
                        : item.title === "Eco Enzyme" 
                        ? ecoEnzymeImage 
                        : fruitEnzymeImage
                    } 
                    alt={item.title} 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-green-700 z-10">
                    <item.icon size={18} />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{item.desc}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-6 text-sm border-t border-gray-100 pt-4">
                  <span className="text-gray-500 font-medium">Status Sistem</span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>Online
                  </span>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={item.path}
                    className="w-full py-3.5 bg-green-700 text-white rounded-2xl font-bold hover:bg-green-800 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-green-700/20"
                  >
                    Lihat Dashboard <ArrowRight size={16} />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* --- SECTION KENAPA MEMILIH FERMASENSE --- */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-6 md:px-16 mb-28 text-center"
      >
        <motion.div variants={fadeInUp} className="mb-16">
          <h2 className="text-3xl md:text-[40px] font-black mb-4 text-gray-900">Kenapa Memilih <span className="text-green-700">FermaSense?</span></h2>
          <p className="text-gray-500 text-lg">Teknologi IoT untuk fermentasi yang lebih baik</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 text-left max-w-3xl mx-auto">
          {[
            { icon: Target, title: "Akurat & Terpercaya", desc: "Data akurat dari sensor berkualitas tinggi yang dapat diandalkan." },
            { icon: Hand, title: "Mudah Digunakan", desc: "Antarmuka intuitif dan responsif, mudah digunakan oleh siapa saja." },
            { icon: Lock, title: "Akses Kapan Saja", desc: "Monitor dari mana saja, 24/7 melalui perangkat favorit Anda." },
            { icon: ShieldCheck, title: "Keamanan Data", desc: "Data aman dengan enkripsi modern dan sistem perlindungan berlapis." }
          ].map((f, i) => (
            <motion.div key={i} variants={fadeInUp} className="flex gap-4 items-start">
              <div className="w-12 h-12 shrink-0 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                <f.icon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* --- SECTION TEKNOLOGI CERDAS (TENTANG) --- */}
      <motion.section
        id="tentang"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="max-w-7xl mx-auto px-6 md:px-16 mb-28"
      >
        <motion.div
          variants={fadeInUp}
          className="bg-green-50/60 rounded-[2.5rem] border border-green-100 p-8 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative overflow-hidden"
        >
          <FloatingLeaf className="top-6 right-10 hidden lg:block" delay={0.3} duration={6} rotate={-12} />

          <div>
            <div className="inline-flex items-center px-4 py-1.5 bg-white text-green-800 text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 inline-block bg-green-600 rounded-full mr-2"></span>
              Tentang FermaSense
            </div>
            <h2 className="text-3xl md:text-[40px] font-black mb-4 text-gray-900 leading-tight">
              Teknologi Cerdas untuk <span className="text-green-700">Fermentasi Alami</span>
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              FermaSense hadir untuk mendukung proses fermentasi alami dengan teknologi IoT. Dapatkan kontrol penuh, informasi real-time, dan hasil fermentasi yang konsisten setiap saat.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: "3+", label: "Sistem Fermentasi" },
                { value: "24/7", label: "Monitoring Aktif" },
                { value: "100%", label: "Data Real-time" }
              ].map((s, i) => (
                <div key={i}>
                  <span className="block text-2xl font-black text-gray-900">{s.value}</span>
                  <span className="text-gray-500 text-xs">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative h-72 lg:h-96 rounded-3xl overflow-hidden border border-white bg-white flex items-center justify-center p-4">
            <img 
              src={keranjangImage} 
              alt="Keranjang buah segar" 
              className="w-full h-full object-contain" 
            />
          </div>
        </motion.div>
      </motion.section>

      {/* --- CTA SECTION --- */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeInUp}
        className="max-w-7xl mx-auto px-6 md:px-16 mb-24 text-center relative"
      >
        <FloatingLeaf className="left-6 top-0" delay={0.2} duration={6} rotate={-16} size={30} />
        <FloatingLeaf className="right-6 bottom-0" delay={0.9} duration={6.5} rotate={18} size={26} />

        <h2 className="text-3xl md:text-[40px] font-black mb-4 text-gray-900">
          Siap Memantau <span className="text-green-700">Fermentasi Anda?</span>
        </h2>
        <p className="text-gray-500 text-lg mb-8">Mulai sekarang dan rasakan kemudahan monitoring real-time</p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/dashboard"
            className="px-8 py-4 rounded-2xl bg-green-700 text-white font-bold hover:bg-green-800 shadow-xl shadow-green-700/25 inline-flex items-center gap-2"
          >
            Mulai Monitoring <ArrowRight size={18} />
          </Link>
        </motion.div>
      </motion.section>

      {/* --- FOOTER --- */}
      <footer id="kontak" className="max-w-7xl mx-auto px-6 md:px-16 pt-10 pb-12 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="flex items-center gap-3">
            {/* Logo Footer diubah menggunakan tag img agar sama dengan navbar */}
            <img
              src={logo}
              alt="Logo FermaSense"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="leading-tight">
              <span className="block text-lg font-black text-gray-900">FermaSense</span>
              <span className="block text-[10px] text-gray-400 font-medium">Monitor. Ferment. Perfect.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Phone size={16} className="text-green-700 mt-0.5 shrink-0" />
            <div>
              <p>08123456789</p>
              <p>01234567891</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm text-gray-600 max-w-xs">
            <MapPin size={16} className="text-green-700 mt-0.5 shrink-0" />
            <p>LAB telekomunikasi dan teknologi informasi.</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-3">Ikuti Kami</p>
            <div className="flex gap-3">
              {["facebook", "instagram", "whatsapp"].map((type) => (
                <a
                  key={type}
                  href="#"
                  aria-label={type}
                  className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-700 hover:bg-green-700 hover:text-white transition-colors"
                >
                  <SocialIcon type={type} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}