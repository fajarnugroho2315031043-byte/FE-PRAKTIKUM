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
import kombuchaImage from '../assets/Kombucha.png';
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
// KONFIGURASI
// =====================================================================

const INDICATOR_MAP = {
  temperature_c: {
    label: 'Suhu',
    unit: '°C',
    color: '#dc2626',
    min: '20°C',
    max: '40°C',
  },

  ph: {
    label: 'pH',
    unit: '',
    color: '#dc2626',
    min: '2.0',
    max: '7.0',
  },

  tds_ppm: {
    label: 'TDS',
    unit: 'ppm',
    color: '#dc2626',
    min: '0',
    max: '1000',
  },

  gas_adc: {
    label: 'Gas (ADC)',
    unit: 'ADC',
    color: '#dc2626',
    min: '0',
    max: '1024',
  },

  mq3_adc: {
    label: 'Alkohol / MQ3',
    unit: 'ADC',
    color: '#dc2626',
    min: '0',
    max: '1024',
  },

  pressure_kpa: {
    label: 'Tekanan',
    unit: 'kPa',
    color: '#dc2626',
    min: '90',
    max: '110',
  },
};

// =====================================================================
// HELPER
// =====================================================================

// Jumlah record berdasarkan periode.
// Sensor mengirim 1 data setiap 30 detik.
// 12 jam = 1.440 record
// 24 jam = 2.880 record
// 3 hari = 8.640 record
// 7 hari = 20.160 record.
const getRecordLimit = (timeRange) => {
  switch (timeRange) {
    case '12 Jam':
      return 1440;

    case '24 Jam':
      return 2880;

    case '3 Hari':
      return 8640;

    case '7 Hari':
      return 20160;

    default:
      return 2880;
  }
};

const getDurationMs = (timeRange) => {
  switch (timeRange) {
    case '12 Jam':
      return 12 * 60 * 60 * 1000;

    case '24 Jam':
      return 24 * 60 * 60 * 1000;

    case '3 Hari':
      return 3 * 24 * 60 * 60 * 1000;

    case '7 Hari':
      return 7 * 24 * 60 * 60 * 1000;

    default:
      return 24 * 60 * 60 * 1000;
  }
};

const getDateRange = (
  selectedDate,
  selectedTimeRange
) => {
  const selectedDay =
    new Date(`${selectedDate}T00:00:00`);

  const now = new Date();

  const isToday =
    selectedDay.getFullYear() ===
      now.getFullYear() &&
    selectedDay.getMonth() ===
      now.getMonth() &&
    selectedDay.getDate() ===
      now.getDate();

  const durationMs =
    getDurationMs(selectedTimeRange);

  let end;
  let start;

  /*
   * Jika memilih hari ini, grafik bergerak secara rolling
   * sampai waktu sekarang.
   *
   * Contoh:
   * sekarang 13:00 + pilihan 24 Jam
   * => 01:00 sampai 13:00
   *
   * Jika memilih tanggal lampau, periode dimulai dari
   * 00:00 pada tanggal tersebut.
   */

  if (isToday) {
    end = now;

    start = new Date(
      now.getTime() - durationMs
    );
  } else {
    start = selectedDay;

    end = new Date(
      selectedDay.getTime() + durationMs
    );
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const formatChartTime = (
  date,
  timeRange
) => {
  const d = new Date(date);

  if (!Number.isFinite(d.getTime())) {
    return '--:--';
  }

  if (
    timeRange === '3 Hari' ||
    timeRange === '7 Hari'
  ) {
    return d.toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: '2-digit',
      }
    );
  }

  return d.toLocaleTimeString(
    'id-ID',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  );
};

const getChartTimeLabels = (
  start,
  end,
  timeRange
) => {
  const startTime =
    new Date(start).getTime();

  const endTime =
    new Date(end).getTime();

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return [];
  }

  /*
   * Label sumbu X dibuat dari waktu yang sama dengan
   * rentang data grafik, bukan dari jumlah/index record.
   *
   * 12 Jam -> setiap 2 jam
   * 24 Jam -> setiap 4 jam
   * 3 Hari -> setiap 12 jam
   * 7 Hari -> setiap 24 jam
   *
   * Titik terakhir selalu ditambahkan agar waktu sekarang
   * tetap tampil di ujung kanan grafik.
   */

  const intervalMap = {
    '12 Jam':
      2 * 60 * 60 * 1000,

    '24 Jam':
      4 * 60 * 60 * 1000,

    '3 Hari':
      12 * 60 * 60 * 1000,

    '7 Hari':
      24 * 60 * 60 * 1000,
  };

  const interval =
    intervalMap[timeRange] ||
    4 * 60 * 60 * 1000;

  const timestamps = [];

  let cursor = startTime;

  while (cursor < endTime) {
    timestamps.push(cursor);

    cursor += interval;
  }

  timestamps.push(endTime);

  return timestamps.map(
    (timestamp) =>
      formatChartTime(
        new Date(timestamp),
        timeRange
      )
  );
};

