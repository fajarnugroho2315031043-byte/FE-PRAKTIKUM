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
// READER METRIK NETWORK DARI BI
// =====================================================================

const getBIMetric = (bi, ...paths) => {
  for (const path of paths) {
    const parts = path.split('.');
    let value = bi;

    for (const part of parts) {
      if (value == null) {
        value = undefined;
        break;
      }
      value = value[part];
    }

    if (value != null && value !== '') {
      return value;
    }
  }

  return null;
};

const getBINetworkMetrics = (bi) => {
  // Struktur BI yang benar:
  // result.network.signal.average_dbm
  // result.network.delay.average_ms
  // result.network.jitter.jitter_ms
  // result.network.packet_loss.packet_loss_percent
  // result.network.packet_loss.lost_packets
  const source = bi?.network || {};

  return {
    avgRssi: getBIMetric(
      source,
      'signal.average_dbm',
      'signal.avg_dbm',
      'signal.latest_dbm'
    ),
    avgLatency: getBIMetric(
      source,
      'delay.average_ms',
      'delay.avg_ms',
      'delay.average'
    ),
    avgJitter: getBIMetric(
      source,
      'jitter.jitter_ms',
      'jitter.average_ms',
      'jitter.avg_ms'
    ),
    lostPackets: getBIMetric(
      source,
      'packet_loss.lost_packets'
    ),
    packetLossPct: getBIMetric(
      source,
      'packet_loss.packet_loss_percent',
      'packet_loss.percentage'
    ),
    packetRate: getBIMetric(
      source,
      'packet_rate',
      'packet_rate_pps',
      'throughput.packet_rate'
    ),
    interArrival: getBIMetric(
      source,
      'inter_arrival_ms',
      'inter_arrival_time',
      'inter_arrival.average_ms'
    ),
    deliveryRate: getBIMetric(
      source,
      'delivery_rate',
      'delivery_rate_pct',
      'delivery_rate_percent',
      'reception_rate',
      'reception_rate_pct'
    ),
    duplicatePackets: getBIMetric(
      source,
      'duplicate_packets',
      'duplicates',
      'duplicate.count'
    ),
    outOfOrderPackets: getBIMetric(
      source,
      'out_of_order_packets',
      'out_of_order',
      'out_of_order.count'
    ),
    sequenceGap: getBIMetric(
      source,
      'sequence_gap',
      'sequence_gap.total',
      'sequence_gap.count',
      'sequence_gap.gaps'
    ),
    dataQuality: getBIMetric(
      source,
      'data_quality',
      'data_quality.status',
      'quality',
      'quality.status'
    ),
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
// STATUS NODE DARI BI BACKEND
// =====================================================================

const getBINodeStatus = (result, nodeId) => {
  const source = result?.node_status;

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    const direct = source[nodeId];

    if (direct != null) {
      if (typeof direct === 'object') {
        return direct.status ?? direct.state ?? direct.node_status ?? null;
      }
      return direct;
    }

    if (
      source.status != null ||
      source.state != null ||
      source.node_status != null
    ) {
      return source.status ?? source.state ?? source.node_status;
    }
  }

  return (
    result?.node_status ??
    result?.status ??
    null
  );
};

const formatBINodeStatus = (status) => {
  const value = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (value) {
    case 'online':
    case 'connected':
    case 'active':
      return {
        label: 'Online',
        className: 'bg-green-50 text-green-600',
        dotClassName: 'bg-green-500',
      };

    case 'warning':
      return {
        label: 'Warning',
        className: 'bg-yellow-50 text-yellow-600',
        dotClassName: 'bg-yellow-500',
      };

    case 'offline':
    case 'disconnected':
      return {
        label: 'Offline',
        className: 'bg-red-50 text-red-600',
        dotClassName: 'bg-red-500',
      };

    case 'no_data':
    case 'nodata':
    case 'no_data_available':
    case 'tidak_ada_data':
      return {
        label: 'Tidak Ada Data',
        className: 'bg-gray-100 text-gray-500',
        dotClassName: 'bg-gray-400',
      };

    default:
      return {
        label: 'Tidak Ada Data',
        className: 'bg-gray-100 text-gray-500',
        dotClassName: 'bg-gray-400',
      };
  }
};

const getBINodeNetwork = (result) =>
  result?.network_metrics ??
  result?.network_analysis ??
  result?.network ??
  result?.metrics ??
  {};

const getBIPacketLoss = (result) => {
  return result?.network?.packet_loss?.packet_loss_percent ?? null;
};

const getBILostPackets = (result) => {
  return result?.network?.packet_loss?.lost_packets ?? null;
};

const getBISequenceGap = (result, nodeId) => {
  const group = result?.network?.packet_loss?.groups?.find(
    (item) => item?.node_id === nodeId
  );

  if (!group) return null;

  const expected = Number(group.expected_packets);
  const received = Number(group.received_packets);

  if (
    Number.isFinite(expected) &&
    Number.isFinite(received) &&
    expected >= received
  ) {
    return expected - received;
  }

  return null;
};

// =====================================================================
// KOMPONEN
// =====================================================================
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
    biData,
    setBiData,
  ] = useState(null);

  const [
    nodeBI,
    setNodeBI,
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
            // Limit tinggi agar BI mengembalikan seluruh record node
            // yang saat ini jumlahnya masih di bawah 5000 per node.
            limit: 5000,
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

          setBiData(result);

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
            setBiData(null);

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
  // LOAD BI PER NODE
  // ===================================================================
  //
  // Semua informasi tabel node diambil dari response BI:
  // - latest reading
  // - RSSI terakhir
  // - packet loss
  // - paket hilang
  // - sequence gap
  // - status node
  //
  // FE tidak menghitung packet loss maupun status node.
  // ===================================================================

  useEffect(() => {
    let isMounted = true;

    const NODE_IDS = [
      'KOMBUCHA_01',
      'ECO_02',
      'FRUIT_03',
    ];

    const loadNodeBI = async () => {
      try {
        const results = await Promise.all(
          NODE_IDS.map((nodeId) =>
            fetchBI({
              node_id: nodeId,
              limit: 5000,
            }).catch((err) => {
              console.error(
                `[NETWORK PERF] Gagal mengambil BI ${nodeId}:`,
                err
              );
              return null;
            })
          )
        );

        if (!isMounted) return;

        const next = {};

        NODE_IDS.forEach((nodeId, index) => {
          const result = results[index];

          if (!result) {
            next[nodeId] = null;
            return;
          }

          const data = getRowsFromBI(result);

          const sorted = [...data].sort(
            (a, b) =>
              new Date(
                b?.timestamp || b?.received_at
              ) -
              new Date(
                a?.timestamp || a?.received_at
              )
          );

          const latestRow = sorted[0] || null;

          next[nodeId] = {
            result,
            latest: latestRow,
            totalRecords:
              result?.network?.nodes?.[nodeId]?.total_readings ??
              result?.network?.nodes?.[nodeId]?.total_rows ??
              result?.node_status?.[nodeId]?.reading_count ??
              result?.raw_data?.count ??
              result?.count ??
              data.length,
            status: getBINodeStatus(result, nodeId),
            packetLoss: getBIPacketLoss(result),
            lostPackets: getBILostPackets(result),
            sequenceGap: getBISequenceGap(result, nodeId),
          };
        });

        setNodeBI(next);
      } catch (err) {
        console.error(
          '[NETWORK PERF] Gagal mengambil BI per node:',
          err
        );
      }
    };

    loadNodeBI();

    const intervalId = setInterval(
      loadNodeBI,
      POLLING_INTERVAL
    );

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [POLLING_INTERVAL]);

  // Daftar node didefinisikan sebelum semua kalkulasi/render yang
  // menggunakannya. Sebelumnya deklarasi ini berada terlalu bawah,
  // sehingga render pertama terkena ReferenceError dan layar menjadi putih.
  const NODE_IDS = [
    'KOMBUCHA_01',
    'ECO_02',
    'FRUIT_03',
  ];

  // ===================================================================
  // METRIK DARI BI
  // ===================================================================
  //
  // Jika satu node dipilih, gunakan network_metrics milik node tersebut.
  // Jika "Semua Node" dipilih, response BI gabungan kadang hanya
  // mengembalikan raw_data tanpa network_metrics gabungan. Karena itu
  // FE mengambil network_metrics dari BI masing-masing node dan
  // menggabungkannya hanya untuk kebutuhan kartu ringkasan.
  //
  // Tidak ada perhitungan network metric dari timestamp/raw data di FE.
  // Semua nilai sumber tetap berasal dari BI backend.
  // ===================================================================

  const selectedBIResult =
    selectedNode
      ? nodeBI[selectedNode]?.result || biData
      : null;

  const perNodeBIResults = NODE_IDS
    .map((nodeId) => nodeBI[nodeId]?.result)
    .filter(Boolean);

  const getNumericMetric = (metric) => {
    const value = Number(metric);
    return Number.isFinite(value) ? value : null;
  };

  const aggregateBIMetrics = (results) => {
    if (!results.length) {
      return getBINetworkMetrics(biData);
    }

    const parsed = results.map(getBINetworkMetrics);

    const average = (key) => {
      const values = parsed
        .map((item) => getNumericMetric(item[key]))
        .filter((value) => value !== null);

      if (!values.length) return null;

      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    const sum = (key) => {
      const values = parsed
        .map((item) => getNumericMetric(item[key]))
        .filter((value) => value !== null);

      if (!values.length) return null;

      return values.reduce((total, value) => total + value, 0);
    };

    const firstNonNull = (key) => {
      const value = parsed
        .map((item) => item[key])
        .find((item) => item !== null && item !== undefined && item !== '');

      return value ?? null;
    };

    return {
      avgRssi: average('avgRssi'),
      avgLatency: average('avgLatency'),
      avgJitter: average('avgJitter'),

      // Paket hilang adalah jumlah sehingga dijumlahkan.
      lostPackets: sum('lostPackets'),

      // Packet loss persentase adalah ringkasan antar node.
      packetLossPct: average('packetLossPct'),

      packetRate: average('packetRate'),
      interArrival: average('interArrival'),
      deliveryRate: average('deliveryRate'),

      duplicatePackets: sum('duplicatePackets'),
      outOfOrderPackets: sum('outOfOrderPackets'),
      sequenceGap: sum('sequenceGap'),

      dataQuality: firstNonNull('dataQuality'),
    };
  };

  const metrics = selectedNode
    ? getBINetworkMetrics(selectedBIResult)
    : aggregateBIMetrics(perNodeBIResults);

  // Untuk mode Semua Node, timestamp terakhir juga diambil dari
  // record terakhir seluruh node agar Data Freshness tidak kosong.
  const networkLatest =
    selectedNode
      ? nodeBI[selectedNode]?.latest || latest
      : NODE_IDS
          .map((nodeId) => nodeBI[nodeId]?.latest)
          .filter(Boolean)
          .sort(
            (a, b) =>
              new Date(b?.timestamp || b?.received_at) -
              new Date(a?.timestamp || a?.received_at)
          )[0] || latest;

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
  // TOTAL RECORD AKTUAL DARI BI PER NODE
  // ===================================================================
  //
  // Jangan gunakan `rows.length` sebagai Total Record karena `rows`
  // mengikuti limit request BI. Contoh: request limit 5000 akan
  // menghasilkan 5000 meskipun database sebenarnya hanya memiliki
  // 2572 record.
  //
  // Data per node diambil terpisah dengan limit 5000, sehingga
  // totalRecords di bawah merepresentasikan jumlah record aktual
  // yang tersedia untuk masing-masing node pada response BI.
  // ===================================================================

  const actualTotalRecords = useMemo(() => {
    if (!apiAvailable) {
      return null;
    }

    if (selectedNode) {
      return (
        nodeBI[selectedNode]?.result?.network?.nodes?.[selectedNode]?.total_readings ??
        nodeBI[selectedNode]?.result?.network?.nodes?.[selectedNode]?.total_rows ??
        nodeBI[selectedNode]?.result?.node_status?.[selectedNode]?.reading_count ??
        nodeBI[selectedNode]?.totalRecords ??
        0
      );
    }

    return NODE_IDS.reduce(
      (total, nodeId) =>
        total + (nodeBI[nodeId]?.totalRecords ?? 0),
      0
    );
  }, [
    apiAvailable,
    selectedNode,
    nodeBI,
  ]);

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
          ? metrics.avgRssi !== null
            ? `${formatNumber(metrics.avgRssi)} dBm`
            : '- dBm'
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
          ? metrics.avgLatency !== null
            ? `${formatNumber(metrics.avgLatency)} ms`
            : '- ms'
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
        apiAvailable &&
        metrics.lostPackets !== null
          ? `${formatNumber(
              metrics.lostPackets,
              0
            )} hilang`
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
          ? metrics.avgJitter !== null
            ? `${formatNumber(metrics.avgJitter)} ms`
            : '- ms'
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
          : apiAvailable &&
            actualTotalRecords !== null
          ? `${actualTotalRecords.toLocaleString('id-ID')} pkt`
          : '-',
      status:
        apiAvailable &&
        actualTotalRecords !== null
          ? 'Total BI'
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
            networkLatest?.timestamp
          ? new Date(
              networkLatest.timestamp
            ).toLocaleTimeString(
              'id-ID'
            )
          : '-',
      status:
        apiAvailable &&
        networkLatest?.timestamp
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
                {networkLatest?.timestamp
                  ? new Date(
                      networkLatest.timestamp
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
                    : 'Tidak tersedia dari BI'}
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
                    : 'Tidak tersedia dari BI'}
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
                    : 'Tidak tersedia dari BI'}
                </p>

              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">

                <p className="text-xs font-bold text-gray-400">
                  Duplicate / Out-of-Order
                </p>

                <p className="text-lg font-black text-gray-900 mt-1">
                  {apiAvailable
                    ? `${metrics.duplicatePackets ?? '-'} / ${metrics.outOfOrderPackets ?? '-'}`
                    : '-'}
                </p>

              </div>

            </motion.div>

            {/* STATUS NODE & PACKET LOSS */}
            <motion.div
              variants={fadeInUp}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Status Perangkat & Node Terhubung
                  </h3>

                  <p className="text-[11px] text-gray-400 mt-1">
                    Status, RSSI, packet loss, paket hilang, dan sequence gap ditampilkan dari BI per node.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    BI Backend
                  </span>

                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Total: {actualTotalRecords !== null
                      ? actualTotalRecords.toLocaleString('id-ID')
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Node ID</th>
                      <th className="p-3">Batch ID</th>
                      <th className="p-3">RSSI Terakhir</th>
                      <th className="p-3">Packet Loss</th>
                      <th className="p-3">Paket Hilang</th>
                      <th className="p-3">Sequence Gap</th>
                      <th className="p-3">Data Terakhir Masuk</th>
                      <th className="p-3 rounded-r-xl">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50 font-medium">
                    {[
                      'KOMBUCHA_01',
                      'ECO_02',
                      'FRUIT_03',
                    ].map((nodeId) => {
                      const node = nodeBI[nodeId];
                      const latestRow = node?.latest;
                      const status = formatBINodeStatus(node?.status);

                      const packetGroup =
                        node?.result?.network?.packet_loss?.groups?.find(
                          (item) => item?.node_id === nodeId
                        );

                      const nodePacketLoss =
                        packetGroup?.packet_loss_percent ??
                        node?.packetLoss ??
                        null;

                      const nodeLostPackets =
                        packetGroup?.lost_packets ??
                        node?.lostPackets ??
                        null;

                      const nodeSequenceGap =
                        packetGroup
                          ? (
                              Number(packetGroup.expected_packets) -
                              Number(packetGroup.received_packets)
                            )
                          : node?.sequenceGap ?? null;

                      return (
                        <tr
                          key={nodeId}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-3 font-bold text-gray-800">
                            {nodeId}
                          </td>

                          <td className="p-3 text-gray-500 font-mono">
                            {latestRow?.batch_id ?? '-'}
                          </td>

                          <td className="p-3">
                            {latestRow?.rssi_dbm != null
                              ? `${formatNumber(
                                  latestRow.rssi_dbm,
                                  0
                                )} dBm`
                              : '-'}
                          </td>

                          <td className="p-3 font-bold">
                            {nodePacketLoss != null
                              ? `${formatNumber(
                                  nodePacketLoss,
                                  2
                                )}%`
                              : '-'}
                          </td>

                          <td className="p-3">
                            {nodeLostPackets != null
                              ? `${formatNumber(
                                  nodeLostPackets,
                                  0
                                )} pkt`
                              : '-'}
                          </td>

                          <td className="p-3">
                            {nodeSequenceGap != null &&
                              Number.isFinite(Number(nodeSequenceGap))
                              ? String(Number(nodeSequenceGap))
                              : '-'}
                          </td>

                          <td className="p-3">
                            {latestRow?.timestamp
                              ? new Date(
                                  latestRow.timestamp
                                ).toLocaleString('id-ID')
                              : '-'}
                          </td>

                          <td className="p-3">
                            <span
                              className={`${status.className} font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${status.dotClassName} ${
                                  status.label === 'Online'
                                    ? 'animate-pulse'
                                    : ''
                                }`}
                              />
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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