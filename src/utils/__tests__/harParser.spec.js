import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { extractHeader, parseServerTimingDur, parseTimings, parseHarFile } from '../harParser'

describe('extractHeader', () => {
  const headers = [
    { name: 'Content-Type', value: 'application/json' },
    { name: 'X-Request-ID', value: 'abc-123' },
    { name: 'Server-Timing', value: 'db;dur=45.2' },
  ]

  it('finds header case-insensitively', () => {
    expect(extractHeader(headers, 'content-type')).toBe('application/json')
    expect(extractHeader(headers, 'CONTENT-TYPE')).toBe('application/json')
    expect(extractHeader(headers, 'Content-Type')).toBe('application/json')
  })

  it('returns null for missing header', () => {
    expect(extractHeader(headers, 'Authorization')).toBeNull()
  })

  it('returns null for empty headers array', () => {
    expect(extractHeader([], 'Content-Type')).toBeNull()
  })
})

describe('parseServerTimingDur', () => {
  it('parses dur value from Server-Timing string', () => {
    expect(parseServerTimingDur('db;dur=45.2, app;dur=100.3')).toBe(45.2)
  })

  it('parses integer dur value', () => {
    expect(parseServerTimingDur('proxy;dur=96')).toBe(96)
  })

  it('parses dur with description', () => {
    expect(parseServerTimingDur("proxy;desc='Proxy';dur=096")).toBe(96)
  })

  it('returns null for null/undefined input', () => {
    expect(parseServerTimingDur(null)).toBeNull()
    expect(parseServerTimingDur(undefined)).toBeNull()
    expect(parseServerTimingDur('')).toBeNull()
  })

  it('returns null for string without dur', () => {
    expect(parseServerTimingDur('cache;desc=HIT')).toBeNull()
  })
})

describe('parseTimings', () => {
  it('parses valid timing values', () => {
    const result = parseTimings({ dns: 10, connect: 20, ssl: 15, send: 5, wait: 90, receive: 10.5 })
    expect(result).toEqual({ dns: 10, connect: 20, ssl: 15, send: 5, wait: 90, receive: 10.5 })
  })

  it('clamps negative values to 0', () => {
    const result = parseTimings({ dns: -1, connect: -5, ssl: -1, send: 5, wait: 90, receive: 10 })
    expect(result.dns).toBe(0)
    expect(result.connect).toBe(0)
    expect(result.ssl).toBe(0)
    expect(result.send).toBe(5)
  })

  it('converts NaN to 0', () => {
    const result = parseTimings({ dns: NaN, connect: 'abc', ssl: undefined, send: null, wait: 90, receive: 10 })
    expect(result.dns).toBe(0)
    expect(result.connect).toBe(0)
    expect(result.ssl).toBe(0)
    expect(result.send).toBe(0)
  })

  it('handles Infinity as non-finite', () => {
    const result = parseTimings({ dns: Infinity, connect: -Infinity, ssl: 0, send: 0, wait: 0, receive: 0 })
    expect(result.dns).toBe(0)
    expect(result.connect).toBe(0)
  })
})

describe('parseHarFile', () => {
  let testFilterHar

  beforeAll(() => {
    const harPath = path.resolve(__dirname, '../../../test-filters.har')
    testFilterHar = JSON.parse(fs.readFileSync(harPath, 'utf-8'))
  })

  it('parses test-filters.har with 9 entries', () => {
    const result = parseHarFile(testFilterHar, 'test-filters.har')
    expect(result.entries).toHaveLength(9)
    expect(result.total_requests).toBe(9)
    expect(result.filename).toBe('test-filters.har')
  })

  it('extracts x_request_id from request headers', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    const first = result.entries[0]
    expect(first.x_request_id).toBe('req-users-001')
  })

  it('extracts server_timing_dur from response headers', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    const first = result.entries[0]
    expect(first.server_timing_dur).toBe(45.2)
  })

  it('counts errors (4xx + 5xx)', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    // entry 4: 404, entry 5: 500
    expect(result.error_count).toBe(2)
  })

  it('sets time_relative=0 for first entry', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    expect(result.entries[0].time_relative).toBe(0)
  })

  it('calculates time_relative > 0 for later entries', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    expect(result.entries[1].time_relative).toBe(500)
    expect(result.entries[2].time_relative).toBe(1000)
  })

  it('parses URL into domain and path', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    const first = result.entries[0]
    expect(first.domain).toBe('api.example.com')
    expect(first.path).toBe('/v1/users?limit=10')
  })

  it('extracts sentry_trace header', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    expect(result.entries[0].sentry_trace).toBe('d7c60df4a1b2c3d4e5f6g7h8i9j0k1l2-a1b2c3d4e5f6g7h8-1')
    expect(result.entries[1].sentry_trace).toBeNull() // no sentry-trace header
  })

  it('uses traceId from response body as fallback for x_request_id', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    // Entry 6 (fallback-test) has no X-Request-ID header but has traceId in body
    const entry = result.entries[6]
    expect(entry.x_request_id).toBe('trace-fallback-id-123')
  })

  it('calculates total_size from response sizes', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    // 1024+256+0+100+45+150+100+50+50 = 1775
    expect(result.total_size).toBe(1775)
  })

  it('returns empty entries for empty HAR', () => {
    const result = parseHarFile({ log: { entries: [] } }, 'empty.har')
    expect(result.entries).toHaveLength(0)
    expect(result.total_requests).toBe(0)
    expect(result.error_count).toBe(0)
  })

  it('generates session_id', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    expect(result.session_id).toBeTruthy()
    expect(result.session_id.length).toBe(8)
  })

  it('creates detailsCache with raw HAR data', () => {
    const result = parseHarFile(testFilterHar, 'test.har')
    expect(result.detailsCache).toBeInstanceOf(Map)
    expect(result.detailsCache.size).toBe(9)
    const detail = result.detailsCache.get(0)
    expect(detail.request.method).toBe('GET')
    expect(detail.response.status).toBe(200)
  })
})