const getChartRangeLabel = (
  timeRange
) => {
  switch (timeRange) {
    case '12 Jam':
      return '12 Jam Terakhir';

    case '24 Jam':
      return '24 Jam Terakhir';

    case '3 Hari':
      return '3 Hari Terakhir';

    case '7 Hari':
      return '7 Hari Terakhir';

    default:
      return '24 Jam Terakhir';
  }
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

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return '-';
  }

  return numericValue.toFixed(
    decimals
  );
};

const normalizeStatus = (status) => {
  if (status && typeof status === 'object') {
    return (
      status.status ??
      status.state ??
      status.sensor_status ??
      status.value ??
      null
    );
  }
  return status;
};

const formatStatus = (status) => {
  const value = String(normalizeStatus(status) ?? '')
    .trim()
    .toLowerCase();

  switch (value) {
    case 'normal':
      return {
        label: 'Normal',
        className: 'bg-green-50 text-green-700',
        dotClassName: 'bg-green-500',
      };
    case 'warning':
      return {
        label: 'Warning',
        className: 'bg-yellow-50 text-yellow-700',
        dotClassName: 'bg-yellow-500',
      };
    case 'critical':
      return {
        label: 'Critical',
        className: 'bg-red-50 text-red-700',
        dotClassName: 'bg-red-500',
      };
    case 'offline':
    case 'disconnected':
      return {
        label: 'Offline',
        className: 'bg-red-50 text-red-700',
        dotClassName: 'bg-red-500',
      };
    case 'online':
    case 'connected':
    case 'active':
      return {
        label: 'Online',
        className: 'bg-green-50 text-green-700',
        dotClassName: 'bg-green-500',
      };
    case 'no_data':
    case 'nodata':
    case 'no data':
    case 'tidak ada data':
      return {
        label: 'Tidak Ada Data',
        className: 'bg-gray-50 text-gray-600',
        dotClassName: 'bg-gray-400',
      };
    default:
      return {
        label: 'Data',
        className: 'bg-gray-50 text-gray-600',
        dotClassName: 'bg-gray-400',
      };
  }
};

const getSensorBackendStatus = (sensorStatus, ...keys) => {
  if (!sensorStatus || typeof sensorStatus !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (sensorStatus[key] !== undefined && sensorStatus[key] !== null) {
      return sensorStatus[key];
    }
  }

  return null;
};

// =====================================================================
// KOMPONEN
// =====================================================================

