// Helper Parsing Payload JSON Telemetri
export const parseTelemetryPayload = (payloadString) => {
  try {
    return JSON.parse(payloadString);
  } catch (e) {
    console.error('Invalid JSON payload', e);
    return null;
  }
};
