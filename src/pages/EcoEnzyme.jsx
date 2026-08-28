import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Droplet,
  Bell,
  Menu,
  Activity,
  Thermometer,
  Wind,
  Gauge,
  Zap,
  CheckCircle2,
  Clock,
  ChevronDown,
  Calendar,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import ecoEnzymeImage from '../assets/eco-enzyme.png';
import { fetchBI } from '../services/api';

// =====================================================================
// ANIMASI
// =====================================================================

const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 20,
  },
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
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// =====================================================================
// KONFIGURASI INDIKATOR
// =====================================================================

const INDICATOR_MAP = {
  ph: {
    label: 'pH',
    unit: '',
    color: '#15803d',
    min: '2.0',
    max: '7.0',
  },

  temperature_c: {
    label: 'Suhu',
    unit: '°C',
    color: '#15803d',
    min: '20°C',
    max: '40°C',
  },

  tds_ppm: {
    label: 'TDS',
    unit: 'ppm',
    color: '#15803d',
    min: '0',
    max: '1000',
  },

  gas_adc: {
    label: 'Gas (ADC)',
    unit: 'ADC',
    color: '#15803d',
    min: '0',
    max: '1024',
  },

  mq3_adc: {
    label: 'Alkohol / MQ3',
    unit: 'ADC',
    color: '#15803d',
    min: '0',
    max: '1024',
  },

  pressure_kpa: {
    label: 'Tekanan',
    unit: 'kPa',
    color: '#15803d',
    min: '90',
    max: '110',
  },
};

// =====================================================================
// HELPER
// =====================================================================

const getDateRange = (
  selectedDate,
  selectedTimeRange
) => {
  const start = new Date(
    `${selectedDate}T00:00:00`
  );

  let end = new Date(start);

  switch (selectedTimeRange) {
    case '12 Jam':
      end.setHours(end.getHours() + 12);
      break;

    case '3 Hari':
      end.setDate(end.getDate() + 3);
      break;

    case '7 Hari':
      end.setDate(end.getDate() + 7);
      break;

    case '24 Jam':
    default:
      end.setDate(end.getDate() + 1);
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const formatValue = (
  value,
  decimals = 2
) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '-';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '-';
  }

  return number.toFixed(decimals);
};

const getSensorStatus = (status) => {
  switch (status) {
    case 'normal':
      return {
        label: 'Normal',
        className:
          'bg-green-50 text-green-700',
        dotClassName: 'bg-green-500',
      };

    case 'warning':
      return {
        label: 'Warning',
        className:
          'bg-yellow-50 text-yellow-700',
        dotClassName:
          'bg-yellow-500',
      };

    case 'critical':
      return {
        label: 'Critical',
        className:
          'bg-red-50 text-red-700',
        dotClassName:
          'bg-red-500',
      };

    case 'no_data':
    default:
      return {
        label: 'Tidak Ada Data',
        className:
          'bg-gray-50 text-gray-600',
        dotClassName:
          'bg-gray-400',
      };
  }
};

// =====================================================================
// KOMPONEN UTAMA
// =====================================================================