export default function Kombucha() {
  const location =
    useLocation();

  const currentPath =
    location.pathname;

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen
  ] = useState(false);

  const [
    isCollapsed,
    setIsCollapsed
  ] = useState(false);

  const [
    selectedNode,
    setSelectedNode
  ] = useState(
    'KOMBUCHA_01'
  );

  const [
    selectedIndicator,
    setSelectedIndicator
  ] = useState(
    'temperature_c'
  );

  const [
    selectedTimeRange,
    setSelectedTimeRange
  ] = useState(
    '24 Jam'
  );

  const [
    selectedDate,
    setSelectedDate
  ] = useState(() => {
    const today =
      new Date();

    return today.toLocaleDateString(
      'en-CA'
    );
  });

  const [
    biData,
    setBiData
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState(null);

  const [
    apiAvailable,
    setApiAvailable
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

  const dateRange =
    useMemo(
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

  const recordLimit =
    useMemo(
      () =>
        getRecordLimit(
          selectedTimeRange
        ),
      [selectedTimeRange]
    );

  // ===================================================================
  // LOAD DATA BI
  // ===================================================================

  useEffect(() => {
    let isMounted = true;

    const loadData =
      async () => {
        try {
          const result =
            await fetchBI({
              node_id:
                selectedNode,

              start:
                dateRange.start,

              end:
                dateRange.end,

              limit:
                recordLimit,
            });

          if (!isMounted) {
            return;
          }

          setBiData(result);

          setApiAvailable(
            true
          );

          setError(null);
        } catch (err) {
          console.error(
            '[KOMBUCHA] Gagal memuat data:',
            err
          );

          if (isMounted) {
            setApiAvailable(
              false
            );

            setBiData(null);

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

    return () => {
      isMounted = false;

      clearInterval(
        intervalId
      );
    };
  }, [
    selectedNode,
    dateRange.start,
    dateRange.end,
    recordLimit,
    POLLING_INTERVAL,
  ]);

  // ===================================================================
  // DATA DARI BACKEND
  // ===================================================================

  const latest =
    biData?.latest ||
    null;

  const rawData =
    Array.isArray(
      biData?.raw_data?.data
    )
      ? biData.raw_data.data
      : [];

  const timeSeries =
    useMemo(() => {
      const now = Date.now();

      return [...rawData]
        .filter((row) => {
          const timestamp =
            new Date(row?.timestamp).getTime();

          return (
            Number.isFinite(timestamp) &&
            timestamp <= now
          );
        })
        .sort(
          (a, b) =>
            new Date(a.timestamp) -
            new Date(b.timestamp)
        );
    }, [rawData]);

  /*
   * WAKTU MULAI SESI SENSING
   *
   * Sequence setiap node sudah di-reset ke 1 ketika
   * pengambilan data resmi dimulai. Karena itu sequence=1
   * menjadi penanda paling aman untuk menentukan awal sesi,
   * bukan jumlah record dan bukan awal window 24 jam.
   *
   * Contoh:
   * data dashboard diambil untuk 24 jam terakhir mulai 13:48,
   * tetapi sequence=1 masuk sekitar 19:00.
   * Maka grafik dimulai dari sekitar 19:00.
   */

  const sessionStartTime =
    useMemo(() => {
      const firstSequence =
        timeSeries
          .filter(
            (row) =>
              Number(
                row?.sequence
              ) === 1 &&
              row?.timestamp
          )
          .sort(
            (a, b) =>
              new Date(
                a.timestamp
              ) -
              new Date(
                b.timestamp
              )
          )[0];

      if (
        firstSequence?.timestamp
      ) {
        return new Date(
          firstSequence.timestamp
        ).getTime();
      }

      /*
       * Fallback jika sequence=1 tidak ikut terambil.
       * Gunakan timestamp paling awal dari data yang tersedia.
       */

      const firstTimestamp =
        timeSeries[0]
          ?.timestamp;

      const fallback =
        firstTimestamp
          ? new Date(
              firstTimestamp
            ).getTime()
          : NaN;

      return Number.isFinite(
        fallback
      )
        ? fallback
        : null;
    }, [timeSeries]);

  /*
   * Awal grafik adalah waktu mulai sesi sensing,
   * tetapi tidak boleh keluar dari periode filter.
   */

  const chartStartTime =
    useMemo(() => {
      const filterStart =
        new Date(
          dateRange.start
        ).getTime();

      if (
        !Number.isFinite(
          filterStart
        )
      ) {
        return null;
      }

      if (
        Number.isFinite(
          sessionStartTime
        )
      ) {
        return Math.max(
          filterStart,
          sessionStartTime
        );
      }

      return filterStart;
    }, [
      dateRange.start,
      sessionStartTime,
    ]);

  /*
   * Hanya data setelah awal sesi yang ditampilkan.
   * Data percobaan sebelum sequence=1 tidak ikut
   * membentuk grafik resmi.
   */

  const chartTimeSeries =
    useMemo(() => {
      if (
        !Number.isFinite(
          chartStartTime
        )
      ) {
        return timeSeries;
      }

      const nowTime =
        Date.now();

      return timeSeries.filter(
        (row) => {
          const timestamp =
            new Date(
              row.timestamp
            ).getTime();

          return (
            Number.isFinite(
              timestamp
            ) &&
            timestamp >=
              chartStartTime &&
            timestamp <=
              nowTime
          );
        }
      );
    }, [
      timeSeries,
      chartStartTime,
    ]);

  // Jumlah record yang benar-benar diterima dashboard
  // untuk node + tanggal + periode yang sedang dipilih.

  const totalRows =
    timeSeries.length;

  const sensorStatus =
    biData?.sensor_status ||
    {};

  const networkStatus =
    biData?.network_status ||
    {};

  /*
   * ================================================================
   * RINGKASAN AVERAGE DARI BACKEND
   * ================================================================
   *
   * Nilai diambil langsung dari:
   * biData.sensor_summary
   *
   * Backend menghitung AVG berdasarkan filter:
   * node_id + tanggal + periode.
   *
   * Jadi:
   * - kartu sensor di atas = LATEST / realtime
   * - kartu ringkasan di bawah = AVERAGE periode terpilih
   *
   * Gas dan MQ3 memang tidak berada di kpi, tetapi tersedia
   * lengkap di sensor_summary dari backend.
   * ================================================================
   */

  const sensorSummary =
    biData?.sensor_summary || {};

  /*
   * ================================================================
   * TREND ANALYSIS DARI BACKEND
   * ================================================================
   *
   * Backend sudah menghasilkan:
   * biData.trends.trends
   *
   * Setiap sensor memiliki:
   * - direction
   * - first_value
   * - last_value
   * - change
   * - change_percent
   * - data_points
   * - first_timestamp
   * - last_timestamp
   *
   * FE hanya menampilkan hasil analisis tersebut.
   * Tidak menghitung ulang arah trend di frontend.
   * ================================================================
   */

  const trendAnalysis =
    biData?.trends?.trends ||
    {};

  const getTrendData = (...keys) => {
    for (const key of keys) {
      const value = trendAnalysis?.[key];

      if (
        value &&
        typeof value === 'object'
      ) {
        return value;
      }
    }

    return null;
  };

  const formatTrendDirection = (direction) => {
    const value =
      String(direction ?? '')
        .trim()
        .toLowerCase();

    switch (value) {
      case 'increasing':
      case 'increase':
        return {
          label: 'Meningkat',
          className: 'bg-green-50 text-green-700',
          dotClassName: 'bg-green-500',
          symbol: '↑',
        };

      case 'decreasing':
      case 'decrease':
        return {
          label: 'Menurun',
          className: 'bg-red-50 text-red-700',
          dotClassName: 'bg-red-500',
          symbol: '↓',
        };

      case 'stable':
      case 'stabil':
        return {
          label: 'Stabil',
          className: 'bg-gray-50 text-gray-600',
          dotClassName: 'bg-gray-400',
          symbol: '→',
        };

      default:
        return {
          label: 'Belum Ada Data',
          className: 'bg-gray-50 text-gray-600',
          dotClassName: 'bg-gray-400',
          symbol: '—',
        };
    }
  };

  const formatTrendPercent = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return '—';
    }

    return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(2)}%`;
  };

  // ===================================================================
  // STATUS SENSOR
  // ===================================================================

  const temperatureStatus =
    formatStatus(
      sensorStatus.temperature
    );

  const phStatus =
    formatStatus(
      sensorStatus.ph
    );

  const pressureStatus =
    formatStatus(
      sensorStatus.pressure
    );

  const tdsStatus =
    formatStatus(
      sensorStatus.tds
    );

  // Status Gas dan Alkohol/MQ3 diambil langsung dari backend.
  const gasStatus =
    formatStatus(
      getSensorBackendStatus(
        sensorStatus,
        'gas_adc',
        'gas'
      )
    );

  const mq3Status =
    formatStatus(
      getSensorBackendStatus(
        sensorStatus,
        'mq3_adc',
        'mq3',
        'alcohol',
        'alkohol'
      )
    );

  // ===================================================================
  // STATUS NODE
  // ===================================================================
  // Status koneksi node diambil LANGSUNG dari backend.
  //
  // Backend:
  // biData.node_status[selectedNode]
  //
  // Status yang didukung:
  // online   -> Online
  // warning  -> Warning
  // offline  -> Offline
  // no_data  -> Tidak Ada Data
  //
  // Frontend TIDAK lagi menghitung status menggunakan timestamp,
  // Date.now(), atau batas waktu sendiri.
  // =====================================================================

  const backendNodeStatus =
    biData?.node_status?.[
      selectedNode
    ] || null;

  const getNodeConnectionStatus =
    () => {
      if (!apiAvailable) {
        return {
          label:
            'Tidak Tersedia',

          className:
            'bg-gray-50 text-gray-600',

          dotClassName:
            'bg-gray-400',
        };
      }

      const status =
        String(
          backendNodeStatus?.status ||
            'no_data'
        ).toLowerCase();

      switch (status) {
        case 'online':
          return {
            label: 'Online',

            className:
              'bg-green-50 text-green-700',

            dotClassName:
              'bg-green-500',
          };

        case 'warning':
          return {
            label: 'Warning',

            className:
              'bg-yellow-50 text-yellow-700',

            dotClassName:
              'bg-yellow-500',
          };

        case 'offline':
          return {
            label: 'Offline',

            className:
              'bg-red-50 text-red-700',

            dotClassName:
              'bg-red-500',
          };

        case 'no_data':
        default:
          return {
            label:
              'Tidak Ada Data',

            className:
              'bg-gray-50 text-gray-600',

            dotClassName:
              'bg-gray-400',
          };
      }
    };

  const nodeStatus =
    getNodeConnectionStatus();

  // ===================================================================
  // INDIKATOR
  // ===================================================================

  const currentConfig =
    INDICATOR_MAP[
      selectedIndicator
    ] ||
    INDICATOR_MAP.temperature_c;

  // ===================================================================
  // GRAFIK
  // ===================================================================

  const generateSvgPoints = (
    dataArray,
    field,
    rangeStart,
    rangeEnd
  ) => {
    if (
      !dataArray ||
      dataArray.length === 0
    ) {
      return '0,50 800,50';
    }

    const values =
      dataArray
        .map((item) =>
          Number(
            item[field]
          )
        )
        .filter(
          Number.isFinite
        );

    if (
      values.length === 0
    ) {
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

    const startMs =
      new Date(
        rangeStart
      ).getTime();

    const endMs =
      new Date(
        rangeEnd
      ).getTime();

    const duration =
      endMs - startMs;

    return dataArray
      .map(
        (
          item,
          index
        ) => {
          const value =
            Number(
              item[field]
            );

          if (
            !Number.isFinite(
              value
            )
          ) {
            return null;
          }

          const timestampMs =
            new Date(
              item.timestamp
            ).getTime();

          /*
           * Posisi X mengikuti timestamp asli.
           * Jadi jika ada data yang hilang/terlambat,
           * jarak pada grafik tetap mencerminkan waktu sebenarnya.
           */

          let x;

          if (
            Number.isFinite(
              timestampMs
            ) &&
            Number.isFinite(
              startMs
            ) &&
            Number.isFinite(
              endMs
            ) &&
            duration > 0
          ) {
            x =
              ((timestampMs -
                startMs) /
                duration) *
              800;

            x = Math.max(
              0,
              Math.min(
                800,
                x
              )
            );
          } else {
            /*
             * Fallback jika timestamp record tidak valid.
             */

            x =
              (index /
                (dataArray.length -
                  1 ||
                  1)) *
              800;
          }

          const y =
            100 -
            ((value -
              minVal) /
              range) *
              80 -
            10;

          return `${x.toFixed(
            1
          )},${y.toFixed(1)}`;
        }
      )
      .filter(Boolean)
      .join(' ');
  };

  /*
   * Sumbu X grafik mengikuti:
   *   chartStartTime -> dateRange.end
   *
   * Jadi untuk sesi resmi yang dimulai sekitar 19:00,
   * grafik tidak lagi diawali dari 13:00 hanya karena
   * filter 24 jam dimulai 24 jam sebelumnya.
   */

  const chartStartIso =
    useMemo(() => {
      if (
        !Number.isFinite(
          chartStartTime
        )
      ) {
        return dateRange.start;
      }

      return new Date(
        chartStartTime
      ).toISOString();
    }, [
      chartStartTime,
      dateRange.start,
    ]);

  /*
   * AKHIR GRAFIK HARUS MENGIKUTI DATA TERAKHIR YANG
   * BENAR-BENAR DITERIMA, bukan waktu komputer semata.
   *
   * Ini mencegah garis terlihat "melewati" waktu sekarang
   * ketika timestamp data terakhir berbeda beberapa menit/detik
   * dari jam browser.
   *
   * Untuk data hari ini:
   *   chartEnd = timestamp data terakhir
   *   (tidak boleh lebih besar dari waktu sekarang).
   *
   * Untuk tanggal lampau:
   *   chartEnd tetap mengikuti batas periode yang dipilih,
   *   tetapi dibatasi sampai data terakhir yang tersedia.
   */

  const chartEndTime =
    useMemo(() => {
      const filterEnd =
        new Date(
          dateRange.end
        ).getTime();

      const validTimestamps =
        chartTimeSeries
          .map((row) =>
            new Date(
              row?.timestamp
            ).getTime()
          )
          .filter(
            (timestamp) =>
              Number.isFinite(
                timestamp
              )
          );

      if (
        !Number.isFinite(
          filterEnd
        )
      ) {
        return null;
      }

      if (
        validTimestamps.length ===
        0
      ) {
        return filterEnd;
      }

      const latestDataTime =
        Math.max(
          ...validTimestamps
        );

      /*
       * Jangan pernah membuat sumbu X berakhir
       * setelah waktu sekarang.
       */

      const nowTime =
        Date.now();

      return Math.min(
        filterEnd,
        latestDataTime,
        nowTime
      );
    }, [
      chartTimeSeries,
      dateRange.end,
    ]);

  const chartEndIso =
    useMemo(() => {
      if (
        !Number.isFinite(
          chartEndTime
        )
      ) {
        return dateRange.end;
      }

      return new Date(
        chartEndTime
      ).toISOString();
    }, [
      chartEndTime,
      dateRange.end,
    ]);

  const chartPoints =
    generateSvgPoints(
      chartTimeSeries,
      selectedIndicator,
      chartStartIso,
      chartEndIso
    );

  const chartTimeLabels =
    useMemo(
      () =>
        getChartTimeLabels(
          chartStartIso,
          chartEndIso,
          selectedTimeRange
        ),
      [
        chartStartIso,
        chartEndIso,
        selectedTimeRange,
      ]
    );

  // ===================================================================
  // DATA TERBARU
  // ===================================================================

  const latestTemperature =
    latest?.temperature_c;

  const latestGas =
    latest?.gas_adc;

  const latestPh =
    latest?.ph;

  const latestPressure =
    latest?.pressure_kpa;

  const latestTds =
    latest?.tds_ppm;

  const latestMq3 =
    latest?.mq3_adc;

  const latestRssi =
    latest?.rssi_dbm;

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
          kombuchaImage
        }
        activeTitle="Kombucha Active"
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
                Dashboard Kombucha
              </h1>

              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading
                  ? 'Memuat data...'
                  : error
                  ? error
                  : 'Data monitoring Kombucha'}
              </p>

            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">

            {/* WAKTU DATA TERBARU */}

            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">

              <Clock
                size={14}
                className="text-red-600"
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
                className="appearance-none bg-red-50 text-red-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-red-200 outline-none cursor-pointer"
              >

                <option value="KOMBUCHA_01">
                  KOMBUCHA_01
                </option>

              </select>

              <ChevronDown
                size={14}
                className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-red-600 pointer-events-none"
              />

            </div>

            {/* NOTIFICATION */}

            <button
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                    Pilih tanggal dan periode
                    monitoring.
                  </p>

                </div>

                <div className="flex flex-col sm:flex-row gap-3">

                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">

                    <Calendar
                      size={15}
                      className="text-red-600"
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
                      className="appearance-none bg-red-50 text-red-600 font-bold text-xs px-3 py-2 pr-8 rounded-xl border border-red-200 outline-none cursor-pointer"
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
                      className="absolute right-2.5 top-2.5 text-red-600 pointer-events-none"
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

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? latestTemperature !==
                          null &&
                        latestTemperature !==
                          undefined
                        ? `${formatValue(
                            latestTemperature,
                            1
                          )}°C`
                        : '-'
                      : '-',

                  icon:
                    Thermometer,

                  color:
                    'text-orange-500',

                  status:
                    temperatureStatus,
                },

                {
                  label:
                    'Gas (ADC)',

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? formatValue(
                          latestGas,
                          0
                        )
                      : '-',

                  icon: Wind,

                  color:
                    'text-blue-500',

                  status:
                    gasStatus,
                },

                {
                  label: 'pH',

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? formatValue(
                          latestPh,
                          2
                        )
                      : '-',

                  icon:
                    Droplet,

                  color:
                    'text-red-600',

                  status:
                    phStatus,
                },

                {
                  label:
                    'Tekanan',

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? latestPressure !==
                          null &&
                        latestPressure !==
                          undefined
                        ? `${formatValue(
                            latestPressure,
                            2
                          )} kPa`
                        : '-'
                      : '-',

                  icon:
                    Gauge,

                  color:
                    'text-purple-500',

                  status:
                    pressureStatus,
                },

                {
                  label: 'TDS',

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? latestTds !==
                          null &&
                        latestTds !==
                          undefined
                        ? `${formatValue(
                            latestTds,
                            0
                          )} ppm`
                        : '-'
                      : '-',

                  icon:
                    Activity,

                  color:
                    'text-indigo-500',

                  status:
                    tdsStatus,
                },

                {
                  label:
                    'Alkohol (MQ3)',

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? formatValue(
                          latestMq3,
                          0
                        )
                      : '-',

                  icon: Zap,

                  color:
                    'text-amber-500',

                  status:
                    mq3Status,
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
                      key={
                        index
                      }
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
            {/* GRAFIK + STATUS */}

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
                        ? `Data monitoring (${timeSeries.length.toLocaleString(
                            'id-ID'
                          )} titik data)`
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
                      className="w-full appearance-none bg-red-50 text-red-600 font-bold text-xs px-3 py-2 pr-7 rounded-xl border border-red-200 outline-none cursor-pointer"
                    >

                      <option value="temperature_c">
                        Suhu
                      </option>

                      <option value="ph">
                        pH
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
                      className="absolute right-2.5 top-3 text-red-600 pointer-events-none"
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
                        Memuat data
                        grafik...
                      </div>
                    ) : !apiAvailable ? (
                      <div className="w-full text-center text-xs text-gray-400">
                        Backend belum
                        tersedia
                      </div>
                    ) : chartTimeSeries.length ===
                      0 ? (
                      <div className="w-full text-center text-xs text-gray-400">
                        Belum ada data
                        pada periode
                        yang dipilih
                      </div>
                    ) : !chartPoints ? (
                      <div className="w-full text-center text-xs text-gray-400">
                        Data grafik
                        tidak valid
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
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={
                            chartPoints
                          }
                          vectorEffect="non-scaling-stroke"
                        />

                      </svg>
                    )}

                  </div>

                  <div className="relative z-10 grid grid-cols-3 sm:grid-cols-7 gap-1 pl-6 sm:pl-8 pr-2 text-[9px] sm:text-[10px] font-bold text-gray-400 select-none pt-2 border-t border-gray-100">

                    {chartTimeLabels.map(
                      (
                        label,
                        index
                      ) => (
                        <span
                          key={`${label}-${index}`}
                          className={`truncate ${
                            index === 0
                              ? 'text-left'
                              : index ===
                                chartTimeLabels.length -
                                  1
                              ? 'text-right'
                              : 'text-center'
                          }`}
                        >
                          {label}
                        </span>
                      )
                    )}

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
                    {
                      selectedNode
                    }
                  </p>

                  <p className="text-xs text-gray-400 mb-4">
                    Total Record:{' '}
                    {apiAvailable
                      ? totalRows.toLocaleString(
                          'id-ID'
                        )
                      : '-'}
                  </p>

                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">

                    <div
                      className={`h-full rounded-full ${
                        nodeStatus.label ===
                        'Online'
                          ? 'bg-green-500 w-full'
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

                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">

                  <div>

                    <span className="block text-xs font-bold text-red-800">
                      Kualitas Jaringan
                    </span>

                    <span className="text-[11px] text-red-600">

                      RSSI:{' '}
                      {apiAvailable
                        ? latestRssi !==
                            null &&
                          latestRssi !==
                            undefined
                          ? `${formatValue(
                              latestRssi,
                              0
                            )} dBm`
                          : '-'
                        : '-'}

                    </span>

                    {apiAvailable &&
                      networkStatus.signal && (
                        <span className="block text-[10px] font-semibold text-gray-500 mt-1">
                          Status:{' '}
                          {
                            formatStatus(
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
                        ? 'text-red-600 flex-shrink-0'
                        : 'text-gray-400 flex-shrink-0'
                    }
                  />

                </div>

              </motion.div>

            </div>


            {/* RINGKASAN AVERAGE */}
            {/* ======================================================= */}

            <motion.div
              variants={fadeInUp}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm"
            >

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900">
                    Ringkasan Rata-rata Sensor
                  </h3>

                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Rata-rata pembacaan {selectedNode} berdasarkan periode yang dipilih
                  </p>
                </div>

                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  {selectedTimeRange}
                </span>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">

                {[
                  {
                    label: 'Average Temperature',
                    value:
                      apiAvailable
                        ? formatValue(
                            sensorSummary.avg_temperature_c,
                            2
                          )
                        : '-',
                    unit: '°C',
                    icon: Thermometer,
                    color: 'text-orange-500',
                  },

                  {
                    label: 'Average pH',
                    value:
                      apiAvailable
                        ? formatValue(
                            sensorSummary.avg_ph,
                            2
                          )
                        : '-',
                    unit: '',
                    icon: Droplet,
                    color: 'text-red-600',
                  },

                  {
                    label: 'Average Pressure',
                    value:
                      apiAvailable
                        ? formatValue(
                            sensorSummary.avg_pressure_kpa,
                            2
                          )
                        : '-',
                    unit: 'kPa',
                    icon: Gauge,
                    color: 'text-purple-500',
                  },

                  {
                    label: 'Average TDS',
                    value:
                      apiAvailable
                        ? formatValue(
                            sensorSummary.avg_tds_ppm,
                            2
                          )
                        : '-',
                    unit: 'ppm',
                    icon: Activity,
                    color: 'text-indigo-500',
                  },

                  {
                    label: 'Average Gas ADC',
                    value:
                      apiAvailable
                        ? formatValue(
                            sensorSummary.avg_gas_adc,
                            2
                          )
                        : '-',
                    unit: 'ADC',
                    icon: Wind,
                    color: 'text-blue-500',
                  },

                  {
                    label: 'Average MQ3 / Alkohol',
                    value:
                      apiAvailable
                        ? formatValue(
                            sensorSummary.avg_mq3_adc,
                            2
                          )
                        : '-',
                    unit: 'ADC',
                    icon: Zap,
                    color: 'text-amber-500',
                  },
                ].map(
                  (item, index) => {

                    const AverageIcon =
                      item.icon;

                    return (
                      <div
                        key={`${item.label}-${index}`}
                        className="bg-gray-50/70 border border-gray-100 rounded-xl p-3"
                      >

                        <div className="flex items-center justify-between gap-2 mb-3">

                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 leading-tight">
                            {item.label}
                          </span>

                          <AverageIcon
                            size={16}
                            className={`${item.color} flex-shrink-0`} 
                          />

                        </div>

                        <div className="flex items-baseline gap-1">

                          <span className="text-sm sm:text-base font-black text-gray-900">
                            {loading
                              ? '...'
                              : item.value}
                          </span>

                          {item.unit && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">
                              {item.unit}
                            </span>
                          )}

                        </div>

                        <p className="text-[8px] text-gray-400 mt-1.5">
                          Rata-rata periode
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </motion.div>

            {/* ======================================================= */}

            {/* TREND ANALYSIS */}
            {/* ======================================================= */}

            <motion.div
              variants={fadeInUp}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm"
            >

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900">
                    Trend Analysis
                  </h3>

                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Arah perubahan nilai sensor berdasarkan analisis backend
                  </p>
                </div>

                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  {selectedTimeRange}
                </span>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">

                {[
                  {
                    label: 'Suhu',
                    key: 'temperature_c',
                    unit: '°C',
                    decimals: 2,
                  },
                  {
                    label: 'pH',
                    key: 'ph',
                    unit: '',
                    decimals: 2,
                  },
                  {
                    label: 'Tekanan',
                    key: 'pressure_kpa',
                    unit: 'kPa',
                    decimals: 2,
                  },
                  {
                    label: 'TDS',
                    key: 'tds_ppm',
                    unit: 'ppm',
                    decimals: 2,
                  },
                  {
                    label: 'Gas ADC',
                    key: 'gas_adc',
                    unit: 'ADC',
                    decimals: 2,
                  },
                  {
                    label: 'MQ3 / Alkohol',
                    key: 'mq3_adc',
                    unit: 'ADC',
                    decimals: 2,
                  },
                ].map(
                  (item) => {

                    const trend =
                      getTrendData(
                        item.key
                      );

                    const direction =
                      formatTrendDirection(
                        trend?.direction
                      );

                    const hasData =
                      Boolean(
                        trend &&
                        (
                          trend.first_value !==
                            null &&
                          trend.first_value !==
                            undefined
                        ) &&
                        (
                          trend.last_value !==
                            null &&
                          trend.last_value !==
                            undefined
                        )
                      );

                    return (
                      <div
                        key={item.key}
                        className="border border-gray-100 rounded-xl p-3 bg-gray-50/60"
                      >

                        <div className="flex items-center justify-between gap-2 mb-3">

                          <span className="text-[11px] font-black text-gray-700">
                            {item.label}
                          </span>

                          <span
                            className={`${direction.className} inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full`}
                          >
                            <span className="text-sm leading-none">
                              {direction.symbol}
                            </span>

                            {direction.label}
                          </span>

                        </div>

                        <div className="grid grid-cols-2 gap-3">

                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                              Awal
                            </p>

                            <p className="text-xs sm:text-sm font-black text-gray-900 mt-1">
                              {hasData
                                ? `${formatValue(
                                    trend.first_value,
                                    item.decimals
                                  )}${item.unit ? ` ${item.unit}` : ''}`
                                : '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                              Terakhir
                            </p>

                            <p className="text-xs sm:text-sm font-black text-gray-900 mt-1">
                              {hasData
                                ? `${formatValue(
                                    trend.last_value,
                                    item.decimals
                                  )}${item.unit ? ` ${item.unit}` : ''}`
                                : '—'}
                            </p>
                          </div>

                        </div>

                        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">

                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                              Perubahan
                            </p>

                            <p className="text-[11px] font-black text-gray-700 mt-1">
                              {hasData
                                ? `${Number(
                                    trend.change
                                  ) >= 0 ? '+' : ''}${formatValue(
                                    trend.change,
                                    item.decimals
                                  )}${item.unit ? ` ${item.unit}` : ''}`
                                : '—'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                              Perubahan %
                            </p>

                            <p className="text-[11px] font-black text-gray-700 mt-1">
                              {formatTrendPercent(
                                trend?.change_percent
                              )}
                            </p>
                          </div>

                        </div>

                        <p className="text-[8px] text-gray-400 mt-2">
                          {trend?.data_points
                            ? `${Number(
                                trend.data_points
                              ).toLocaleString('id-ID')} titik data`
                            : 'Data belum tersedia'}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </motion.div>

            {/* ======================================================= */}


          </motion.div>

        </div>

      </main>
    </div>
  );
}