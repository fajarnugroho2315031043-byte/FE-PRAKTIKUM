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
import fruitEnzymeImage from '../assets/fruit-enzyme.png';
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
  temperature_c: {
    label: 'Suhu',
    unit: '°C',
    color: '#d97706',
    min: '20°C',
    max: '40°C',
  },

  ph: {
    label: 'pH',
    unit: '',
    color: '#d97706',
    min: '2.0',
    max: '7.0',
  },

  tds_ppm: {
    label: 'TDS',
    unit: 'ppm',
    color: '#d97706',
    min: '0',
    max: '1000',
  },

  gas_adc: {
    label: 'Gas (ADC)',
    unit: 'ADC',
    color: '#d97706',
    min: '0',
    max: '1024',
  },

  mq3_adc: {
    label: 'Alkohol / MQ3',
    unit: 'ADC',
    color: '#d97706',
    min: '0',
    max: '1024',
  },

  pressure_kpa: {
    label: 'Tekanan',
    unit: 'kPa',
    color: '#d97706',
    min: '90',
    max: '110',
  },
};

// =====================================================================
// JUMLAH DATA
// Sensor mengirim data setiap 30 detik
// =====================================================================

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

// =====================================================================
// DURASI PERIODE
// =====================================================================

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

// =====================================================================
// HELPER TANGGAL
// =====================================================================

