/**
 * HAR file parser (JS Version)
 * Converts raw HAR JSON to normalized RequestEntry objects in the browser.
 */

/**
 * Extract header value by name (case-insensitive)
 */
export function extractHeader(headers, name) {
  const nameLower = name.toLowerCase();
  const header = headers.find(h => h.name.toLowerCase() === nameLower);
  return header ? header.value : null;
}

/**
 * Parses the Server-Timing header string and extracts the first 'dur' value.
 * Example: "proxy;desc='Proxy';dur=096, db;dur=100" -> 96.0
 */
export function parseServerTimingDur(serverTimingString) {
  if (!serverTimingString) return null;
  
  const match = serverTimingString.match(/dur=(\d+(\.\d+)?)/);
  if (match) {
    try {
      return parseFloat(match[1]);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Parse HAR timings object to simplified model.
 */
export function parseTimings(timings) {
  const toNumber = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? Math.max(num, 0) : 0
  }

  return {
    dns: toNumber(timings.dns),
    connect: toNumber(timings.connect),
    send: toNumber(timings.send),
    wait: toNumber(timings.wait),
    receive: toNumber(timings.receive),
    ssl: toNumber(timings.ssl),
  };
}

/**
 * Main parser function
 */
export function parseHarFile(harData, filename) {
  const sessionId = crypto.randomUUID().substring(0, 8);
  const entriesData = harData.log?.entries || [];
  const detailsCache = new Map();

  if (entriesData.length === 0) {
    return {
      session_id: sessionId,
      filename: filename,
      entries: [],
      total_requests: 0,
      total_size: 0,
      error_count: 0,
      total_duration: 0,
      detailsCache
    };
  }

  // Find first request time for relative timing (guard invalid dates)
  let firstRequestTime = null;
  entriesData.forEach(entry => {
    if (!entry.startedDateTime) return;
    const time = Date.parse(entry.startedDateTime);
    if (!Number.isFinite(time)) return;
    if (firstRequestTime === null || time < firstRequestTime) {
      firstRequestTime = time;
    }
  });

  if (!Number.isFinite(firstRequestTime)) firstRequestTime = 0;

  let totalSize = 0;
  let errorCount = 0;
  let lastRequestTime = firstRequestTime;

  const parsedEntries = entriesData.map((entry, idx) => {
    try {
      const request = entry.request || {};
      const response = entry.response || {};
      const timings = entry.timings || {};

      // Parse URL
      const url = request.url || "";
      let domain = "";
      let path = "/";
      try {
        const parsedUrl = new URL(url);
        domain = parsedUrl.host;
        path = parsedUrl.pathname + parsedUrl.search;
      } catch (e) {
        domain = "invalid-url";
      }

      // Timing
      const parsedStart = entry.startedDateTime ? Date.parse(entry.startedDateTime) : NaN;
      const timeStart = Number.isFinite(parsedStart) ? parsedStart : firstRequestTime;
      const timeRelative = Math.max(0, timeStart - firstRequestTime);
      const rawDuration = Number(entry.time)
      const duration = Number.isFinite(rawDuration) ? Math.max(rawDuration, 0) : 0;

      if (Number.isFinite(timeStart) && timeStart > lastRequestTime) {
        lastRequestTime = timeStart;
      }

      // Status
      const statusCode = response.status || 0;
      const statusText = response.statusText || "Unknown";
      if (statusCode >= 400) {
        errorCount++;
      }

      // Sizes
      const respSize = response.content?.size || 0;
      const reqSize = (request.headersSize || 0) + (request.bodySize || 0);
      totalSize += Math.max(respSize, 0);

      // Headers & Observability
      const respHeaders = response.headers || [];
      const reqHeaders = request.headers || [];
      
      const serverTiming = extractHeader(respHeaders, "Server-Timing");
      const serverTimingDur = parseServerTimingDur(serverTiming);

      let xRequestId = extractHeader(respHeaders, "X-Request-ID") || extractHeader(reqHeaders, "X-Request-ID");
      const clientIp = extractHeader(reqHeaders, "X-Forwarded-For");
      const authority = extractHeader(reqHeaders, ":authority") || extractHeader(reqHeaders, "Host");
      const sentryTrace = extractHeader(reqHeaders, "sentry-trace");

      const timingData = parseTimings(timings);
      const mimeType = response.content?.mimeType || "";

      // Store full details for drawer
      detailsCache.set(idx, {
        id: idx,
        request: {
          method: request.method || "GET",
          url: request.url || "",
          headers: request.headers || [],
          queryString: request.queryString || [],
          postData: request.postData || null,
          httpVersion: request.httpVersion || "",
        },
        response: {
          status: response.status || 0,
          statusText: response.statusText || "",
          headers: response.headers || [],
          content: response.content || {},
          httpVersion: response.httpVersion || "",
        },
        timings: timings,
        startedDateTime: entry.startedDateTime || "",
        time: entry.time || 0,
      });

      return {
        id: idx,
        url,
        domain,
        path,
        method: request.method || "GET",
        status_code: statusCode,
        status_text: statusText,
        time_start: timeStart,
        time_relative: timeRelative,
        duration,
        ...timingData,
        req_size: Math.max(reqSize, 0),
        resp_size: Math.max(respSize, 0),
        mime_type: mimeType,
        client_ip: clientIp,
        authority,
        server_timing: serverTiming,
        server_timing_dur: serverTimingDur,
        x_request_id: xRequestId,
        sentry_trace: sentryTrace
      };
    } catch (e) {
      console.warn(`Failed to parse entry ${idx}:`, e);
      return null;
    }
  }).filter(e => e !== null);

  const totalDuration = parsedEntries.length > 0 ? (lastRequestTime - firstRequestTime) : 0;

  return {
    session_id: sessionId,
    filename: filename,
    entries: parsedEntries,
    total_requests: parsedEntries.length,
    total_size: totalSize,
    error_count: errorCount,
    total_duration: totalDuration,
    first_request_time: firstRequestTime,
    last_request_time: lastRequestTime,
    detailsCache
  };
}