export default function EcoEnzyme() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [
    isCollapsed,
    setIsCollapsed,
  ] = useState(false);

  const [
    selectedNode,
    setSelectedNode,
  ] = useState('ECO_02');

  const [
    selectedIndicator,
    setSelectedIndicator,
  ] = useState('ph');

  const [
    selectedTimeRange,
    setSelectedTimeRange,
  ] = useState('24 Jam');

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(() => {
    const today = new Date();

    return today.toLocaleDateString(
      'en-CA'
    );
  });

  const [
    biData,
    setBiData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    apiAvailable,
    setApiAvailable,
  ] = useState(true);

  const POLLING_INTERVAL =
    Number(
      import.meta.env
        .VITE_POLLING_INTERVAL
    ) || 10000;

  // ===================================================================
  // MOBILE MENU
  // ===================================================================

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // ===================================================================
  // FILTER TANGGAL
  // ===================================================================

  const dateRange = useMemo(
    () =>
      getDateRange(
        selectedDate,
        selectedTimeRange
      ),
    [
      selectedDate,
      selectedTimeRange,
    ]
  );

  // ===================================================================
  // FETCH DATA
  // ===================================================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const result = await fetchBI({
          node_id: selectedNode,
          start: dateRange.start,
          end: dateRange.end,
          limit: 100,
        });

        if (!isMounted) {
          return;
        }

        setBiData(result);
        setApiAvailable(true);
        setError(null);
      } catch (err) {
        console.error(
          '[ECO ENZYME] Gagal memuat data:',
          err
        );

        if (isMounted) {
          setBiData(null);
          setApiAvailable(false);

          setError(
            'Backend tidak dapat diakses. Data sensor belum tersedia.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);

    loadData();

    const intervalId =
      setInterval(
        loadData,
        POLLING_INTERVAL
      );

    return () =>
      clearInterval(intervalId);
  }, [
    selectedNode,
    dateRange.start,
    dateRange.end,
    POLLING_INTERVAL,
  ]);

  // ===================================================================
  // DATA BACKEND
  // ===================================================================

  const latest =
    biData?.latest || null;

  const timeSeries = useMemo(() => {
    const rows = Array.isArray(
      biData?.raw_data?.data
    )
      ? biData.raw_data.data
      : [];

    return [...rows].sort(
      (a, b) =>
        new Date(a.timestamp) -
        new Date(b.timestamp)
    );
  }, [biData]);

  const totalRows =
    Number(
      biData?.raw_data?.count
    ) || 0;

  const sensorStatus =
    biData?.sensor_status || {};

  const networkStatus =
    biData?.network_status || {};

  // ===================================================================
  // STATUS SENSOR
  // ===================================================================

  const temperatureStatus =
    getSensorStatus(
      sensorStatus.temperature
    );

  const phStatus =
    getSensorStatus(
      sensorStatus.ph
    );

  const pressureStatus =
    getSensorStatus(
      sensorStatus.pressure
    );

  const tdsStatus =
    getSensorStatus(
      sensorStatus.tds
    );

  // ===================================================================
  // STATUS NODE
  // ===================================================================

  const lastSeen =
    latest?.timestamp ||
    biData?.overview?.last_reading ||
    null;

  const getNodeStatus = () => {
    if (!apiAvailable) {
      return {
        label: 'Tidak Tersedia',
        className:
          'bg-gray-50 text-gray-600',
        dotClassName:
          'bg-gray-400',
      };
    }

    if (!lastSeen) {
      return {
        label: 'Tidak Ada Data',
        className:
          'bg-gray-50 text-gray-600',
        dotClassName:
          'bg-gray-400',
      };
    }

    const lastSeenTime =
      new Date(lastSeen).getTime();

    if (Number.isNaN(lastSeenTime)) {
      return {
        label: 'Tidak Ada Data',
        className:
          'bg-gray-50 text-gray-600',
        dotClassName:
          'bg-gray-400',
      };
    }

    const ageSeconds =
      (Date.now() -
        lastSeenTime) /
      1000;

    if (ageSeconds <= 60) {
      return {
        label: 'Online',
        className:
          'bg-green-50 text-green-700',
        dotClassName:
          'bg-green-500',
      };
    }

    if (ageSeconds <= 180) {
      return {
        label: 'Warning',
        className:
          'bg-yellow-50 text-yellow-700',
        dotClassName:
          'bg-yellow-500',
      };
    }

    return {
      label: 'Offline',
      className:
        'bg-red-50 text-red-700',
      dotClassName:
        'bg-red-500',
    };
  };

  const nodeStatus =
    getNodeStatus();

  // ===================================================================
  // INDIKATOR AKTIF
  // ===================================================================

  const currentConfig =
    INDICATOR_MAP[
      selectedIndicator
    ] || INDICATOR_MAP.ph;

  // ===================================================================
  // GRAFIK
  // ===================================================================

  const generateSvgPoints = (
    dataArray,
    field
  ) => {
    if (
      !dataArray ||
      dataArray.length === 0
    ) {
      return '0,50 800,50';
    }

    const values = dataArray
      .map((item) =>
        Number(item[field])
      )
      .filter(Number.isFinite);

    if (values.length === 0) {
      return '0,50 800,50';
    }

    const minVal =
      Math.min(...values);

    const maxVal =
      Math.max(...values);

    const range =
      maxVal - minVal === 0
        ? 1
        : maxVal - minVal;

    return dataArray
      .map((item, index) => {
        const value =
          Number(item[field]);

        if (
          !Number.isFinite(value)
        ) {
          return null;
        }

        const x =
          (index /
            (dataArray.length -
              1 || 1)) *
          800;

        const y =
          100 -
          ((value - minVal) /
            range) *
            80 -
          10;

        return `${x.toFixed(
          1
        )},${y.toFixed(1)}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  const chartPoints =
    generateSvgPoints(
      timeSeries,
      selectedIndicator
    );

  const chartPointArray =
    chartPoints.split(' ');

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">

      {/* ============================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ============================================================= */}

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={() =>
              setIsMobileMenuOpen(
                false
              )
            }
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* SIDEBAR */}
      {/* ============================================================= */}

      <Sidebar
        isCollapsed={
          isCollapsed
        }
        setIsCollapsed={
          setIsCollapsed
        }
        isMobileMenuOpen={
          isMobileMenuOpen
        }
        setIsMobileMenuOpen={
          setIsMobileMenuOpen
        }
        activeImage={
          ecoEnzymeImage
        }
        activeTitle="Eco Enzyme Active"
      />

      {/* ============================================================= */}
      {/* MAIN */}
      {/* ============================================================= */}

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">

        {/* =========================================================== */}
        {/* HEADER */}
        {/* =========================================================== */}

        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-10 z-10 flex-shrink-0">

          <div className="flex items-center gap-3 md:gap-4 truncate">

            <button
              className="md:hidden p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() =>
                setIsMobileMenuOpen(
                  true
                )
              }
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div className="truncate">

              <h1 className="text-base sm:text-xl font-black text-gray-900 truncate">
                Dashboard Eco Enzyme
              </h1>

              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading
                  ? 'Memuat data...'
                  : error
                  ? error
                  : 'Data monitoring Eco Enzyme'}
              </p>

            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">

            {/* WAKTU TERBARU */}

            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">

              <Clock
                size={14}
                className="text-green-700"
              />

              <span>
                {latest?.timestamp
                  ? new Date(
                      latest.timestamp
                    ).toLocaleString(
                      'id-ID'
                    )
                  : 'Belum ada data'}
              </span>

            </div>

            {/* NODE */}

            <div className="relative">

              <select
                value={
                  selectedNode
                }
                onChange={(e) =>
                  setSelectedNode(
                    e.target.value
                  )
                }
                className="appearance-none bg-green-50 text-green-700 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-green-200 outline-none cursor-pointer"
              >
                <option value="ECO_02">
                  ECO_02
                </option>
              </select>

              <ChevronDown
                size={14}
                className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-green-700 pointer-events-none"
              />

            </div>

            {/* NOTIFICATION */}

            <button
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell size={18} />

              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

          </div>
        </header>

        {/* =========================================================== */}
        {/* CONTENT */}
        {/* =========================================================== */}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={
              staggerContainer
            }
            className="max-w-7xl mx-auto space-y-6 sm:space-y-8"
          >

            {/* ======================================================= */}
            {/* FILTER */}
            {/* ======================================================= */}

            <motion.div
              variants={fadeInUp}
              className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm"
            >

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-sm font-black text-gray-900">
                    Filter Data
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    Pilih tanggal dan periode monitoring.
                  </p>

                </div>

                <div className="flex flex-col sm:flex-row gap-3">

                  {/* TANGGAL */}

                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">

                    <Calendar
                      size={15}
                      className="text-green-700"
                    />

                    <input
                      type="date"
                      value={
                        selectedDate
                      }
                      onChange={(e) =>
                        setSelectedDate(
                          e.target.value
                        )
                      }
                      className="bg-transparent outline-none text-xs font-semibold text-gray-700"
                    />

                  </div>

                  {/* PERIODE */}

                  <div className="relative">

                    <select
                      value={
                        selectedTimeRange
                      }
                      onChange={(e) =>
                        setSelectedTimeRange(
                          e.target.value
                        )
                      }
                      className="appearance-none bg-green-50 text-green-700 font-bold text-xs px-3 py-2 pr-8 rounded-xl border border-green-200 outline-none cursor-pointer"
                    >

                      <option>
                        12 Jam
                      </option>

                      <option>
                        24 Jam
                      </option>

                      <option>
                        3 Hari
                      </option>

                      <option>
                        7 Hari
                      </option>

                    </select>

                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-2.5 text-green-700 pointer-events-none"
                    />

                  </div>

                </div>

              </div>

            </motion.div>

            {/* ======================================================= */}
            {/* SENSOR CARDS */}
            {/* ======================================================= */}

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            >

              {[
                {
                  label: 'Suhu',
                  value: loading
                    ? '...'
                    : apiAvailable
                    ? latest?.temperature_c !=
                      null
                      ? `${formatValue(
                          latest.temperature_c,
                          1
                        )}°C`
                      : '-'
                    : '-',
                  icon: Thermometer,
                  color:
                    'text-orange-500',
                  status:
                    temperatureStatus,
                },

                {
                  label: 'Gas (ADC)',
                  value: loading
                    ? '...'
                    : apiAvailable
                    ? formatValue(
                        latest?.gas_adc,
                        0
                      )
                    : '-',
                  icon: Wind,
                  color:
                    'text-blue-500',
                  status: null,
                },

                {
                  label: 'pH',
                  value: loading
                    ? '...'
                    : apiAvailable
                    ? formatValue(
                        latest?.ph,
                        2
                      )
                    : '-',
                  icon: Droplet,
                  color:
                    'text-green-700',
                  status: phStatus,
                },

                {
                  label: 'Tekanan',
                  value: loading
                    ? '...'
                    : apiAvailable
                    ? latest?.pressure_kpa !=
                      null
                      ? `${formatValue(
                          latest.pressure_kpa,
                          2
                        )} kPa`
                      : '-'
                    : '-',
                  icon: Gauge,
                  color:
                    'text-purple-500',
                  status:
                    pressureStatus,
                },

                {
                  label: 'TDS',
                  value: loading
                    ? '...'
                    : apiAvailable
                    ? latest?.tds_ppm !=
                      null
                      ? `${formatValue(
                          latest.tds_ppm,
                          0
                        )} ppm`
                      : '-'
                    : '-',
                  icon: Activity,
                  color:
                    'text-indigo-500',
                  status:
                    tdsStatus,
                },

                {
                  label:
                    'Alkohol (MQ3)',
                  value: loading
                    ? '...'
                    : apiAvailable
                    ? formatValue(
                        latest?.mq3_adc,
                        0
                      )
                    : '-',
                  icon: Zap,
                  color:
                    'text-amber-500',
                  status: null,
                },
              ].map(
                (
                  sensor,
                  index
                ) => {

                  const SensorIcon =
                    sensor.icon;

                  return (
                    <div
                      key={index}
                      className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
                    >

                      <div className="flex justify-between items-center mb-2">

                        <span className="text-[11px] sm:text-xs font-bold text-gray-400 truncate">
                          {
                            sensor.label
                          }
                        </span>

                        <SensorIcon
                          size={16}
                          className={`${sensor.color} flex-shrink-0`}
                        />

                      </div>

                      <div>

                        <h4 className="text-base sm:text-lg font-black text-gray-900">
                          {
                            sensor.value
                          }
                        </h4>

                        {sensor.status ? (
                          <span
                            className={`${sensor.status.className} inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${sensor.status.dotClassName}`}
                            />

                            {
                              sensor.status.label
                            }

                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                            {apiAvailable
                              ? 'Data'
                              : 'Tidak Tersedia'}
                          </span>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </motion.div>

            {/* ======================================================= */}
            {/* GRAFIK + STATUS NODE */}
            {/* ======================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ===================================================== */}
              {/* GRAFIK */}
              {/* ===================================================== */}

              <motion.div
                variants={fadeInUp}
                className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between"
              >

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">

                  <div>

                    <h3 className="text-base font-black text-gray-900">
                      Grafik Time-Series{' '}
                      {
                        currentConfig.label
                      }
                    </h3>

                    <p className="text-xs text-gray-400">
                      {apiAvailable
                        ? `Data monitoring (${timeSeries.length} titik data)`
                        : 'Data belum tersedia'}
                    </p>

                  </div>

                  <div className="relative flex-1 sm:flex-initial">

                    <select
                      value={
                        selectedIndicator
                      }
                      onChange={(e) =>
                        setSelectedIndicator(
                          e.target.value
                        )
                      }
                      className="w-full appearance-none bg-green-50 text-green-700 font-bold text-xs px-3 py-2 pr-7 rounded-xl border border-green-200 outline-none cursor-pointer"
                    >

                      <option value="ph">
                        pH
                      </option>

                      <option value="temperature_c">
                        Suhu
                      </option>

                      <option value="tds_ppm">
                        TDS
                      </option>

                      <option value="gas_adc">
                        Gas (ADC)
                      </option>

                      <option value="pressure_kpa">
                        Tekanan
                      </option>

                      <option value="mq3_adc">
                        Alkohol (MQ3)
                      </option>

                    </select>

                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-3 text-green-700 pointer-events-none"
                    />

                  </div>

                </div>

                <div className="h-60 w-full bg-white rounded-2xl border border-gray-100 p-2 sm:p-4 relative flex flex-col justify-between">

                  <div className="absolute left-1 sm:left-2 top-4 bottom-8 flex flex-col justify-between text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pointer-events-none">

                    <span>
                      {
                        currentConfig.max
                      }
                    </span>

                    <span>
                      {
                        currentConfig.min
                      }
                    </span>

                  </div>

                  <div className="relative z-10 w-full h-40 flex items-center pl-6 sm:pl-8 pr-2">

                    {loading ? (
                      <div className="w-full text-center text-xs text-gray-400">
                        Memuat data grafik...
                      </div>
                    ) : !apiAvailable ? (
                      <div className="w-full text-center text-xs text-gray-400">
                        Backend belum tersedia
                      </div>
                    ) : timeSeries.length ===
                      0 ? (
                      <div className="w-full text-center text-xs text-gray-400">
                        Belum ada data pada periode yang dipilih
                      </div>
                    ) : (
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 800 100"
                        preserveAspectRatio="none"
                      >

                        <polyline
                          fill="none"
                          stroke={
                            currentConfig.color
                          }
                          strokeWidth="2.5"
                          points={
                            chartPoints
                          }
                        />

                        {chartPointArray.map(
                          (
                            point,
                            index
                          ) => {

                            if (
                              !point
                            ) {
                              return null;
                            }

                            const [
                              cx,
                              cy,
                            ] =
                              point.split(
                                ','
                              );

                            return (
                              <circle
                                key={
                                  index
                                }
                                cx={cx}
                                cy={cy}
                                r="3"
                                fill="white"
                                stroke={
                                  currentConfig.color
                                }
                                strokeWidth="2"
                              />
                            );
                          }
                        )}

                      </svg>
                    )}

                  </div>

                  <div className="relative z-10 flex justify-between pl-6 sm:pl-8 pr-2 text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pt-2 border-t border-gray-100">

                    <span>
                      Awal Data
                    </span>

                    <span>
                      Terbaru
                    </span>

                  </div>

                </div>

              </motion.div>

              {/* ===================================================== */}
              {/* STATUS NODE */}
              {/* ===================================================== */}

              <motion.div
                variants={fadeInUp}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between"
              >

                <div>

                  <div className="flex justify-between items-center mb-4">

                    <h3 className="text-base font-black text-gray-900">
                      Status Node
                    </h3>

                    <span
                      className={`${nodeStatus.className} font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1`}
                    >

                      <span
                        className={`w-1.5 h-1.5 rounded-full ${nodeStatus.dotClassName} ${
                          nodeStatus.label ===
                          'Online'
                            ? 'animate-pulse'
                            : ''
                        }`}
                      />

                      {
                        nodeStatus.label
                      }

                    </span>

                  </div>

                  <p className="text-sm font-bold text-gray-800 mb-1">
                    Node ID:{' '}
                    {selectedNode}
                  </p>

                  <p className="text-xs text-gray-400 mb-4">
                    Total Record:{' '}
                    {apiAvailable
                      ? totalRows
                      : '-'}
                  </p>

                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">

                    <div
                      className={`h-full rounded-full ${
                        nodeStatus.label ===
                        'Online'
                          ? 'bg-green-700 w-full'
                          : nodeStatus.label ===
                            'Warning'
                          ? 'bg-yellow-500 w-2/3'
                          : nodeStatus.label ===
                            'Offline'
                          ? 'bg-red-500 w-1/3'
                          : 'bg-gray-300 w-0'
                      }`}
                    />

                  </div>

                </div>

                {/* NETWORK */}

                <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">

                  <div>

                    <span className="block text-xs font-bold text-green-800">
                      Kualitas Jaringan
                    </span>

                    <span className="text-[11px] text-green-600">
                      RSSI:{' '}
                      {apiAvailable &&
                      latest?.rssi_dbm !=
                        null
                        ? `${formatValue(
                            latest.rssi_dbm,
                            0
                          )} dBm`
                        : '-'}
                    </span>

                    {apiAvailable &&
                      networkStatus.signal && (
                        <span className="block text-[10px] font-semibold text-gray-500 mt-1">
                          Status:{' '}
                          {
                            getSensorStatus(
                              networkStatus.signal
                            ).label
                          }
                        </span>
                      )}

                  </div>

                  <CheckCircle2
                    size={24}
                    className={
                      apiAvailable
                        ? 'text-green-700 flex-shrink-0'
                        : 'text-gray-400 flex-shrink-0'
                    }
                  />

                </div>

              </motion.div>

            </div>

          </motion.div>

        </div>
      </main>
    </div>
  );
}