const getDateRange = (
  selectedDate,
  selectedTimeRange
) => {
  const selectedDay = new Date(
    `${selectedDate}T00:00:00`
  );

  const now = new Date();

  const todayKey =
    now.toLocaleDateString('en-CA');

  let start;
  let end;

  // ================================================================
  // JIKA HARI INI
  // Periode berjalan mundur dari waktu sekarang.
  // ================================================================

  if (selectedDate === todayKey) {
    const durationMs =
      getDurationMs(
        selectedTimeRange
      );

    start = new Date(
      now.getTime() - durationMs
    );

    end = new Date(now);
  } else {
    start = new Date(selectedDay);

    switch (selectedTimeRange) {
      case '12 Jam':
        end = new Date(
          selectedDay.getTime() +
            12 *
              60 *
              60 *
              1000
        );
        break;

      case '3 Hari':
        end = new Date(selectedDay);
        end.setDate(
          end.getDate() + 3
        );
        break;

      case '7 Hari':
        end = new Date(selectedDay);
        end.setDate(
          end.getDate() + 7
        );
        break;

      case '24 Jam':
      default:
        end = new Date(selectedDay);
        end.setDate(
          end.getDate() + 1
        );
        break;
    }
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

// =====================================================================
// FORMAT NILAI
// =====================================================================

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

// =====================================================================
// NORMALISASI STATUS SENSOR
// =====================================================================

const normalizeStatusValue = (
  status
) => {
  // Backend kadang mengirim:
  //
  // "normal"
  //
  // atau:
  //
  // {
  //   status: "normal"
  // }
  //
  // atau:
  //
  // {
  //   state: "warning"
  // }

  if (
    status &&
    typeof status === 'object'
  ) {
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

// =====================================================================
// STATUS SENSOR
// =====================================================================

const getSensorStatus = (
  status
) => {
  const normalized =
    normalizeStatusValue(
      status
    );

  const value = String(
    normalized ?? ''
  )
    .trim()
    .toLowerCase();

  switch (value) {
    case 'normal':
      return {
        label: 'Normal',
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

    case 'critical':
      return {
        label: 'Critical',
        className:
          'bg-red-50 text-red-700',
        dotClassName:
          'bg-red-500',
      };

    case 'offline':
    case 'disconnected':
      return {
        label: 'Offline',
        className:
          'bg-red-50 text-red-700',
        dotClassName:
          'bg-red-500',
      };

    case 'online':
    case 'connected':
    case 'active':
      return {
        label: 'Online',
        className:
          'bg-green-50 text-green-700',
        dotClassName:
          'bg-green-500',
      };

    case 'no_data':
    case 'nodata':
    case 'no data':
    case 'tidak ada data':
      return {
        label: 'Tidak Ada Data',
        className:
          'bg-gray-50 text-gray-600',
        dotClassName:
          'bg-gray-400',
      };

    default:
      return {
        label: 'Data',
        className:
          'bg-gray-50 text-gray-600',
        dotClassName:
          'bg-gray-400',
      };
  }
};

// =====================================================================
// HELPER MENGAMBIL STATUS SENSOR
//
// Dibuat fleksibel untuk membaca beberapa kemungkinan struktur
// yang dikirim oleh backend.
// =====================================================================

const getSensorBackendStatus = (
  sensorStatus,
  ...keys
) => {
  if (
    !sensorStatus ||
    typeof sensorStatus !== 'object'
  ) {
    return null;
  }

  for (const key of keys) {
    if (
      sensorStatus[key] !==
      undefined &&
      sensorStatus[key] !==
      null
    ) {
      return sensorStatus[key];
    }
  }

  return null;
};

// =====================================================================
// STATUS NODE DARI BACKEND
// =====================================================================

const getBackendNodeStatus = (
  nodeStatus,
  selectedNode
) => {
  if (!nodeStatus) {
    return null;
  }

  let rawStatus = null;

  // ================================================================
  // Struktur:
  //
  // node_status: {
  //   FRUIT_03: {
  //     status: "online"
  //   }
  // }
  // ================================================================

  if (
    nodeStatus &&
    typeof nodeStatus === 'object' &&
    nodeStatus[selectedNode] &&
    typeof nodeStatus[selectedNode] === 'object'
  ) {
    rawStatus =
      nodeStatus[selectedNode].status ??
      nodeStatus[selectedNode].state ??
      nodeStatus[selectedNode].node_status;
  }

  // ================================================================
  // Struktur:
  //
  // node_status: {
  //   FRUIT_03: "online"
  // }
  // ================================================================

  if (
    !rawStatus &&
    nodeStatus &&
    typeof nodeStatus === 'object' &&
    typeof nodeStatus[selectedNode] === 'string'
  ) {
    rawStatus =
      nodeStatus[selectedNode];
  }

  // ================================================================
  // Struktur:
  //
  // node_status: {
  //   status: "online"
  // }
  // ================================================================

  if (
    !rawStatus &&
    nodeStatus &&
    typeof nodeStatus === 'object'
  ) {
    rawStatus =
      nodeStatus.status ??
      nodeStatus.state ??
      nodeStatus.node_status;
  }

  // ================================================================
  // Struktur:
  //
  // node_status: "online"
  // ================================================================

  if (
    !rawStatus &&
    typeof nodeStatus === 'string'
  ) {
    rawStatus = nodeStatus;
  }

  // ================================================================
  // Boolean
  // ================================================================

  if (
    rawStatus === true
  ) {
    return 'online';
  }

  if (
    rawStatus === false
  ) {
    return 'offline';
  }

  if (
    rawStatus === null ||
    rawStatus === undefined ||
    rawStatus === ''
  ) {
    return null;
  }

  return String(rawStatus)
    .trim()
    .toLowerCase();
};


// =====================================================================
// RINGKASAN AVERAGE & TREND — 100% DARI BI BACKEND
//
// Frontend TIDAK menghitung Average maupun Trend.
// Sumber:
//   Average -> biData.sensor_summary
//   Trend  -> biData.trends.trends
//
// Jika BI belum mengirim nilai, FE menampilkan "-".
// =====================================================================

const SENSOR_FIELDS = [
  {
    key: 'temperature_c',
    label: 'Average Temperature',
    unit: '°C',
    decimals: 2,
  },
  {
    key: 'ph',
    label: 'Average pH',
    unit: '',
    decimals: 2,
  },
  {
    key: 'pressure_kpa',
    label: 'Average Pressure',
    unit: 'kPa',
    decimals: 2,
  },
  {
    key: 'tds_ppm',
    label: 'Average TDS',
    unit: 'ppm',
    decimals: 2,
  },
  {
    key: 'gas_adc',
    label: 'Average Gas ADC',
    unit: 'ADC',
    decimals: 2,
  },
  {
    key: 'mq3_adc',
    label: 'Average MQ3 / Alkohol',
    unit: 'ADC',
    decimals: 2,
  },
];

const getBITrend = (trends, field) => {
  if (!trends || typeof trends !== 'object') {
    return null;
  }

  return trends[field] ?? null;
};

const normalizeBITrend = (trend) => {
  if (!trend || typeof trend !== 'object') {
    return {
      direction: 'Belum Ada Data',
      change: null,
      firstValue: null,
      lastValue: null,
      dataPoints: null,
    };
  }

  const rawDirection = String(
    trend.direction ?? ''
  )
    .trim()
    .toLowerCase();

  let direction = 'Belum Ada Data';

  if (
    rawDirection === 'increasing' ||
    rawDirection === 'increase' ||
    rawDirection === 'naik' ||
    rawDirection === 'up'
  ) {
    direction = 'Meningkat';
  } else if (
    rawDirection === 'decreasing' ||
    rawDirection === 'decrease' ||
    rawDirection === 'menurun' ||
    rawDirection === 'turun' ||
    rawDirection === 'down'
  ) {
    direction = 'Menurun';
  } else if (
    rawDirection === 'stable' ||
    rawDirection === 'stabil'
  ) {
    direction = 'Stabil';
  }

  const changeValue = Number(
    trend.change_percent
  );

  return {
    direction,
    change: Number.isFinite(changeValue)
      ? changeValue
      : null,
    firstValue:
      trend.first_value ?? null,
    lastValue:
      trend.last_value ?? null,
    dataPoints:
      trend.data_points ?? null,
  };
};

// =====================================================================
// KOMPONEN UTAMA
// =====================================================================


// =====================================================================
// FORMAT TREND — HANYA MEMFORMAT HASIL DARI BI
// =====================================================================

const formatTrendDirection = (direction) => {
  const value = String(direction ?? '').trim().toLowerCase();

  switch (value) {
    case 'increasing':
    case 'increase':
    case 'naik':
    case 'meningkat':
      return {
        label: 'Meningkat',
        className: 'bg-green-50 text-green-700',
        dotClassName: 'bg-green-500',
        symbol: '↑',
      };

    case 'decreasing':
    case 'decrease':
    case 'turun':
    case 'menurun':
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
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(2)}%`;
};

export default function FruitEnzyme() {
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
  ] = useState('FRUIT_03');

  const [
    selectedIndicator,
    setSelectedIndicator,
  ] = useState(
    'temperature_c'
  );

  const [
    selectedTimeRange,
    setSelectedTimeRange,
  ] = useState(
    '24 Jam'
  );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(() => {
    return new Date()
      .toLocaleDateString(
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
    setIsMobileMenuOpen(
      false
    );
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

  // ===================================================================
  // LIMIT DATA
  // ===================================================================

  const recordLimit =
    useMemo(
      () =>
        getRecordLimit(
          selectedTimeRange
        ),
      [selectedTimeRange]
    );

  // ===================================================================
  // FETCH DATA
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
            '[FRUIT ENZYME] Gagal memuat data:',
            err
          );

          if (isMounted) {
            setBiData(null);

            setApiAvailable(
              false
            );

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
  // DATA TERBARU
  // ===================================================================

  const latest =
    biData?.latest || null;

  // ===================================================================
  // TIME SERIES
  //
  // Data dengan timestamp masa depan tidak ditampilkan.
  // ===================================================================

  const timeSeries =
    useMemo(() => {
      const rows =
        Array.isArray(
          biData?.raw_data?.data
        )
          ? biData.raw_data.data
          : [];

      const now =
        Date.now();

      return [...rows]
        .filter((item) => {
          const timestamp =
            new Date(
              item.timestamp
            ).getTime();

          return (
            Number.isFinite(
              timestamp
            ) &&
            timestamp <= now
          );
        })
        .sort(
          (a, b) =>
            new Date(
              a.timestamp
            ).getTime() -
            new Date(
              b.timestamp
            ).getTime()
        );
    }, [biData]);

  // ===================================================================
  // TOTAL RECORD
  // ===================================================================

  const totalRows =
    useMemo(() => {
      const backendCount =
        Number(
          biData?.raw_data?.count
        );

      if (
        Number.isFinite(
          backendCount
        ) &&
        backendCount >= 0
      ) {
        return backendCount;
      }

      return timeSeries.length;
    }, [
      biData,
      timeSeries,
    ]);

  // ===================================================================
  // STATUS DARI BACKEND
  // ===================================================================

  const sensorStatus =
    biData?.sensor_status ||
    {};

  const networkStatus =
    biData?.network_status ||
    {};

  // ===================================================================
  // STATUS SUHU
  // ===================================================================

  const temperatureStatus =
    getSensorStatus(
      getSensorBackendStatus(
        sensorStatus,
        'temperature',
        'temperature_c',
        'temp'
      )
    );

  // ===================================================================
  // STATUS GAS
  //
  // PRIORITAS:
  // gas_adc -> gas
  // ===================================================================

  const gasBackendStatus =
    getSensorBackendStatus(
      sensorStatus,
      'gas_adc',
      'gas'
    );

  const gasStatus =
    getSensorStatus(
      gasBackendStatus
    );

  // ===================================================================
  // STATUS pH
  // ===================================================================

  const phStatus =
    getSensorStatus(
      getSensorBackendStatus(
        sensorStatus,
        'ph'
      )
    );

  // ===================================================================
  // STATUS TEKANAN
  // ===================================================================

  const pressureStatus =
    getSensorStatus(
      getSensorBackendStatus(
        sensorStatus,
        'pressure',
        'pressure_kpa'
      )
    );

  // ===================================================================
  // STATUS TDS
  // ===================================================================

  const tdsStatus =
    getSensorStatus(
      getSensorBackendStatus(
        sensorStatus,
        'tds',
        'tds_ppm'
      )
    );

  // ===================================================================
  // STATUS ALKOHOL MQ3
  //
  // PRIORITAS:
  // mq3_adc -> mq3 -> alcohol -> alkohol
  // ===================================================================

  const mq3BackendStatus =
    getSensorBackendStatus(
      sensorStatus,
      'mq3_adc',
      'mq3',
      'alcohol',
      'alkohol'
    );

  const mq3Status =
    getSensorStatus(
      mq3BackendStatus
    );

  // ===================================================================
  // STATUS NODE
  // SEPENUHNYA MENGIKUTI BACKEND
  // ===================================================================

  const backendNodeStatus =
    biData?.node_status;

  const rawNodeStatus =
    getBackendNodeStatus(
      backendNodeStatus,
      selectedNode
    );

  const nodeStatus =
    apiAvailable &&
    rawNodeStatus
      ? getSensorStatus(
          rawNodeStatus
        )
      : {
          label:
            'Tidak Ada Data',

          className:
            'bg-gray-50 text-gray-600',

          dotClassName:
            'bg-gray-400',
        };

  // ===================================================================
  // INDIKATOR AKTIF
  // ===================================================================

  const currentConfig =
    INDICATOR_MAP[
      selectedIndicator
    ] ||
    INDICATOR_MAP.temperature_c;

  // ===================================================================
  // GENERATE GRAFIK
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

    const now =
      Date.now();

    const validData =
      dataArray.filter(
        (item) => {
          const value =
            Number(
              item[field]
            );

          const timestamp =
            new Date(
              item.timestamp
            ).getTime();

          return (
            Number.isFinite(
              value
            ) &&
            Number.isFinite(
              timestamp
            ) &&
            timestamp <= now
          );
        }
      );

    if (
      validData.length === 0
    ) {
      return '0,50 800,50';
    }

    const values =
      validData.map(
        (item) =>
          Number(
            item[field]
          )
      );

    const minVal =
      Math.min(...values);

    const maxVal =
      Math.max(...values);

    const range =
      maxVal - minVal === 0
        ? 1
        : maxVal - minVal;

    const timestamps =
      validData.map(
        (item) =>
          new Date(
            item.timestamp
          ).getTime()
      );

    const minTime =
      Math.min(...timestamps);

    const maxTime =
      Math.min(
        Math.max(
          ...timestamps
        ),
        now
      );

    const timeRange =
      maxTime - minTime === 0
        ? 1
        : maxTime - minTime;

    return validData
      .map((item) => {
        const value =
          Number(
            item[field]
          );

        const timestamp =
          new Date(
            item.timestamp
          ).getTime();

        const x =
          ((timestamp -
            minTime) /
            timeRange) *
          800;

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
      })
      .join(' ');
  };

  const chartPoints =
    generateSvgPoints(
      timeSeries,
      selectedIndicator
    );

  // ===================================================================
  // TICK GRAFIK
  // ===================================================================

  const chartTicks =
    useMemo(() => {
      if (
        timeSeries.length === 0
      ) {
        return [];
      }

      const now =
        Date.now();

      const timestamps =
        timeSeries
          .map((item) =>
            new Date(
              item.timestamp
            ).getTime()
          )
          .filter(
            (time) =>
              Number.isFinite(
                time
              ) &&
              time <= now
          );

      if (
        timestamps.length === 0
      ) {
        return [];
      }

      const firstTime =
        Math.min(...timestamps);

      const lastTime =
        Math.min(
          Math.max(
            ...timestamps
          ),
          now
        );

      const durationHours =
        Math.max(
          0.01,
          (lastTime -
            firstTime) /
            (1000 * 60 * 60)
        );

      let intervalHours;

      if (
        durationHours <= 6
      ) {
        intervalHours = 1;
      } else if (
        durationHours <= 12
      ) {
        intervalHours = 2;
      } else if (
        durationHours <= 24
      ) {
        intervalHours = 4;
      } else if (
        durationHours <= 72
      ) {
        intervalHours = 12;
      } else {
        intervalHours = 24;
      }

      const intervalMs =
        intervalHours *
        60 *
        60 *
        1000;

      const ticks = [];

      let time =
        Math.ceil(
          firstTime /
            intervalMs
        ) *
        intervalMs;

      while (
        time < firstTime
      ) {
        time +=
          intervalMs;
      }

      for (
        ;
        time < lastTime;
        time +=
          intervalMs
      ) {
        const position =
          ((time -
            firstTime) /
            Math.max(
              1,
              lastTime -
                firstTime
            )) *
          100;

        ticks.push({
          position,
          label:
            new Date(
              time
            ).toLocaleTimeString(
              'id-ID',
              {
                hour: '2-digit',
                minute:
                  '2-digit',
                hour12: false,
              }
            ),
        });
      }

      const formatTime =
        (timestamp) =>
          new Date(
            timestamp
          ).toLocaleTimeString(
            'id-ID',
            {
              hour: '2-digit',
              minute:
                '2-digit',
              hour12: false,
            }
          );

      // Label awal
      ticks.unshift({
        position: 0,
        label:
          formatTime(
            firstTime
          ),
      });

      // Label akhir = waktu data terakhir / sekarang
      if (
        lastTime >
        firstTime
      ) {
        ticks.push({
          position: 100,
          label:
            formatTime(
              lastTime
            ),
        });
      }

      // Hindari label terlalu berdekatan
      return ticks.filter(
        (
          tick,
          index,
          arr
        ) => {
          if (
            index === 0 ||
            index ===
              arr.length - 1
          ) {
            return true;
          }

          const previous =
            arr[index - 1];

          return (
            tick.position -
              previous.position >=
            10
          );
        }
      );
    }, [timeSeries]);

  // ===================================================================
  // AVERAGE & TREND — 100% DARI BI
  // ===================================================================

  const sensorSummary =
    biData?.sensor_summary || {};

  const backendTrends =
    biData?.trends?.trends || {};

  const averageKeyMap = {
    temperature_c: 'avg_temperature_c',
    ph: 'avg_ph',
    pressure_kpa: 'avg_pressure_kpa',
    tds_ppm: 'avg_tds_ppm',
    gas_adc: 'avg_gas_adc',
    mq3_adc: 'avg_mq3_adc',
  };

  const averageSummary =
    SENSOR_FIELDS.map((sensor) => ({
      ...sensor,
      value:
        sensorSummary?.[
          averageKeyMap[sensor.key]
        ] ?? null,
    }));

  const trendAnalysis =
    SENSOR_FIELDS.map((sensor) => ({
      ...sensor,
      ...normalizeBITrend(
        getBITrend(
          backendTrends,
          sensor.key
        )
      ),
    }));


  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="flex h-screen bg-[#fcfcfb] font-sans text-gray-800 overflow-hidden">

      {/* =============================================================
          MOBILE OVERLAY
          ============================================================= */}

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

      {/* =============================================================
          SIDEBAR
          ============================================================= */}

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
          fruitEnzymeImage
        }
        activeTitle="Fruit Enzyme Active"
      />

      {/* =============================================================
          MAIN
          ============================================================= */}

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">

        {/* ===========================================================
            HEADER
            =========================================================== */}

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
                Dashboard Fruit Enzyme
              </h1>

              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {loading
                  ? 'Memuat data...'
                  : error
                  ? error
                  : 'Data monitoring Fruit Enzyme'}
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">

            {/* WAKTU DATA TERBARU */}

            <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">

              <Clock
                size={14}
                className="text-amber-600"
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
                className="appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 sm:px-4 py-2 sm:py-2.5 pr-7 sm:pr-8 rounded-2xl border border-amber-200 outline-none cursor-pointer"
              >

                <option value="FRUIT_03">
                  FRUIT_03
                </option>

              </select>

              <ChevronDown
                size={14}
                className="absolute right-2.5 sm:right-3 top-3 sm:top-3.5 text-amber-600 pointer-events-none"
              />

            </div>

            {/* NOTIFICATION */}

            <button
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              aria-label="Notifikasi"
            >

              <Bell size={18} />

              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />

            </button>

          </div>

        </header>

        {/* ===========================================================
            CONTENT
            =========================================================== */}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={
              staggerContainer
            }
            className="max-w-7xl mx-auto space-y-6 sm:space-y-8"
          >

            {/* =======================================================
                FILTER
                ======================================================= */}

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
                      className="text-amber-600"
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
                      className="appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 py-2 pr-8 rounded-xl border border-amber-200 outline-none cursor-pointer"
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
                      className="absolute right-2.5 top-2.5 text-amber-600 pointer-events-none"
                    />

                  </div>

                </div>

              </div>

            </motion.div>

            {/* =======================================================
                SENSOR CARDS
                ======================================================= */}

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            >

              {[
                // ---------------------------------------------------
                // SUHU
                // ---------------------------------------------------

                {
                  label: 'Suhu',

                  value:
                    loading
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

                  icon:
                    Thermometer,

                  color:
                    'text-orange-500',

                  status:
                    temperatureStatus,
                },

                // ---------------------------------------------------
                // GAS
                // STATUS DARI BACKEND
                // ---------------------------------------------------

                {
                  label:
                    'Gas (ADC)',

                  value:
                    loading
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

                  status:
                    gasStatus,
                },

                // ---------------------------------------------------
                // pH
                // ---------------------------------------------------

                {
                  label: 'pH',

                  value:
                    loading
                      ? '...'
                      : apiAvailable
                      ? formatValue(
                          latest?.ph,
                          2
                        )
                      : '-',

                  icon:
                    Droplet,

                  color:
                    'text-amber-600',

                  status:
                    phStatus,
                },

                // ---------------------------------------------------
                // TEKANAN
                // ---------------------------------------------------

                {
                  label:
                    'Tekanan',

                  value:
                    loading
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

                  icon:
                    Gauge,

                  color:
                    'text-purple-500',

                  status:
                    pressureStatus,
                },

                // ---------------------------------------------------
                // TDS
                // ---------------------------------------------------

                {
                  label: 'TDS',

                  value:
                    loading
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

                  icon:
                    Activity,

                  color:
                    'text-indigo-500',

                  status:
                    tdsStatus,
                },

                // ---------------------------------------------------
                // ALKOHOL MQ3
                // STATUS DARI BACKEND
                // ---------------------------------------------------

                {
                  label:
                    'Alkohol (MQ3)',

                  value:
                    loading
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

            {/* =======================================================
                GRAFIK + STATUS NODE
                ======================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* =====================================================
                  GRAFIK
                  ===================================================== */}

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
                      className="w-full appearance-none bg-amber-50 text-amber-600 font-bold text-xs px-3 py-2 pr-7 rounded-xl border border-amber-200 outline-none cursor-pointer"
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
                      className="absolute right-2.5 top-3 text-amber-600 pointer-events-none"
                    />

                  </div>

                </div>

                <div className="h-60 w-full bg-white rounded-2xl border border-gray-100 p-2 sm:p-4 relative flex flex-col justify-between">

                  {/* LABEL Y */}

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

                  {/* GRAFIK */}

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

                  {/* LABEL X */}

                  <div className="relative z-10 h-5 ml-6 sm:ml-8 mr-2 border-t border-gray-100 select-none">

                    {chartTicks.map(
                      (
                        tick,
                        index
                      ) => (
                        <span
                          key={`${tick.label}-${index}`}
                          className="absolute top-2 -translate-x-1/2 whitespace-nowrap text-[9px] sm:text-[10px] font-bold text-gray-400"
                          style={{
                            left: `${tick.position}%`,
                          }}
                        >
                          {
                            tick.label
                          }
                        </span>
                      )
                    )}

                  </div>

                </div>

              </motion.div>

              {/* =====================================================
                  STATUS NODE
                  ===================================================== */}

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
                          ? 'bg-green-600 w-full'
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

                {/* ===================================================
                    NETWORK
                    =================================================== */}

                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">

                  <div>

                    <span className="block text-xs font-bold text-amber-800">
                      Kualitas Jaringan
                    </span>

                    <span className="text-[11px] text-amber-600">
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
                        ? 'text-amber-600 flex-shrink-0'
                        : 'text-gray-400 flex-shrink-0'
                    }
                  />

                </div>

              </motion.div>

            </div>

            {/* ======================================================= */}
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

                {averageSummary.map(
                  (item) => {

                    const averageValue =
                      item.value;

                    return (
                      <div
                        key={item.key}
                        className="bg-gray-50/70 border border-gray-100 rounded-xl p-3"
                      >

                        <div className="flex items-center justify-between gap-2 mb-3">

                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 leading-tight">
                            {item.label}
                          </span>

                          <Activity
                            size={16}
                            className="text-amber-500 flex-shrink-0"
                          />

                        </div>

                        <div className="flex items-baseline gap-1">

                          <span className="text-sm sm:text-base font-black text-gray-900">
                            {loading
                              ? '...'
                              : averageValue === null ||
                                averageValue === undefined
                              ? '-'
                              : formatValue(
                                  averageValue,
                                  item.decimals
                                )}
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

                {trendAnalysis.map(
                  (item) => {

                    const direction =
                      formatTrendDirection(
                        item.direction
                      );

                    const hasData =
                      item.firstValue !== null &&
                      item.firstValue !== undefined &&
                      item.lastValue !== null &&
                      item.lastValue !== undefined;

                    return (
                      <div
                        key={item.key}
                        className="border border-gray-100 rounded-xl p-3 bg-gray-50/60"
                      >

                        <div className="flex items-center justify-between gap-2 mb-3">

                          <span className="text-[11px] font-black text-gray-700">
                            {item.key === 'temperature_c'
                              ? 'Suhu'
                              : item.key === 'ph'
                              ? 'pH'
                              : item.key === 'pressure_kpa'
                              ? 'Tekanan'
                              : item.key === 'tds_ppm'
                              ? 'TDS'
                              : item.key === 'gas_adc'
                              ? 'Gas ADC'
                              : 'MQ3 / Alkohol'}
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
                                    item.firstValue,
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
                                    item.lastValue,
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
                              {item.change !== null
                                ? `${item.change >= 0 ? '+' : ''}${formatValue(
                                    item.change,
                                    2
                                  )}%`
                                : '—'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">
                              Perubahan %
                            </p>

                            <p className="text-[11px] font-black text-gray-700 mt-1">
                              {item.change !== null
                                ? `${item.change >= 0 ? '+' : ''}${formatValue(
                                    item.change,
                                    2
                                  )}%`
                                : '—'}
                            </p>
                          </div>

                        </div>

                        <p className="text-[8px] text-gray-400 mt-2">
                          {item.dataPoints
                            ? `${Number(
                                item.dataPoints
                              ).toLocaleString('id-ID')} titik data`
                            : 'Data belum tersedia'}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </motion.div>


          </motion.div>

        </div>

      </main>

    </div>
  );
}