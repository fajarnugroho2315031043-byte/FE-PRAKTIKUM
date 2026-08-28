// src/pages/NetworkPerf.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  Wifi,
  Activity,
  ArrowDownUp,
  ShieldAlert,
  Clock,
  ChevronDown,
  Layers,
  Database,
  Server,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import { fetchBI } from '../services/api';

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
      staggerChildren: 0.08,
    },
  },
};

// =====================================================================
// HELPER: AMBIL DATA RAW DARI RESPONSE BI
// =====================================================================

const getRowsFromBI = (result) => {
  if (Array.isArray(result?.raw_data?.data)) {
    return result.raw_data.data;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
};

// =====================================================================
// HITUNG METRIK JARINGAN
// =====================================================================

const computeNetworkMetrics = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      avgRssi: null,
      avgLatency: null,
      avgJitter: null,
      lostPackets: 0,
      packetLossPct: null,
      packetRate: null,
      interArrival: null,
      deliveryRate: null,
      duplicatePackets: 0,
      outOfOrderPackets: 0,
      totalRows: 0,
    };
  }

  // ---------------------------------------------------------------
  // RSSI
  // ---------------------------------------------------------------

  const rssiValues = rows
    .map((row) => Number(row.rssi_dbm))
    .filter(Number.isFinite);

  const avgRssi =
    rssiValues.length > 0
      ? rssiValues.reduce(
          (sum, value) => sum + value,
          0
        ) / rssiValues.length
      : null;

  // ---------------------------------------------------------------
  // LATENCY
  // ---------------------------------------------------------------

  const latencyRows = rows
    .filter(
      (row) =>
        row.timestamp &&
        row.received_at
    )
    .map((row) => ({
      timestamp: new Date(
        row.timestamp
      ).getTime(),

      receivedAt: new Date(
        row.received_at
      ).getTime(),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.timestamp) &&
        Number.isFinite(row.receivedAt) &&
        row.receivedAt >= row.timestamp
    );

  const latencies = latencyRows.map(
    (row) =>
      row.receivedAt -
      row.timestamp
  );

  const avgLatency =
    latencies.length > 0
      ? latencies.reduce(
          (sum, value) => sum + value,
          0
        ) / latencies.length
      : null;

  // ---------------------------------------------------------------
  // JITTER
  // ---------------------------------------------------------------

  const jitterValues = latencies
    .slice(1)
    .map((value, index) =>
      Math.abs(
        value -
        latencies[index]
      )
    );

  const avgJitter =
    jitterValues.length > 0
      ? jitterValues.reduce(
          (sum, value) => sum + value,
          0
        ) / jitterValues.length
      : null;

  // ---------------------------------------------------------------
  // SEQUENCE
  // ---------------------------------------------------------------

  const sequenceValues = rows
    .map((row) => Number(row.sequence))
    .filter(Number.isFinite);

  // Sequence unik digunakan untuk menghitung packet loss.
  // Duplicate tetap dihitung secara terpisah.
  const uniqueSequences = [
    ...new Set(sequenceValues),
  ].sort(
    (a, b) => a - b
  );

  let lostPackets = 0;

  for (
    let index = 1;
    index < uniqueSequences.length;
    index++
  ) {
    const gap =
      uniqueSequences[index] -
      uniqueSequences[index - 1] -
      1;

    if (gap > 0) {
      lostPackets += gap;
    }
  }

  const expectedPackets =
    uniqueSequences.length +
    lostPackets;

  const packetLossPct =
    expectedPackets > 0
      ? (lostPackets /
          expectedPackets) *
        100
      : null;

  const deliveryRate =
    expectedPackets > 0
      ? (uniqueSequences.length /
          expectedPackets) *
        100
      : null;

  // ---------------------------------------------------------------
  // DUPLICATE PACKET
  // ---------------------------------------------------------------

  let duplicatePackets = 0;

  if (sequenceValues.length > 0) {
    const sequenceSet =
      new Set();

    sequenceValues.forEach(
      (sequence) => {
        if (
          sequenceSet.has(
            sequence
          )
        ) {
          duplicatePackets++;
        } else {
          sequenceSet.add(
            sequence
          );
        }
      }
    );
  }

  // ---------------------------------------------------------------
  // OUT OF ORDER PACKET
  // ---------------------------------------------------------------

  let outOfOrderPackets = 0;

  for (
    let index = 1;
    index < sequenceValues.length;
    index++
  ) {
    if (
      sequenceValues[index] <
      sequenceValues[index - 1]
    ) {
      outOfOrderPackets++;
    }
  }

  // ---------------------------------------------------------------
  // INTER-ARRIVAL TIME
  // ---------------------------------------------------------------

  const timestamps = rows
    .map((row) =>
      new Date(
        row.received_at ||
          row.timestamp
      ).getTime()
    )
    .filter(Number.isFinite)
    .sort(
      (a, b) => a - b
    );

  const interArrivalValues =
    timestamps
      .slice(1)
      .map(
        (timestamp, index) =>
          timestamp -
          timestamps[index]
      )
      .filter(
        (value) => value >= 0
      );

  const interArrival =
    interArrivalValues.length >
    0
      ? interArrivalValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        interArrivalValues.length
      : null;

  // ---------------------------------------------------------------
  // PACKET RATE
  // ---------------------------------------------------------------

  let packetRate = null;

  if (timestamps.length >= 2) {
    const first =
      timestamps[0];

    const last =
      timestamps[
        timestamps.length - 1
      ];

    const durationSeconds =
      (last - first) / 1000;

    if (durationSeconds > 0) {
      packetRate =
        timestamps.length /
        durationSeconds;
    }
  }

  return {
    avgRssi,
    avgLatency,
    avgJitter,
    lostPackets,
    packetLossPct,
    packetRate,
    interArrival,
    deliveryRate,
    duplicatePackets,
    outOfOrderPackets,
    totalRows: rows.length,
  };
};

