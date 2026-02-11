import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHarStore } from '../harStore'
import { parseHarFile } from '@/utils/harParser'
import fs from 'fs'
import path from 'path'

describe('harStore', () => {
  let store
  let testFilterHar, testComparisonHar
  let parsedFilterSession, parsedComparisonSession

  beforeAll(() => {
    const root = path.resolve(__dirname, '../../..')
    testFilterHar = JSON.parse(fs.readFileSync(path.join(root, 'test-filters.har'), 'utf-8'))
    testComparisonHar = JSON.parse(fs.readFileSync(path.join(root, 'test-comparison.har'), 'utf-8'))
    parsedFilterSession = parseHarFile(testFilterHar, 'test-filters.har')
    parsedComparisonSession = parseHarFile(testComparisonHar, 'test-comparison.har')
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useHarStore()
    localStorage.clear()
  })

  // ─── Helper ───────────────────────────────────────────────────────

  function loadFilterEntries() {
    store.entries = parsedFilterSession.entries
    store.currentSession = parsedFilterSession
  }

  function makeEntry(overrides = {}) {
    return {
      id: 0,
      url: 'https://example.com/test',
      domain: 'example.com',
      path: '/test',
      method: 'GET',
      status_code: 200,
      status_text: 'OK',
      time_start: Date.now(),
      time_relative: 0,
      duration: 100,
      dns: 0,
      connect: 0,
      ssl: 0,
      send: 0,
      wait: 90,
      receive: 10,
      req_size: 0,
      resp_size: 500,
      mime_type: 'application/json',
      client_ip: null,
      authority: null,
      server_timing: null,
      server_timing_dur: null,
      x_request_id: null,
      trace_id: null,
      sentry_trace: null,
      ...overrides,
    }
  }

  // ─── Getters ──────────────────────────────────────────────────────

  describe('totalRequests', () => {
    it('returns 0 for empty entries', () => {
      expect(store.totalRequests).toBe(0)
    })

    it('returns entry count from test HAR', () => {
      loadFilterEntries()
      expect(store.totalRequests).toBe(9)
    })
  })

  describe('errorCount', () => {
    it('returns 0 when no errors', () => {
      store.entries = [makeEntry({ status_code: 200 })]
      expect(store.errorCount).toBe(0)
    })

    it('counts 4xx and 5xx entries', () => {
      loadFilterEntries()
      // test-filters.har has 404 (profile) and 500 (users/123)
      expect(store.errorCount).toBe(2)
    })

    it('counts exactly 400 as error', () => {
      store.entries = [
        makeEntry({ status_code: 399 }),
        makeEntry({ id: 1, status_code: 400 }),
        makeEntry({ id: 2, status_code: 500 }),
      ]
      expect(store.errorCount).toBe(2)
    })
  })

  describe('slowestRequests', () => {
    it('returns empty array for no entries', () => {
      expect(store.slowestRequests).toEqual([])
    })

    it('returns top 10 sorted descending by duration', () => {
      loadFilterEntries()
      const slowest = store.slowestRequests
      expect(slowest.length).toBeLessThanOrEqual(10)
      // The PUT /v1/users/123 with 1200ms should be first
      expect(slowest[0].duration).toBe(1200)
      // Verify descending order
      for (let i = 1; i < slowest.length; i++) {
        expect(slowest[i].duration).toBeLessThanOrEqual(slowest[i - 1].duration)
      }
    })

    it('returns at most 10 entries when more exist', () => {
      store.entries = Array.from({ length: 15 }, (_, i) =>
        makeEntry({ id: i, duration: i * 10 })
      )
      expect(store.slowestRequests).toHaveLength(10)
      expect(store.slowestRequests[0].duration).toBe(140)
    })
  })

  describe('sessionDuration', () => {
    it('returns 0 for empty entries', () => {
      expect(store.sessionDuration).toBe(0)
    })

    it('calculates max(time_relative + duration)', () => {
      store.entries = [
        makeEntry({ time_relative: 0, duration: 100 }),
        makeEntry({ id: 1, time_relative: 50, duration: 200 }),
        makeEntry({ id: 2, time_relative: 300, duration: 10 }),
      ]
      // max(100, 250, 310) = 310
      expect(store.sessionDuration).toBe(310)
    })

    it('handles non-finite time_relative gracefully', () => {
      store.entries = [
        makeEntry({ time_relative: NaN, duration: 100 }),
      ]
      // NaN time_relative treated as 0, so 0 + 100 = 100
      expect(store.sessionDuration).toBe(100)
    })

    it('handles negative duration as 0', () => {
      store.entries = [
        makeEntry({ time_relative: 50, duration: -10 }),
      ]
      // negative duration clamped to 0, so 50 + 0 = 50
      expect(store.sessionDuration).toBe(50)
    })
  })

  describe('maxRequestDuration', () => {
    it('returns 0 for empty entries', () => {
      expect(store.maxRequestDuration).toBe(0)
    })

    it('returns the maximum duration', () => {
      loadFilterEntries()
      expect(store.maxRequestDuration).toBe(1200)
    })
  })

  describe('totalSize', () => {
    it('returns 0 for empty entries', () => {
      expect(store.totalSize).toBe(0)
    })

    it('sums resp_size of all entries', () => {
      store.entries = [
        makeEntry({ resp_size: 100 }),
        makeEntry({ id: 1, resp_size: 200 }),
        makeEntry({ id: 2, resp_size: 300 }),
      ]
      expect(store.totalSize).toBe(600)
    })

    it('calculates total size from test HAR', () => {
      loadFilterEntries()
      // 1024 + 256 + 0 + 100 + 45 + 150 + 100 + 50 + 50 = 1775
      expect(store.totalSize).toBe(1775)
    })
  })

  describe('activeFilterCount', () => {
    it('returns 0 when no filters active', () => {
      expect(store.activeFilterCount).toBe(0)
    })

    it('counts methods filter', () => {
      store.filters.methods = ['GET']
      expect(store.activeFilterCount).toBe(1)
    })

    it('counts path filter (trims whitespace)', () => {
      store.filters.path = '   '
      expect(store.activeFilterCount).toBe(0)
      store.filters.path = 'api'
      expect(store.activeFilterCount).toBe(1)
    })

    it('counts statusGroups filter', () => {
      store.filters.statusGroups = ['2xx', '4xx']
      expect(store.activeFilterCount).toBe(1) // one filter type, not two
    })

    it('counts showErrorsOnly', () => {
      store.showErrorsOnly = true
      expect(store.activeFilterCount).toBe(1)
    })

    it('counts showSentryTraceOnly', () => {
      store.showSentryTraceOnly = true
      expect(store.activeFilterCount).toBe(1)
    })

    it('counts all active filter types', () => {
      store.filters.methods = ['GET']
      store.filters.path = '/api'
      store.filters.statusGroups = ['2xx']
      store.showErrorsOnly = true
      store.showSentryTraceOnly = true
      expect(store.activeFilterCount).toBe(5)
    })
  })

  describe('selectedEntry', () => {
    it('returns null when no entry selected', () => {
      expect(store.selectedEntry).toBeNull()
    })

    it('returns null when selectedEntryId does not match', () => {
      store.entries = [makeEntry({ id: 1 })]
      store.selectedEntryId = 999
      expect(store.selectedEntry).toBeNull()
    })

    it('returns entry matching selectedEntryId', () => {
      const entry = makeEntry({ id: 5 })
      store.entries = [makeEntry({ id: 1 }), entry, makeEntry({ id: 10 })]
      store.selectedEntryId = 5
      expect(store.selectedEntry).toEqual(entry)
    })
  })

  // ─── matchedRequests ──────────────────────────────────────────────

  describe('matchedRequests', () => {
    it('returns empty array when no sessions loaded', () => {
      expect(store.matchedRequests).toEqual([])
    })

    it('returns empty array when only session1 loaded', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      expect(store.matchedRequests).toEqual([])
    })

    it('returns empty array when only session2 loaded', () => {
      store.comparisonSessions.session2 = parsedComparisonSession
      expect(store.matchedRequests).toEqual([])
    })

    it('matches entries by method + path without query params', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      // Both files share: GET /v1/users, POST /v1/auth/login, GET /v1/parallel/1, GET /v1/profile, PUT /v1/users/123
      expect(matched.length).toBe(5)

      const keys = matched.map(m => m.key)
      expect(keys).toContain('GET /v1/users')
      expect(keys).toContain('POST /v1/auth/login')
      expect(keys).toContain('GET /v1/parallel/1')
      expect(keys).toContain('GET /v1/profile')
      expect(keys).toContain('PUT /v1/users/123')
    })

    it('does not include entries only in one session', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      const keys = matched.map(m => m.key)
      // These are only in test-filters.har
      expect(keys).not.toContain('GET /assets/logo.png')
      expect(keys).not.toContain('GET /v1/fallback-test')
      expect(keys).not.toContain('GET /v1/sentry-blocked-1')
      expect(keys).not.toContain('GET /v1/sentry-blocked-2')
    })

    it('calculates duration diff correctly', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      const usersMatch = matched.find(m => m.key === 'GET /v1/users')
      // session1: 150.5ms, session2: 300ms => diff = 149.5
      expect(usersMatch.aggregated.diff.duration.diff).toBeCloseTo(149.5)
      expect(usersMatch.aggregated.diff.duration.improved).toBe(false) // got slower
    })

    it('calculates size diff correctly', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      const loginMatch = matched.find(m => m.key === 'POST /v1/auth/login')
      // Both have resp_size 256
      expect(loginMatch.aggregated.diff.size.diff).toBe(0)
    })

    it('calculates server timing diff when both have server_timing_dur', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      const usersMatch = matched.find(m => m.key === 'GET /v1/users')
      // session1 Server-Timing: db;dur=45.2 => 45.2
      // session2 Server-Timing: db;dur=150.0 => 150
      expect(usersMatch.aggregated.diff.serverTiming).not.toBeNull()
      expect(usersMatch.aggregated.diff.serverTiming.diff).toBeCloseTo(150 - 45.2)
    })

    it('sets serverTimingDiff to null when either has null server_timing_dur', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      // POST /v1/auth/login has no Server-Timing in either session
      const loginMatch = matched.find(m => m.key === 'POST /v1/auth/login')
      expect(loginMatch.aggregated.diff.serverTiming).toBeNull()
    })

    it('sorts by absolute duration diff descending', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      for (let i = 1; i < matched.length; i++) {
        const diffA = Math.abs(matched[i - 1].aggregated.diff?.duration?.diff || 0)
        const diffB = Math.abs(matched[i].aggregated.diff?.duration?.diff || 0)
        expect(diffA).toBeGreaterThanOrEqual(diffB)
      }
    })

    it('sets hasDifference flag based on thresholds', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      // PUT /v1/users/123: 1200 vs 800 -> big diff, should have hasDifference
      const putMatch = matched.find(m => m.key === 'PUT /v1/users/123')
      expect(putMatch.hasDifference).toBe(true)
    })

    it('sets hasDifference when status changed', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      const matched = store.matchedRequests
      // GET /v1/profile: 404 -> 200, status changed
      const profileMatch = matched.find(m => m.key === 'GET /v1/profile')
      expect(profileMatch.hasDifference).toBe(true)
      expect(profileMatch.aggregated.diff.status.changed).toBe(true)
      expect(profileMatch.aggregated.diff.status.improved).toBe(true)
    })

    it('detects status worsened', () => {
      const session1 = {
        entries: [makeEntry({ status_code: 200 })],
      }
      const session2 = {
        entries: [makeEntry({ status_code: 500 })],
      }
      store.comparisonSessions.session1 = session1
      store.comparisonSessions.session2 = session2

      const matched = store.matchedRequests
      expect(matched[0].aggregated.diff.status.worsened).toBe(true)
      expect(matched[0].aggregated.diff.status.improved).toBe(false)
    })

    it('calculates averages for duplicate entries', () => {
      const session1 = {
        entries: [
          makeEntry({ id: 0, path: '/api/data', duration: 100, resp_size: 200, server_timing_dur: 50 }),
          makeEntry({ id: 1, path: '/api/data', duration: 200, resp_size: 400, server_timing_dur: 100 }),
        ],
      }
      const session2 = {
        entries: [
          makeEntry({ id: 0, path: '/api/data', duration: 300, resp_size: 600, server_timing_dur: 150 }),
        ],
      }
      store.comparisonSessions.session1 = session1
      store.comparisonSessions.session2 = session2

      const matched = store.matchedRequests
      expect(matched).toHaveLength(1)
      // session1 avg: duration=150, resp_size=300, server_timing_dur=75
      expect(matched[0].aggregated.entry1.duration).toBe(150)
      expect(matched[0].aggregated.entry1.resp_size).toBe(300)
      expect(matched[0].aggregated.entry1.server_timing_dur).toBe(75)
      expect(matched[0].aggregated.entry1.isAverage).toBe(true)
      expect(matched[0].aggregated.entry1.count).toBe(2)
      // session2 has single entry so no average
      expect(matched[0].aggregated.entry2.duration).toBe(300)
    })

    it('handles null server_timing_dur in averages', () => {
      const session1 = {
        entries: [
          makeEntry({ id: 0, path: '/api/data', duration: 100, server_timing_dur: null }),
          makeEntry({ id: 1, path: '/api/data', duration: 200, server_timing_dur: 80 }),
        ],
      }
      const session2 = {
        entries: [
          makeEntry({ id: 0, path: '/api/data', duration: 100, server_timing_dur: null }),
        ],
      }
      store.comparisonSessions.session1 = session1
      store.comparisonSessions.session2 = session2

      const matched = store.matchedRequests
      // Only one entry has server_timing_dur, average should be 80 (from that one)
      expect(matched[0].aggregated.entry1.server_timing_dur).toBe(80)
      // session2 has null, so diff should be null
      expect(matched[0].aggregated.diff.serverTiming).toBeNull()
    })

    it('creates individual pairs up to max of both groups', () => {
      const session1 = {
        entries: [
          makeEntry({ id: 0, path: '/api/data', duration: 100 }),
          makeEntry({ id: 1, path: '/api/data', duration: 200 }),
          makeEntry({ id: 2, path: '/api/data', duration: 300 }),
        ],
      }
      const session2 = {
        entries: [
          makeEntry({ id: 0, path: '/api/data', duration: 150 }),
        ],
      }
      store.comparisonSessions.session1 = session1
      store.comparisonSessions.session2 = session2

      const matched = store.matchedRequests
      expect(matched[0].pairs).toHaveLength(3)
      expect(matched[0].pairs[0].entry1).not.toBeNull()
      expect(matched[0].pairs[0].entry2).not.toBeNull()
      expect(matched[0].pairs[1].entry1).not.toBeNull()
      expect(matched[0].pairs[1].entry2).toBeNull()
      expect(matched[0].pairs[2].entry1).not.toBeNull()
      expect(matched[0].pairs[2].entry2).toBeNull()
    })
  })

  // ─── Actions ──────────────────────────────────────────────────────

  describe('clearSession', () => {
    it('resets all session state', () => {
      loadFilterEntries()
      store.error = 'some error'
      store.showErrorsOnly = true
      store.showSentryTraceOnly = true
      store.selectedEntryId = 3
      store.filters.methods = ['GET']
      store.filters.path = '/api'
      store.filters.statusGroups = ['2xx']

      store.clearSession()

      expect(store.currentSession).toBeNull()
      expect(store.entries).toEqual([])
      expect(store.error).toBeNull()
      expect(store.showErrorsOnly).toBe(false)
      expect(store.showSentryTraceOnly).toBe(false)
      expect(store.selectedEntryId).toBeNull()
      expect(store.filters.methods).toEqual([])
      expect(store.filters.path).toBe('')
      expect(store.filters.statusGroups).toEqual([])
    })
  })

  describe('toggleMethodFilter', () => {
    it('adds method when not present', () => {
      store.toggleMethodFilter('GET')
      expect(store.filters.methods).toEqual(['GET'])
    })

    it('removes method when already present', () => {
      store.filters.methods = ['GET', 'POST']
      store.toggleMethodFilter('GET')
      expect(store.filters.methods).toEqual(['POST'])
    })

    it('can toggle multiple methods', () => {
      store.toggleMethodFilter('GET')
      store.toggleMethodFilter('POST')
      expect(store.filters.methods).toEqual(['GET', 'POST'])
      store.toggleMethodFilter('GET')
      expect(store.filters.methods).toEqual(['POST'])
    })
  })

  describe('toggleStatusFilter', () => {
    it('adds status group when not present', () => {
      store.toggleStatusFilter('2xx')
      expect(store.filters.statusGroups).toEqual(['2xx'])
    })

    it('removes status group when already present', () => {
      store.filters.statusGroups = ['2xx', '4xx']
      store.toggleStatusFilter('2xx')
      expect(store.filters.statusGroups).toEqual(['4xx'])
    })
  })

  describe('clearAllFilters', () => {
    it('resets all filter state', () => {
      store.filters.methods = ['GET', 'POST']
      store.filters.path = '/api'
      store.filters.statusGroups = ['2xx', '5xx']
      store.showErrorsOnly = true
      store.showSentryTraceOnly = true

      store.clearAllFilters()

      expect(store.filters.methods).toEqual([])
      expect(store.filters.path).toBe('')
      expect(store.filters.statusGroups).toEqual([])
      expect(store.showErrorsOnly).toBe(false)
      expect(store.showSentryTraceOnly).toBe(false)
    })
  })

  // ─── URL Generators ──────────────────────────────────────────────

  describe('getLokiUrl', () => {
    it('returns null for null entry', () => {
      expect(store.getLokiUrl(null)).toBeNull()
    })

    it('returns null when grafana_loki_url is empty', () => {
      store.grafanaConfig.grafana_loki_url = ''
      const entry = makeEntry({ x_request_id: 'req-123' })
      expect(store.getLokiUrl(entry)).toBeNull()
    })

    it('substitutes {request_id}, {from}, {to}', () => {
      store.grafanaConfig.grafana_loki_url = 'https://loki.test/?id={request_id}&from={from}&to={to}'
      store.grafanaConfig.grafana_loki_escape = false
      const timeStart = new Date('2026-02-09T10:00:00.000Z').getTime()
      const entry = makeEntry({ x_request_id: 'req-abc-123', time_start: timeStart })

      const url = store.getLokiUrl(entry)
      expect(url).toContain('id=req-abc-123')
      expect(url).toContain('from=2026-02-09T09:58:00.000Z')
      expect(url).toContain('to=2026-02-09T10:02:00.000Z')
    })

    it('escapes ? as .? when grafana_loki_escape is true', () => {
      store.grafanaConfig.grafana_loki_url = 'https://loki.test/?id={request_id}'
      store.grafanaConfig.grafana_loki_escape = true
      const entry = makeEntry({ x_request_id: 'req?special?chars' })

      const url = store.getLokiUrl(entry)
      expect(url).toContain('id=req.?special.?chars')
    })

    it('does not escape ? when grafana_loki_escape is false', () => {
      store.grafanaConfig.grafana_loki_url = 'https://loki.test/?id={request_id}'
      store.grafanaConfig.grafana_loki_escape = false
      const entry = makeEntry({ x_request_id: 'req?special' })

      const url = store.getLokiUrl(entry)
      expect(url).toContain('id=req?special')
    })

    it('handles empty x_request_id', () => {
      store.grafanaConfig.grafana_loki_url = 'https://loki.test/?id={request_id}'
      const entry = makeEntry({ x_request_id: null })

      const url = store.getLokiUrl(entry)
      expect(url).toContain('id=')
    })
  })

  describe('getPathUrl', () => {
    it('returns null for null entry', () => {
      expect(store.getPathUrl(null)).toBeNull()
    })

    it('returns null when grafana_path_url is empty', () => {
      store.grafanaConfig.grafana_path_url = ''
      expect(store.getPathUrl(makeEntry())).toBeNull()
    })

    it('substitutes {path} without leading slash, URL-encoded', () => {
      store.grafanaConfig.grafana_path_url = 'https://path.test/?path={path}'
      store.grafanaConfig.grafana_path_loki_escape = false
      const entry = makeEntry({ path: '/v1/users/123' })

      const url = store.getPathUrl(entry)
      expect(url).toContain('path=' + encodeURIComponent('v1/users/123'))
    })

    it('substitutes {client_name} from authority', () => {
      store.grafanaConfig.grafana_path_url = 'https://path.test/?client={client_name}'
      const entry = makeEntry({ authority: 'api.example.com', domain: 'fallback.com' })

      const url = store.getPathUrl(entry)
      expect(url).toContain('client=' + encodeURIComponent('api.example.com'))
    })

    it('falls back to domain when authority is null', () => {
      store.grafanaConfig.grafana_path_url = 'https://path.test/?client={client_name}'
      const entry = makeEntry({ authority: null, domain: 'fallback.com' })

      const url = store.getPathUrl(entry)
      expect(url).toContain('client=' + encodeURIComponent('fallback.com'))
    })

    it('escapes ? in path when grafana_path_loki_escape is true', () => {
      store.grafanaConfig.grafana_path_url = 'https://path.test/?path={path}'
      store.grafanaConfig.grafana_path_loki_escape = true
      const entry = makeEntry({ path: '/api?foo=bar' })

      const url = store.getPathUrl(entry)
      // path is "api.?foo=bar" after escape, then URL-encoded
      expect(url).toContain('path=' + encodeURIComponent('api.?foo=bar'))
    })

    it('substitutes {from} and {to} with 2-minute window', () => {
      store.grafanaConfig.grafana_path_url = 'https://path.test/?from={from}&to={to}'
      const timeStart = new Date('2026-02-09T12:00:00.000Z').getTime()
      const entry = makeEntry({ time_start: timeStart })

      const url = store.getPathUrl(entry)
      expect(url).toContain('from=2026-02-09T11:58:00.000Z')
      expect(url).toContain('to=2026-02-09T12:02:00.000Z')
    })
  })

  describe('getSentryTraceUrl', () => {
    it('returns null for null entry', () => {
      expect(store.getSentryTraceUrl(null)).toBeNull()
    })

    it('returns null when no sentry_trace header', () => {
      const entry = makeEntry({ sentry_trace: null })
      expect(store.getSentryTraceUrl(entry)).toBeNull()
    })

    it('returns null when sentry_trace_url is not configured', () => {
      store.grafanaConfig.sentry_trace_url = ''
      const entry = makeEntry({ sentry_trace: 'abc-def-1' })
      expect(store.getSentryTraceUrl(entry)).toBeNull()
    })

    it('returns null when sentry-trace has fewer than 3 parts', () => {
      const entry = makeEntry({ sentry_trace: 'abc-def' })
      expect(store.getSentryTraceUrl(entry)).toBeNull()
    })

    it('extracts trace_id and substitutes into URL', () => {
      store.grafanaConfig.sentry_trace_url = 'https://sentry.test/?trace={trace_id}&from={from}&to={to}'
      const timeStart = new Date('2026-02-09T10:00:00.000Z').getTime()
      const entry = makeEntry({
        sentry_trace: 'd7c60df4a1b2c3d4e5f6g7h8i9j0k1l2-a1b2c3d4e5f6g7h8-1',
        time_start: timeStart,
      })

      const url = store.getSentryTraceUrl(entry)
      expect(url).toContain('trace=d7c60df4a1b2c3d4e5f6g7h8i9j0k1l2')
      expect(url).toContain('from=2026-02-09T09:58:00.000Z')
      expect(url).toContain('to=2026-02-09T10:02:00.000Z')
    })

    it('works with sentry-trace that has more than 3 parts', () => {
      store.grafanaConfig.sentry_trace_url = 'https://sentry.test/?trace={trace_id}'
      const entry = makeEntry({
        sentry_trace: 'aaa-bbb-ccc-ddd',
        time_start: Date.now(),
      })

      const url = store.getSentryTraceUrl(entry)
      expect(url).toContain('trace=aaa')
    })
  })

  // ─── Config Persistence ───────────────────────────────────────────

  describe('loadConfig', () => {
    it('loads defaults when localStorage is empty', () => {
      store.loadConfig()
      expect(store.grafanaConfig.grafana_loki_escape).toBe(true)
      expect(store.grafanaConfig.coroot_url).toBe('')
      expect(store.grafanaConfig.grafana_loki_url).toContain('{request_id}')
    })

    it('merges saved config with defaults', () => {
      const partial = { coroot_url: 'https://coroot.test/custom' }
      localStorage.setItem('har_manager_config', JSON.stringify(partial))

      store.loadConfig()
      expect(store.grafanaConfig.coroot_url).toBe('https://coroot.test/custom')
      // Other defaults remain
      expect(store.grafanaConfig.grafana_loki_escape).toBe(true)
    })

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('har_manager_config', 'NOT_JSON{{{')

      store.loadConfig()
      // Should fall back to defaults
      expect(store.grafanaConfig.grafana_loki_escape).toBe(true)
      expect(store.grafanaConfig.coroot_url).toBe('')
    })
  })

  describe('updateGrafanaConfig', () => {
    it('updates config and persists to localStorage', () => {
      store.updateGrafanaConfig({ coroot_url: 'https://coroot.new/' })

      expect(store.grafanaConfig.coroot_url).toBe('https://coroot.new/')
      // Other fields preserved
      expect(store.grafanaConfig.grafana_loki_escape).toBe(true)

      const saved = JSON.parse(localStorage.getItem('har_manager_config'))
      expect(saved.coroot_url).toBe('https://coroot.new/')
    })

    it('merges with existing config', () => {
      store.updateGrafanaConfig({ coroot_url: 'https://first/' })
      store.updateGrafanaConfig({ grafana_loki_escape: false })

      expect(store.grafanaConfig.coroot_url).toBe('https://first/')
      expect(store.grafanaConfig.grafana_loki_escape).toBe(false)
    })
  })

  describe('resetToDefaults', () => {
    it('restores default config and persists to localStorage', () => {
      store.updateGrafanaConfig({ coroot_url: 'https://custom/', grafana_loki_escape: false })

      store.resetToDefaults()

      expect(store.grafanaConfig.coroot_url).toBe('')
      expect(store.grafanaConfig.grafana_loki_escape).toBe(true)

      const saved = JSON.parse(localStorage.getItem('har_manager_config'))
      expect(saved.coroot_url).toBe('')
      expect(saved.grafana_loki_escape).toBe(true)
    })
  })

  // ─── Comparison Mode ─────────────────────────────────────────────

  describe('clearComparison', () => {
    it('clears both sessions and resets comparison mode', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession
      store.comparisonMode = true
      store.error = 'some error'

      store.clearComparison()

      expect(store.comparisonSessions.session1).toBeNull()
      expect(store.comparisonSessions.session2).toBeNull()
      expect(store.comparisonMode).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('clearComparisonSlot', () => {
    it('clears slot 1 only', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      store.clearComparisonSlot(1)

      expect(store.comparisonSessions.session1).toBeNull()
      expect(store.comparisonSessions.session2).not.toBeNull()
    })

    it('clears slot 2 only', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      store.clearComparisonSlot(2)

      expect(store.comparisonSessions.session1).not.toBeNull()
      expect(store.comparisonSessions.session2).toBeNull()
    })

    it('does nothing for invalid slot', () => {
      store.comparisonSessions.session1 = parsedFilterSession
      store.comparisonSessions.session2 = parsedComparisonSession

      store.clearComparisonSlot(3)

      expect(store.comparisonSessions.session1).not.toBeNull()
      expect(store.comparisonSessions.session2).not.toBeNull()
    })
  })

  // ─── Additional Actions ───────────────────────────────────────────

  describe('selectEntry / clearSelection', () => {
    it('sets and clears selectedEntryId', () => {
      store.selectEntry(42)
      expect(store.selectedEntryId).toBe(42)

      store.clearSelection()
      expect(store.selectedEntryId).toBeNull()
    })
  })

  describe('toggleErrorsFilter', () => {
    it('toggles showErrorsOnly', () => {
      expect(store.showErrorsOnly).toBe(false)
      store.toggleErrorsFilter()
      expect(store.showErrorsOnly).toBe(true)
      store.toggleErrorsFilter()
      expect(store.showErrorsOnly).toBe(false)
    })
  })

  describe('toggleSentryTraceFilter', () => {
    it('toggles showSentryTraceOnly', () => {
      expect(store.showSentryTraceOnly).toBe(false)
      store.toggleSentryTraceFilter()
      expect(store.showSentryTraceOnly).toBe(true)
      store.toggleSentryTraceFilter()
      expect(store.showSentryTraceOnly).toBe(false)
    })
  })

  describe('enableComparisonMode', () => {
    it('sets comparisonMode to true', () => {
      expect(store.comparisonMode).toBe(false)
      store.enableComparisonMode()
      expect(store.comparisonMode).toBe(true)
    })
  })

  describe('getCorootUrl', () => {
    it('returns null when coroot_url is empty', () => {
      store.grafanaConfig.coroot_url = ''
      expect(store.getCorootUrl()).toBeNull()
    })

    it('returns the configured URL', () => {
      store.grafanaConfig.coroot_url = 'https://coroot.example.com'
      expect(store.getCorootUrl()).toBe('https://coroot.example.com')
    })
  })
})
