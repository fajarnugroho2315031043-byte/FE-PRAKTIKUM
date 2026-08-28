import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplet,
  Recycle,
  Apple,
  Bell,
  Menu,
  Search,
  ArrowRight,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import { fetchBI } from '../services/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const NODE_CONFIG = {
  KOMBUCHA_01: {
    title: 'Kombucha',
    path: '/kombucha',
    icon: Droplet,
  },
  ECO_02: {
    title: 'Eco Enzyme',
    path: '/eco-enzyme',
    icon: Recycle,
  },
  FRUIT_03: {
    title: 'Fruit Enzyme',
    path: '/fruit-enzyme',
    icon: Apple,
  },
};

const getNodeStatus = (lastSeen) => {
  if (!lastSeen) {
    return {
      label: 'Offline',
      className: 'bg-red-50 text-red-700',
      dotClassName: 'bg-red-500',
    };
  }

  const lastSeenTime = new Date(lastSeen).getTime();

  if (Number.isNaN(lastSeenTime)) {
    return {
      label: 'Offline',
      className: 'bg-red-50 text-red-700',
      dotClassName: 'bg-red-500',
    };
  }

  const ageSeconds = (Date.now() - lastSeenTime) / 1000;

  if (ageSeconds <= 60) {
    return {
      label: 'Online',
      className: 'bg-green-50 text-green-700',
      dotClassName: 'bg-green-500',
    };
  }

  if (ageSeconds <= 180) {
    return {
      label: 'Warning',
      className: 'bg-yellow-50 text-yellow-700',
      dotClassName: 'bg-yellow-500',
    };
  }

  return {
    label: 'Offline',
    className: 'bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  };
};

const getLatestReading = (biData, nodeId) => {
  if (!biData || !biData.latest) {
    return null;
  }

  const latest = biData.latest;

  if (Array.isArray(latest)) {
    return (
      latest.find(
        (item) =>
          item?.node_id === nodeId ||
          item?.nodeId === nodeId
      ) || null
    );
  }

  if (typeof latest === 'object') {
    if (latest[nodeId]) {
      return latest[nodeId];
    }

    if (
      latest.node_id === nodeId ||
      latest.nodeId === nodeId
    ) {
      return latest;
    }
  }

  return null;
};

const getNodeLastSeen = (biData, nodeId) => {
  const nodeStatus = biData?.node_status;

  if (!nodeStatus) {
    return null;
  }

  if (Array.isArray(nodeStatus)) {
    const node = nodeStatus.find(
      (item) =>
        item?.node_id === nodeId ||
        item?.nodeId === nodeId
    );

    return node?.last_seen || node?.lastSeen || null;
  }

  if (typeof nodeStatus === 'object') {
    const node = nodeStatus[nodeId];

    if (node) {
      return node?.last_seen || node?.lastSeen || null;
    }
  }

  return null;
};

export default function Dashboard() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [biData, setBiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  const POLLING_INTERVAL =
    Number(import.meta.env.VITE_POLLING_INTERVAL) || 10000;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setError(null);

        const result = await fetchBI();

        if (!isMounted) {
          return;
        }

        setBiData(result);
        setApiAvailable(true);
      } catch (err) {
        console.error(
          '[DASHBOARD] Gagal memuat data:',
          err
        );

        if (isMounted) {
          setApiAvailable(false);
          setError(
            'Backend tidak dapat diakses. Data dashboard belum tersedia.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    const intervalId = setInterval(
      loadDashboard,
      POLLING_INTERVAL
    );

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [POLLING_INTERVAL]);

  const nodeIds = Object.keys(NODE_CONFIG);

  const nodeReadings = nodeIds.reduce(
    (result, nodeId) => {
      result[nodeId] = getLatestReading(
        biData,
        nodeId
      );

      return result;
    },
    {}
  );

  const temperatures = nodeIds
    .map(
      (nodeId) =>
        nodeReadings[nodeId]?.temperature_c
    )
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        !Number.isNaN(Number(value))
    )
    .map(Number);

  const avgTemp =
    temperatures.length > 0
      ? (
          temperatures.reduce(
            (sum, value) => sum + value,
            0
          ) / temperatures.length
        ).toFixed(1)
      : '-';

  const onlineNodes = apiAvailable
    ? nodeIds.filter((nodeId) => {
        const lastSeen = getNodeLastSeen(
          biData,
          nodeId
        );

        return (
          getNodeStatus(lastSeen).label ===
          'Online'
        );
      })
    : [];

  const connectionStatus = loading
    ? {
        label: 'Memuat',
        className: 'bg-gray-50 text-gray-600',
        dotClassName: 'bg-gray-400',
      }
    : !apiAvailable
    ? {
        label: 'Tidak Tersedia',
        className: 'bg-gray-50 text-gray-600',
        dotClassName: 'bg-gray-400',
      }
    : onlineNodes.length === nodeIds.length
    ? {
        label: 'Online',
        className: 'bg-green-50 text-green-700',
        dotClassName: 'bg-green-500',
      }
    : onlineNodes.length > 0
    ? {
        label: 'Sebagian',
        className: 'bg-yellow-50 text-yellow-700',
        dotClassName: 'bg-yellow-500',
      }
    : {
        label: 'Offline',
        className: 'bg-red-50 text-red-700',
        dotClassName: 'bg-red-500',
      };

  const fmt = (value) => {
    if (loading) {
      return '...';
    }

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '-';
    }

    return value;
  };

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setIsMobileMenuOpen(false)
            }
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={
          setIsMobileMenuOpen
        }
      />

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">

        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-10 flex-shrink-0">

          <div className="flex items-center gap-3 md:gap-4">

            <button
              className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() =>
                setIsMobileMenuOpen(true)
              }
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div className="truncate">

              <h1 className="text-lg md:text-xl font-black text-gray-900 truncate">
                Overview Dashboard
              </h1>

              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading
                  ? 'Memuat data dari backend...'
                  : error
                  ? error
                  : 'Data monitoring dari seluruh node'}
              </p>

            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">

            <div className="hidden sm:flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100">

              <Search
                size={16}
                className="text-gray-400 mr-2 flex-shrink-0"
              />

              <input
                type="text"
                placeholder="Cari data..."
                className="bg-transparent border-none outline-none text-sm w-32 md:w-48 text-gray-700 placeholder:text-gray-400"
              />

            </div>

            <button
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell size={18} />
            </button>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-7xl mx-auto space-y-6 sm:space-y-8"
          >

            {/* Ringkasan Sistem */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

              <motion.div
                variants={fadeInUp}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5"
              >

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard
                    size={22}
                    strokeWidth={2.5}
                  />
                </div>

                <div className="min-w-0">

                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">
                    Sistem Berjalan
                  </p>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    {loading
                      ? '...'
                      : !apiAvailable
                      ? '-'
                      : `${onlineNodes.length}/${nodeIds.length} Node`}
                  </h3>

                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 sm:mt-1">
                    {apiAvailable
                      ? 'Node aktif'
                      : 'Menunggu koneksi backend'}
                  </p>

                </div>

              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5"
              >

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <LayoutDashboard
                    size={22}
                    strokeWidth={2.5}
                  />
                </div>

                <div className="min-w-0">

                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">
                    Rata-rata Suhu
                  </p>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    {loading
                      ? '...'
                      : avgTemp === '-'
                      ? '- °C'
                      : `${avgTemp}°C`}
                  </h3>

                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 sm:mt-1">
                    Berdasarkan data sensor
                  </p>

                </div>

              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 sm:gap-5"
              >

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Bell
                    size={22}
                    strokeWidth={2.5}
                  />
                </div>

                <div className="min-w-0">

                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-0.5">
                    Status Koneksi
                  </p>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    {connectionStatus.label}
                  </h3>

                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 sm:mt-1">
                    {apiAvailable
                      ? 'Berdasarkan last seen node'
                      : 'Backend belum tersedia'}
                  </p>

                </div>

              </motion.div>

            </div>

            {/* Akses Cepat */}

            <div>

              <motion.h2
                variants={fadeInUp}
                className="text-base sm:text-lg font-black text-gray-900 mb-4"
              >
                Akses Cepat Sistem
              </motion.h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                {nodeIds.map((nodeId) => {

                  const config =
                    NODE_CONFIG[nodeId];

                  const reading =
                    nodeReadings[nodeId];

                  const lastSeen =
                    getNodeLastSeen(
                      biData,
                      nodeId
                    );

                  const status =
                    apiAvailable
                      ? getNodeStatus(lastSeen)
                      : {
                          label: 'Tidak Tersedia',
                          className:
                            'bg-gray-50 text-gray-600',
                          dotClassName:
                            'bg-gray-400',
                        };

                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={nodeId}
                      variants={fadeInUp}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col justify-between group"
                    >

                      <div>

                        <div className="flex justify-between items-start mb-4">

                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
                            <Icon size={20} />
                          </div>

                          <span
                            className={`${status.className} px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5`}
                          >

                            <span
                              className={`w-1.5 h-1.5 ${status.dotClassName} rounded-full ${
                                status.label ===
                                'Online'
                                  ? 'animate-pulse'
                                  : ''
                              }`}
                            />

                            {status.label}

                          </span>

                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1">
                          {config.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-500 font-medium mb-3">
                          Node: {nodeId}
                        </p>

                        <div className="bg-[#fcfcfb] rounded-xl p-3 mb-5 border border-gray-50 text-xs text-gray-600 font-semibold text-center truncate">

                          {apiAvailable ? (
                            <>
                              pH: {fmt(reading?.ph)}
                              {' | '}
                              Suhu:{' '}
                              {fmt(
                                reading?.temperature_c
                              )}
                              °C
                            </>
                          ) : (
                            'Data belum tersedia'
                          )}

                        </div>

                      </div>

                      <Link
                        to={config.path}
                        className="w-full py-3 bg-gray-50 text-green-700 rounded-2xl font-bold hover:bg-green-700 hover:text-white transition-colors flex justify-center items-center gap-2 text-xs sm:text-sm border border-gray-100 hover:border-green-700 group-hover:shadow-lg group-hover:shadow-green-700/20"
                      >
                        Buka Dashboard
                        <ArrowRight size={16} />
                      </Link>

                    </motion.div>
                  );
                })}

              </div>

            </div>

          </motion.div>

        </div>
      </main>
    </div>
  );
}