// =====================================================================
// FORMAT NILAI
// =====================================================================

const formatNumber = (
  value,
  decimals = 1
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return '-';
  }

  return Number(value).toFixed(
    decimals
  );
};

// =====================================================================
// STATUS NODE
// =====================================================================

const getNodeStatus = (data) => {
  if (!data?.timestamp) {
    return {
      label: 'Tidak Tersedia',
      className:
        'bg-gray-100 text-gray-500',
      dotClassName:
        'bg-gray-400',
    };
  }

  const timestamp =
    new Date(
      data.timestamp
    ).getTime();

  if (
    !Number.isFinite(timestamp)
  ) {
    return {
      label: 'Tidak Tersedia',
      className:
        'bg-gray-100 text-gray-500',
      dotClassName:
        'bg-gray-400',
    };
  }

  const age =
    (Date.now() - timestamp) /
    1000;

  if (age <= 60) {
    return {
      label: 'Online',
      className:
        'bg-green-50 text-green-600',
      dotClassName:
        'bg-green-500',
    };
  }

  if (age <= 180) {
    return {
      label: 'Warning',
      className:
        'bg-yellow-50 text-yellow-600',
      dotClassName:
        'bg-yellow-500',
    };
  }

  return {
    label: 'Offline',
    className:
      'bg-red-50 text-red-600',
    dotClassName:
      'bg-red-500',
  };
};

// =====================================================================
// KOMPONEN
// =====================================================================

