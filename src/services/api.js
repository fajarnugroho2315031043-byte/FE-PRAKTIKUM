// src/services/api.js

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "/api"
).replace(/\/+$/, "");

const POLLING_INTERVAL =
  Number(import.meta.env.VITE_POLLING_INTERVAL) || 10000;


/*
|--------------------------------------------------------------------------
| QUERY PARAMETER
|--------------------------------------------------------------------------
*/

const buildQueryParams = (filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

  return new URLSearchParams(cleanFilters).toString();
};


/*
|--------------------------------------------------------------------------
| HTTP REQUEST
|--------------------------------------------------------------------------
*/

const requestJSON = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,

    headers: {
      Accept: "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message =
      `HTTP error! status: ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody?.message) {
        message = errorBody.message;
      } else if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // Response bukan JSON.
    }

    throw new Error(message);
  }

  return response.json();
};


/*
|--------------------------------------------------------------------------
| NORMALIZE SENSOR ROW
|--------------------------------------------------------------------------
*/

const normalizeSensorRow = (row = {}) => {
  return {
    ...row,

    node_id:
      row.node_id ??
      row.nodeId ??
      null,

    batch_id:
      row.batch_id ??
      row.batchId ??
      null,

    timestamp:
      row.timestamp ??
      row.created_at ??
      row.createdAt ??
      null,

    received_at:
      row.received_at ??
      row.receivedAt ??
      null,

    temperature_c:
      row.temperature_c ??
      row.temperature ??
      null,

    ph:
      row.ph ??
      row.pH ??
      null,

    gas_adc:
      row.gas_adc ??
      row.gas ??
      null,

    mq3_adc:
      row.mq3_adc ??
      row.alcohol_adc ??
      row.mq3 ??
      null,

    pressure_kpa:
      row.pressure_kpa ??
      row.pressure ??
      null,

    tds_ppm:
      row.tds_ppm ??
      row.tds ??
      null,

    rssi_dbm:
      row.rssi_dbm ??
      row.rssi ??
      null,

    sequence:
      row.sequence ??
      row.seq ??
      null
  };
};


/*
|--------------------------------------------------------------------------
| NORMALIZE LATEST
|--------------------------------------------------------------------------
*/

const normalizeLatest = (latest) => {
  if (!latest) {
    return null;
  }

  /*
   * Jika array
   */

  if (Array.isArray(latest)) {
    return latest.map(normalizeSensorRow);
  }

  /*
   * Jika object
   */

  if (
    typeof latest === "object"
  ) {
    return normalizeSensorRow(latest);
  }

  return null;
};


/*
|--------------------------------------------------------------------------
| NORMALIZE LATEST BY NODE
|--------------------------------------------------------------------------
|
| Backend:
|
| latest_by_node: {
|   ECO_02: {...},
|   KOMBUCHA_01: {...},
|   FRUIT_03: {...}
| }
|--------------------------------------------------------------------------
*/

const normalizeLatestByNode = (
  latestByNode
) => {
  if (!latestByNode) {
    return {};
  }

  /*
   * Object
   */

  if (
    typeof latestByNode === "object" &&
    !Array.isArray(latestByNode)
  ) {
    return Object.fromEntries(
      Object.entries(latestByNode).map(
        ([nodeId, row]) => [
          nodeId,
          normalizeSensorRow(row)
        ]
      )
    );
  }

  /*
   * Array fallback
   */

  if (Array.isArray(latestByNode)) {
    return Object.fromEntries(
      latestByNode
        .filter(
          (row) =>
            row?.node_id ||
            row?.nodeId
        )
        .map((row) => {
          const normalized =
            normalizeSensorRow(row);

          return [
            normalized.node_id,
            normalized
          ];
        })
    );
  }

  return {};
};


/*
|--------------------------------------------------------------------------
| NORMALIZE NODE STATUS
|--------------------------------------------------------------------------
|
| Backend:
|
| node_status: {
|   ECO_02: {...},
|   KOMBUCHA_01: {...},
|   FRUIT_03: {...}
| }
|--------------------------------------------------------------------------
*/

const normalizeNodeStatus = (
  nodeStatus
) => {
  if (!nodeStatus) {
    return {};
  }

  /*
   * Object
   */

  if (
    typeof nodeStatus === "object" &&
    !Array.isArray(nodeStatus)
  ) {
    return Object.fromEntries(
      Object.entries(nodeStatus).map(
        ([nodeId, node]) => [
          nodeId,
          {
            ...(node || {}),

            node_id:
              node?.node_id ??
              node?.nodeId ??
              nodeId,

            last_seen:
              node?.last_seen ??
              node?.lastSeen ??
              node?.timestamp ??
              null
          }
        ]
      )
    );
  }

  /*
   * Array fallback
   */

  if (Array.isArray(nodeStatus)) {
    return Object.fromEntries(
      nodeStatus
        .filter(
          (node) =>
            node?.node_id ||
            node?.nodeId
        )
        .map((node) => {
          const nodeId =
            node.node_id ??
            node.nodeId;

          return [
            nodeId,
            {
              ...node,

              node_id: nodeId,

              last_seen:
                node.last_seen ??
                node.lastSeen ??
                node.timestamp ??
                null
            }
          ];
        })
    );
  }

  return {};
};


/*
|--------------------------------------------------------------------------
| BUILD NODE STATUS FALLBACK
|--------------------------------------------------------------------------
|
| Jika latest_by_node mempunyai data tetapi node_status
| tidak lengkap, gunakan timestamp sensor sebagai
| fallback last_seen.
|--------------------------------------------------------------------------
*/

const buildNodeStatusFromLatest = (
  latestByNode,
  existingStatus
) => {
  const result = {
    ...existingStatus
  };

  Object.entries(latestByNode).forEach(
    ([nodeId, row]) => {
      const existing =
        result[nodeId] || {};

      result[nodeId] = {
        ...existing,

        node_id:
          existing.node_id ??
          nodeId,

        last_seen:
          existing.last_seen ??
          row?.timestamp ??
          row?.received_at ??
          null
      };
    }
  );

  return result;
};


/*
|--------------------------------------------------------------------------
| RAW DATA
|--------------------------------------------------------------------------
*/

const extractRawData = (result) => {
  /*
   * Backend utama:
   *
   * raw_data.data
   */

  if (
    Array.isArray(
      result?.raw_data?.data
    )
  ) {
    return result.raw_data.data.map(
      normalizeSensorRow
    );
  }

  /*
   * Fallback:
   *
   * data
   */

  if (
    Array.isArray(result?.data)
  ) {
    return result.data.map(
      normalizeSensorRow
    );
  }

  /*
   * Fallback:
   *
   * rows
   */

  if (
    Array.isArray(result?.rows)
  ) {
    return result.rows.map(
      normalizeSensorRow
    );
  }

  return [];
};


/*
|--------------------------------------------------------------------------
| NORMALIZE BI RESPONSE
|--------------------------------------------------------------------------
*/

const normalizeBIResponse = (
  result
) => {
  const rawRows =
    extractRawData(result);

  /*
   * Latest global
   */

  let latest =
    normalizeLatest(
      result?.latest
    );

  /*
   * Latest per node
   */

  const latestByNode =
    normalizeLatestByNode(
      result?.latest_by_node
    );

  /*
   * Jika latest global tidak ada,
   * gunakan raw data terbaru.
   */

  if (!latest) {
    latest =
      rawRows[0] ||
      null;
  }

  /*
   * Node status dari backend
   */

  let nodeStatus =
    normalizeNodeStatus(
      result?.node_status
    );

  /*
   * Tambahkan fallback node status
   */

  nodeStatus =
    buildNodeStatusFromLatest(
      latestByNode,
      nodeStatus
    );

  /*
   * Raw data
   */

  const rawData = {
    ...(result?.raw_data || {}),

    data: rawRows,

    count:
      result?.raw_data?.count ??
      rawRows.length
  };

  /*
   * Return response
   */

  return {
    ...result,

    latest,

    latest_by_node:
      latestByNode,

    node_status:
      nodeStatus,

    raw_data:
      rawData,

    data:
      rawRows,

    count:
      result?.count ??
      rawData.count ??
      rawRows.length
  };
};


/*
|--------------------------------------------------------------------------
| FETCH SENSOR DATA
|--------------------------------------------------------------------------
|
| GET /api/sensors
|--------------------------------------------------------------------------
*/

export const fetchSensorData =
  async (filters = {}) => {
    try {
      const params =
        buildQueryParams(filters);

      const url = params
        ? `${API_BASE_URL}/sensors?${params}`
        : `${API_BASE_URL}/sensors`;

      const result =
        await requestJSON(url);

      if (
        Array.isArray(result?.data)
      ) {
        return {
          ...result,

          data:
            result.data.map(
              normalizeSensorRow
            ),

          count:
            result.count ??
            result.data.length
        };
      }

      return result;

    } catch (error) {
      console.error(
        "[API] Error fetching sensor data:",
        error
      );

      throw error;
    }
  };


/*
|--------------------------------------------------------------------------
| FETCH SENSOR SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/sensors/summary
|--------------------------------------------------------------------------
*/

export const fetchSensorSummary =
  async (filters = {}) => {
    try {
      const params =
        buildQueryParams(filters);

      const url = params
        ? `${API_BASE_URL}/sensors/summary?${params}`
        : `${API_BASE_URL}/sensors/summary`;

      return await requestJSON(url);

    } catch (error) {
      console.error(
        "[API] Error fetching sensor summary:",
        error
      );

      throw error;
    }
  };


/*
|--------------------------------------------------------------------------
| FETCH ANALYTICS
|--------------------------------------------------------------------------
|
| GET /api/analytics/dashboard
|--------------------------------------------------------------------------
*/

export const fetchAnalytics =
  async (filters = {}) => {
    try {
      const params =
        buildQueryParams(filters);

      const url = params
        ? `${API_BASE_URL}/analytics/dashboard?${params}`
        : `${API_BASE_URL}/analytics/dashboard`;

      return await requestJSON(url);

    } catch (error) {
      console.error(
        "[API] Error fetching analytics:",
        error
      );

      throw error;
    }
  };


/*
|--------------------------------------------------------------------------
| FETCH BUSINESS INTELLIGENCE
|--------------------------------------------------------------------------
|
| GET /api/bi
|--------------------------------------------------------------------------
*/

export const fetchBI =
  async (filters = {}) => {
    try {
      const params =
        buildQueryParams(filters);

      const url = params
        ? `${API_BASE_URL}/bi?${params}`
        : `${API_BASE_URL}/bi`;

      console.log(
        "[API] Fetch BI:",
        url
      );

      const result =
        await requestJSON(url);

      return normalizeBIResponse(
        result
      );

    } catch (error) {
      console.error(
        "[API] Error fetching BI data:",
        error
      );

      throw error;
    }
  };


/*
|--------------------------------------------------------------------------
| FETCH ACTIVE NODES
|--------------------------------------------------------------------------
|
| GET /api/sensors/nodes
|--------------------------------------------------------------------------
*/

export const fetchActiveNodes =
  async () => {
    try {
      const result =
        await requestJSON(
          `${API_BASE_URL}/sensors/nodes`
        );

      if (
        Array.isArray(result?.data)
      ) {
        return result.data;
      }

      if (
        Array.isArray(result)
      ) {
        return result;
      }

      return [];

    } catch (error) {
      console.error(
        "[API] Error fetching active nodes:",
        error
      );

      throw error;
    }
  };


/*
|--------------------------------------------------------------------------
| POLLING INTERVAL
|--------------------------------------------------------------------------
*/

export const getPollingInterval =
  () => POLLING_INTERVAL;


/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
*/

export const getApiBaseUrl =
  () => API_BASE_URL;


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default {
  fetchSensorData,
  fetchSensorSummary,
  fetchAnalytics,
  fetchBI,
  fetchActiveNodes,
  getPollingInterval,
  getApiBaseUrl
};