export default function NetworkPerf() {
  const location =
    useLocation();

  const currentPath =
    location.pathname;

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
  ] = useState('');

  const [
    rows,
    setRows,
  ] = useState([]);

  const [
    latest,
    setLatest,
  ] = useState(null);

  const [
    nodeLatest,
    setNodeLatest,
  ] = useState({
    KOMBUCHA_01: null,
    ECO_02: null,
    FRUIT_03: null,
  });

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
    setIsMobileMenuOpen(
      false
    );
  }, [currentPath]);

  // ===================================================================
  // LOAD DATA UTAMA
  // ===================================================================

  useEffect(() => {
    let isMounted = true;

    const loadNetworkData =
      async () => {
        try {
          const filters = {
            limit: 100,
          };

          if (selectedNode) {
            filters.node_id =
              selectedNode;
          }

          const result =
            await fetchBI(
              filters
            );

          const data =
            getRowsFromBI(
              result
            );

          const sorted = [
            ...data,
          ].sort(
            (a, b) =>
              new Date(
                a.timestamp ||
                  a.received_at
              ) -
              new Date(
                b.timestamp ||
                  b.received_at
              )
          );

          if (!isMounted) {
            return;
          }

          setRows(sorted);

          setLatest(
            sorted[
              sorted.length - 1
            ] || null
          );

          setApiAvailable(
            true
          );

          setError(null);
        } catch (err) {
          console.error(
            '[NETWORK PERF] Gagal memuat data:',
            err
          );

          if (isMounted) {
            setRows([]);
            setLatest(null);

            setApiAvailable(
              false
            );

            setError(
              'Backend tidak dapat diakses. Data jaringan belum tersedia.'
            );
          }
        } finally {
          if (isMounted) {
            setLoading(
              false
            );
          }
        }
      };

    setLoading(true);

    loadNetworkData();

    const intervalId =
      setInterval(
        loadNetworkData,
        POLLING_INTERVAL
      );

    return () => {
      isMounted = false;

      clearInterval(
        intervalId
      );
    };
  }, [
    selectedNode,
    POLLING_INTERVAL,
  ]);

  // ===================================================================
  // LOAD STATUS SETIAP NODE
  // ===================================================================

  useEffect(() => {
    let isMounted = true;

    const loadNodeStatus =
      async () => {
        try {
          const [
            kombucha,
            eco,
            fruit,
          ] = await Promise.all([
            fetchBI({
              node_id:
                'KOMBUCHA_01',
              limit: 1,
            }).catch(
              () => null
            ),

            fetchBI({
              node_id:
                'ECO_02',
              limit: 1,
            }).catch(
              () => null
            ),

            fetchBI({
              node_id:
                'FRUIT_03',
              limit: 1,
            }).catch(
              () => null
            ),
          ]);

          if (!isMounted) {
            return;
          }

          const getLatest =
            (result) => {
              const data =
                getRowsFromBI(
                  result
                );

              if (
                data.length === 0
              ) {
                return null;
              }

              return [
                ...data,
              ].sort(
                (a, b) =>
                  new Date(
                    b.timestamp ||
                      b.received_at
                  ) -
                  new Date(
                    a.timestamp ||
                      a.received_at
                  )
              )[0];
            };

          setNodeLatest({
            KOMBUCHA_01:
              getLatest(
                kombucha
              ),

            ECO_02:
              getLatest(
                eco
              ),

            FRUIT_03:
              getLatest(
                fruit
              ),
          });
        } catch (err) {
          console.error(
            '[NETWORK PERF] Gagal mengambil status node:',
            err
          );
        }
      };

    loadNodeStatus();

    const intervalId =
      setInterval(
        loadNodeStatus,
        POLLING_INTERVAL
      );

    return () =>
      clearInterval(
        intervalId
      );
  }, [
    POLLING_INTERVAL,
  ]);

  // ===================================================================
  // METRIK
  // ===================================================================

  const metrics = useMemo(
    () =>
      computeNetworkMetrics(
        rows
      ),
    [rows]
  );

  // ===================================================================
  // SPESIFIKASI METRIK
  // ===================================================================

  const metricSpecs = [
    {
      metric: 'RSSI',
      source: 'rssi_dbm',
      function:
        'Mengukur kekuatan sinyal jaringan node.',
    },

    {
      metric: 'Packet Loss',
      source: 'sequence',
      function:
        'Mengetahui jumlah paket data yang diperkirakan hilang.',
    },

    {
      metric:
        'Latency / Delay',
      source:
        'timestamp + received_at',
      function:
        'Mengukur waktu tempuh data sensor sampai diterima backend.',
    },

    {
      metric: 'Jitter',
      source:
        'timestamp + received_at',
      function:
        'Mengukur variasi delay antar paket data.',
    },

    {
      metric: 'Packet Rate',
      source:
        'timestamp / received_at',
      function:
        'Mengukur jumlah paket yang diterima per detik.',
    },

    {
      metric:
        'Inter-arrival Time',
      source:
        'timestamp / received_at',
      function:
        'Mengukur jarak waktu kedatangan antar paket.',
    },

    {
      metric:
        'Reception / Delivery Rate',
      source: 'sequence',
      function:
        'Mengukur persentase paket yang berhasil diterima.',
    },

    {
      metric:
        'Duplicate Packet',
      source: 'sequence',
      function:
        'Mendeteksi paket dengan sequence yang sama.',
    },

    {
      metric:
        'Out-of-Order Packet',
      source: 'sequence',
      function:
        'Mendeteksi paket yang diterima tidak berurutan.',
    },

    {
      metric:
        'Connection / Node Availability',
      source:
        'timestamp per node_id',
      function:
        'Menilai apakah node tersedia berdasarkan waktu data terakhir.',
    },

    {
      metric:
        'Data Freshness',
      source: 'timestamp',
      function:
        'Menilai seberapa baru data sensor diterima.',
    },
  ];

  // ===================================================================
  // KARTU METRIK
  // ===================================================================

  const metricCards = [
    {
      label: 'Sinyal (RSSI)',
      value:
        loading
          ? '...'
          : apiAvailable
          ? `${formatNumber(
              metrics.avgRssi
            )} dBm`
          : '-',
      status:
        apiAvailable &&
        metrics.avgRssi !== null
          ? 'Rata-rata'
          : 'Tidak tersedia',
      icon: Wifi,
      color:
        'text-blue-600',
    },

    {
      label: 'Latensi',
      value:
        loading
          ? '...'
          : apiAvailable
          ? `${formatNumber(
              metrics.avgLatency
            )} ms`
          : '-',
      status:
        apiAvailable &&
        metrics.avgLatency !== null
          ? 'Rata-rata'
          : 'Tidak tersedia',
      icon: Activity,
      color:
        'text-green-600',
    },

    {
      label: 'Packet Loss',
      value:
        loading
          ? '...'
          : apiAvailable &&
            metrics.packetLossPct !==
              null
          ? `${formatNumber(
              metrics.packetLossPct,
              2
            )}%`
          : '-',
      status:
        apiAvailable
          ? `${metrics.lostPackets} hilang`
          : 'Tidak tersedia',
      icon: ShieldAlert,
      color:
        'text-purple-600',
    },

    {
      label: 'Jitter',
      value:
        loading
          ? '...'
          : apiAvailable
          ? `${formatNumber(
              metrics.avgJitter
            )} ms`
          : '-',
      status:
        apiAvailable &&
        metrics.avgJitter !== null
          ? 'Variasi Delay'
          : 'Tidak tersedia',
      icon: Layers,
      color:
        'text-amber-500',
    },

    {
      label: 'Total Record',
      value:
        loading
          ? '...'
          : apiAvailable
          ? `${rows.length} pkt`
          : '-',
      status:
        apiAvailable
          ? 'Terekam'
          : 'Tidak tersedia',
      icon: ArrowDownUp,
      color:
        'text-indigo-600',
    },

    {
      label: 'Data Freshness',
      value:
        loading
          ? '...'
          : apiAvailable &&
            latest?.timestamp
          ? new Date(
              latest.timestamp
            ).toLocaleTimeString(
              'id-ID'
            )
          : '-',
      status:
        apiAvailable &&
        latest?.timestamp
          ? 'Data terakhir'
          : 'Tidak tersedia',
      icon: Database,
      color:
        'text-teal-600',
    },
  ];

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">

      {/* MOBILE OVERLAY */}

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

      {/* SIDEBAR */}

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
      />

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">

        {/* HEADER */}

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
                Performa Jaringan IoT
              </h1>

              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading
                  ? 'Memuat data...'
                  : error
                  ? error
                  : 'Pantau latensi, RSSI, jitter, dan packet loss secara real-time'}
              </p>

            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">

            {/* WAKTU */}

            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">

              <Clock
                size={14}
                className="text-blue-600"
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

            {/* FILTER NODE */}

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
                className="appearance-none bg-blue-50 text-blue-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-blue-200 outline-none cursor-pointer"
              >

                <option value="">
                  Semua Node
                </option>

                <option value="KOMBUCHA_01">
                  KOMBUCHA_01
                </option>

                <option value="ECO_02">
                  ECO_02
                </option>

                <option value="FRUIT_03">
                  FRUIT_03
                </option>

              </select>

              <ChevronDown
                size={14}
                className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-blue-600 pointer-events-none"
              />

            </div>

            {/* NOTIFICATION */}

            <button
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell size={18} />

              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

          </div>

        </header>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={
              staggerContainer
            }
            className="max-w-7xl mx-auto space-y-6 sm:space-y-8"
          >

            {/* METRIC CARDS */}

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            >

              {metricCards.map(
                (
                  item,
                  index
                ) => {

                  const Icon =
                    item.icon;

                  return (
                    <div
                      key={
                        index
                      }
                      className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
                    >

                      <div className="flex justify-between items-center mb-2">

                        <span className="text-[11px] sm:text-xs font-bold text-gray-400 truncate">
                          {
                            item.label
                          }
                        </span>

                        <Icon
                          size={16}
                          className={`${item.color} flex-shrink-0`}
                        />

                      </div>

                      <div>

                        <h4 className="text-base sm:text-lg font-black text-gray-900">
                          {
                            item.value
                          }
                        </h4>

                        <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {
                            item.status
                          }
                        </span>

                      </div>

                    </div>
                  );
                }
              )}

            </motion.div>

            {/* DETAIL METRIC */}

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                <p className="text-xs font-bold text-gray-400">
                  Packet Rate
                </p>

                <p className="text-lg font-black text-gray-900 mt-1">
                  {apiAvailable &&
                  metrics.packetRate !==
                    null
                    ? `${formatNumber(
                        metrics.packetRate,
                        2
                      )} pkt/s`
                    : '-'}
                </p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                <p className="text-xs font-bold text-gray-400">
                  Inter-arrival Time
                </p>

                <p className="text-lg font-black text-gray-900 mt-1">
                  {apiAvailable &&
                  metrics.interArrival !==
                    null
                    ? `${formatNumber(
                        metrics.interArrival
                      )} ms`
                    : '-'}
                </p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                <p className="text-xs font-bold text-gray-400">
                  Delivery Rate
                </p>

                <p className="text-lg font-black text-gray-900 mt-1">
                  {apiAvailable &&
                  metrics.deliveryRate !==
                    null
                    ? `${formatNumber(
                        metrics.deliveryRate,
                        2
                      )}%`
                    : '-'}
                </p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                <p className="text-xs font-bold text-gray-400">
                  Duplicate / Out-of-Order
                </p>

                <p className="text-lg font-black text-gray-900 mt-1">
                  {apiAvailable
                    ? `${metrics.duplicatePackets} / ${metrics.outOfOrderPackets}`
                    : '-'}
                </p>

              </div>

            </motion.div>

            {/* STATUS NODE */}

            <motion.div
              variants={fadeInUp}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm"
            >

              <h3 className="text-base font-black text-gray-900 mb-4">
                Status Perangkat & Node Terhubung
              </h3>

              <div className="overflow-x-auto">

                <table className="w-full text-left text-xs text-gray-600">

                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">

                    <tr>

                      <th className="p-3 rounded-l-xl">
                        Node ID
                      </th>

                      <th className="p-3">
                        Batch ID
                      </th>

                      <th className="p-3">
                        RSSI Terakhir
                      </th>

                      <th className="p-3">
                        Data Terakhir Masuk
                      </th>

                      <th className="p-3 rounded-r-xl">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-50 font-medium">

                    {[
                      {
                        nodeId:
                          'KOMBUCHA_01',
                        data:
                          nodeLatest.KOMBUCHA_01,
                      },

                      {
                        nodeId:
                          'ECO_02',
                        data:
                          nodeLatest.ECO_02,
                      },

                      {
                        nodeId:
                          'FRUIT_03',
                        data:
                          nodeLatest.FRUIT_03,
                      },
                    ].map(
                      (
                        row,
                        index
                      ) => {

                        const status =
                          getNodeStatus(
                            row.data
                          );

                        return (
                          <tr
                            key={
                              index
                            }
                            className="hover:bg-gray-50/50 transition-colors"
                          >

                            <td className="p-3 font-bold text-gray-800">
                              {
                                row.nodeId
                              }
                            </td>

                            <td className="p-3 text-gray-500 font-mono">
                              {
                                row.data
                                  ?.batch_id ??
                                '-'
                              }
                            </td>

                            <td className="p-3">
                              {row.data
                                ?.rssi_dbm !=
                              null
                                ? `${formatNumber(
                                    row
                                      .data
                                      .rssi_dbm,
                                    0
                                  )} dBm`
                                : '-'}
                            </td>

                            <td className="p-3">
                              {row.data
                                ?.timestamp
                                ? new Date(
                                    row
                                      .data
                                      .timestamp
                                  ).toLocaleString(
                                    'id-ID'
                                  )
                                : '-'}
                            </td>

                            <td className="p-3">

                              <span
                                className={`${status.className} font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1`}
                              >

                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${status.dotClassName} ${
                                    status.label ===
                                    'Online'
                                      ? 'animate-pulse'
                                      : ''
                                  }`}
                                />

                                {
                                  status.label
                                }

                              </span>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </motion.div>

            {/* SPESIFIKASI METRIK */}

            <motion.div
              variants={fadeInUp}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm"
            >

              <div className="flex items-center gap-2 mb-4">

                <Server
                  size={18}
                  className="text-blue-600"
                />

                <h3 className="text-base font-black text-gray-900">
                  Spesifikasi Parameter & Sumber Data Metrik
                </h3>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-left text-xs text-gray-700">

                  <thead className="bg-blue-50/60 text-blue-900 font-bold uppercase text-[10px] tracking-wider">

                    <tr>

                      <th className="p-3 rounded-l-xl">
                        Metrik
                      </th>

                      <th className="p-3">
                        Sumber Data
                      </th>

                      <th className="p-3 rounded-r-xl">
                        Fungsi
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100 font-medium">

                    {metricSpecs.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            index
                          }
                          className="hover:bg-gray-50/80 transition-colors"
                        >

                          <td className="p-3 font-bold text-gray-900">
                            {
                              item.metric
                            }
                          </td>

                          <td className="p-3 font-mono text-blue-700">
                            {
                              item.source
                            }
                          </td>

                          <td className="p-3 text-gray-600">
                            {
                              item.function
                            }
                          </td>

                        </tr>
                      )
                    )}

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