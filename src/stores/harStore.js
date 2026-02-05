import { defineStore } from 'pinia'
import { parseHarFile } from '@/utils/harParser'

const STORAGE_KEY_CONFIG = 'har_manager_config'

const DEFAULT_CONFIG = {
  grafana_loki_url: '',
  grafana_loki_escape: true,
  coroot_url: '',
  grafana_path_url: '',
  grafana_path_loki_escape: true,
  sentry_trace_url: '',
}

export const useHarStore = defineStore('har', {
  state: () => ({
    currentSession: null,
    entries: [],
    loading: false,
    error: null,
    showErrorsOnly: false,
    showSentryTraceOnly: false,
    filters: {
      methods: [],
      path: '',
      statusGroups: []
    },
    grafanaConfig: { ...DEFAULT_CONFIG },
    selectedEntryId: null,
    entryDetailsCache: new Map(),
    // Comparison mode
    comparisonMode: false,
    comparisonSessions: {
      session1: null,
      session2: null,
    },
  }),

  getters: {
    /**
     * Get total number of requests
     */
    totalRequests: (state) => state.entries.length,

    /**
     * Get number of error responses (4xx, 5xx)
     */
    errorCount: (state) => state.entries.filter(e => e.status_code >= 400).length,

    /**
     * Get slowest requests
     */
    slowestRequests: (state) => {
      return [...state.entries]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
    },

    /**
     * Get all error requests
     */
    errorRequests: (state) => {
      return state.entries.filter(e => e.status_code >= 400)
    },

    /**
     * Get total session duration
     */
    sessionDuration: (state) => {
      if (state.entries.length === 0) return 0
      const times = state.entries
        .map(e => {
          const relative = Number.isFinite(e.time_relative) ? e.time_relative : 0
          const duration = Number.isFinite(e.duration) ? Math.max(e.duration, 0) : 0
          return relative + duration
        })
        .filter(Number.isFinite)
      return times.length > 0 ? Math.max(...times) : 0
    },

    /**
     * Get maximum request duration among all entries
     */
    maxRequestDuration: (state) => {
      if (state.entries.length === 0) return 0
      return Math.max(...state.entries.map(e => e.duration))
    },

    /**
     * Get total response size
     */
    totalSize: (state) => {
      return state.entries.reduce((sum, e) => sum + e.resp_size, 0)
    },

    /**
     * Get count of active filters
     */
    activeFilterCount: (state) => {
      let count = 0
      if (state.filters.methods.length > 0) count++
      if (state.filters.path.trim()) count++
      if (state.filters.statusGroups.length > 0) count++
      if (state.showErrorsOnly) count++
      if (state.showSentryTraceOnly) count++
      return count
    },

    /**
     * Get selected entry (normalized data)
     */
    selectedEntry: (state) => {
      if (state.selectedEntryId === null) return null
      return state.entries.find(e => e.id === state.selectedEntryId) || null
    },

    /**
     * Get selected entry full details (raw HAR data)
     */
    selectedEntryDetails: (state) => {
      if (state.selectedEntryId === null) return null
      return state.entryDetailsCache.get(state.selectedEntryId) || null
    },

    /**
     * Get matched requests for comparison
     * Returns array of matched pairs with aggregated and individual entries
     */
    matchedRequests: (state) => {
      if (!state.comparisonSessions.session1 || !state.comparisonSessions.session2) {
        return []
      }

      const entries1 = state.comparisonSessions.session1.entries
      const entries2 = state.comparisonSessions.session2.entries

      // Helper to normalize path (remove query params)
      const normalizePath = (path) => {
        if (!path) return ''
        return path.split('?')[0]
      }

      // Group entries by method + normalized path
      const groupByKey = (entries) => {
        const groups = new Map()
        entries.forEach(entry => {
          const key = `${entry.method} ${normalizePath(entry.path)}`
          if (!groups.has(key)) {
            groups.set(key, [])
          }
          groups.get(key).push(entry)
        })
        return groups
      }

      // Calculate average for multiple entries
      const calculateAverage = (entries) => {
        if (entries.length === 0) return null
        if (entries.length === 1) return entries[0]

        // Filter out null server_timing_dur for average calculation
        const validServerTimings = entries.filter(e => e.server_timing_dur !== null)
        const avgServerTiming = validServerTimings.length > 0
          ? validServerTimings.reduce((sum, e) => sum + e.server_timing_dur, 0) / validServerTimings.length
          : null

        const sum = entries.reduce((acc, e) => ({
          duration: acc.duration + e.duration,
          resp_size: acc.resp_size + e.resp_size,
          status_code: e.status_code, // Take first status code
        }), { duration: 0, resp_size: 0, status_code: entries[0].status_code })

        return {
          ...entries[0],
          duration: sum.duration / entries.length,
          resp_size: sum.resp_size / entries.length,
          server_timing_dur: avgServerTiming,
          isAverage: true,
          count: entries.length,
        }
      }

      // Calculate diff between two entries
      const calculateDiff = (entry1, entry2) => {
        if (!entry1 || !entry2) return null

        const durationDiff = entry2.duration - entry1.duration
        const durationPercent = entry1.duration > 0
          ? ((entry2.duration - entry1.duration) / entry1.duration * 100)
          : 0

        const sizeDiff = entry2.resp_size - entry1.resp_size
        const sizePercent = entry1.resp_size > 0
          ? ((entry2.resp_size - entry1.resp_size) / entry1.resp_size * 100)
          : 0

        const statusChanged = entry1.status_code !== entry2.status_code

        // Calculate server timing diff (handle null values)
        let serverTimingDiff = null
        if (entry1.server_timing_dur !== null && entry2.server_timing_dur !== null) {
          const serverDiff = entry2.server_timing_dur - entry1.server_timing_dur
          const serverPercent = entry1.server_timing_dur > 0
            ? ((entry2.server_timing_dur - entry1.server_timing_dur) / entry1.server_timing_dur * 100)
            : 0
          serverTimingDiff = {
            diff: serverDiff,
            percent: serverPercent,
            improved: serverDiff < 0, // faster is better
          }
        }

        return {
          duration: {
            diff: durationDiff,
            percent: durationPercent,
            improved: durationDiff < 0, // faster is better
          },
          serverTiming: serverTimingDiff,
          size: {
            diff: sizeDiff,
            percent: sizePercent,
            improved: sizeDiff < 0, // smaller is better
          },
          status: {
            changed: statusChanged,
            worsened: entry2.status_code >= 400 && entry1.status_code < 400,
            improved: entry1.status_code >= 400 && entry2.status_code < 400,
          },
        }
      }

      const groups1 = groupByKey(entries1)
      const groups2 = groupByKey(entries2)

      const matched = []

      // Find matching requests
      for (const [key, entries1Group] of groups1.entries()) {
        if (groups2.has(key)) {
          const entries2Group = groups2.get(key)

          // Calculate aggregated entry
          const avg1 = calculateAverage(entries1Group)
          const avg2 = calculateAverage(entries2Group)
          const avgDiff = calculateDiff(avg1, avg2)

          // Prepare individual pairs
          const pairs = []
          const maxPairs = Math.max(entries1Group.length, entries2Group.length)
          for (let i = 0; i < maxPairs; i++) {
            const e1 = entries1Group[i] || null
            const e2 = entries2Group[i] || null
            if (e1 || e2) {
              pairs.push({
                entry1: e1,
                entry2: e2,
                diff: calculateDiff(e1, e2),
              })
            }
          }

          matched.push({
            key,
            method: avg1.method,
            path: normalizePath(avg1.path),
            domain: avg1.domain,
            aggregated: {
              entry1: avg1,
              entry2: avg2,
              diff: avgDiff,
            },
            pairs,
            hasDifference: avgDiff && (
              Math.abs(avgDiff.duration.percent) > 0.1 ||
              (avgDiff.serverTiming && Math.abs(avgDiff.serverTiming.percent) > 0.1) ||
              avgDiff.status.changed
            ),
          })
        }
      }

      // Sort by absolute duration difference (largest first)
      matched.sort((a, b) => {
        const diffA = Math.abs(a.aggregated.diff?.duration?.diff || 0)
        const diffB = Math.abs(b.aggregated.diff?.duration?.diff || 0)
        return diffB - diffA
      })

      return matched
    },
  },

  actions: {
    /**
     * Load configuration from LocalStorage
     */
    loadConfig() {
      try {
        const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG)
        if (savedConfig) {
          this.grafanaConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) }
        } else {
          this.grafanaConfig = { ...DEFAULT_CONFIG }
        }
      } catch (err) {
        console.error('Failed to load config from localStorage:', err)
        this.grafanaConfig = { ...DEFAULT_CONFIG }
      }
    },

    /**
     * Parse HAR file locally
     */
    async uploadHarFile(file) {
      this.loading = true
      this.error = null
      this.clearAllFilters()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async (event) => {
          try {
            const harData = JSON.parse(event.target.result)
            const session = parseHarFile(harData, file.name)

            this.currentSession = session
            this.entries = session.entries
            this.entryDetailsCache = session.detailsCache

            // Ensure config is loaded
            this.loadConfig()

            this.loading = false
            resolve(session)
          } catch (err) {
            this.loading = false
            this.error = 'Invalid HAR file: ' + err.message
            reject(err)
          }
        }

        reader.onerror = () => {
          this.loading = false
          this.error = 'Failed to read file'
          reject(new Error('Failed to read file'))
        }

        reader.readAsText(file)
      })
    },

    /**
     * Clear current session data
     */
    clearSession() {
      this.currentSession = null
      this.entries = []
      this.error = null
      this.showErrorsOnly = false
      this.showSentryTraceOnly = false
      this.selectedEntryId = null
      this.entryDetailsCache.clear()
      this.clearAllFilters()
    },

    /**
     * Toggle errors only filter
     */
    toggleErrorsFilter() {
      this.showErrorsOnly = !this.showErrorsOnly
    },

    /**
     * Toggle Sentry trace only filter
     */
    toggleSentryTraceFilter() {
      this.showSentryTraceOnly = !this.showSentryTraceOnly
    },

    /**
     * Toggle method filter
     */
    toggleMethodFilter(method) {
      const index = this.filters.methods.indexOf(method)
      if (index === -1) {
        this.filters.methods.push(method)
      } else {
        this.filters.methods.splice(index, 1)
      }
    },

    /**
     * Toggle status group filter
     */
    toggleStatusFilter(group) {
      const index = this.filters.statusGroups.indexOf(group)
      if (index === -1) {
        this.filters.statusGroups.push(group)
      } else {
        this.filters.statusGroups.splice(index, 1)
      }
    },

    /**
     * Clear all filters
     */
    clearAllFilters() {
      this.filters.methods = []
      this.filters.path = ''
      this.filters.statusGroups = []
      this.showErrorsOnly = false
      this.showSentryTraceOnly = false
    },

    /**
     * Update Grafana configuration and save to LocalStorage
     */
    updateGrafanaConfig(config) {
      this.grafanaConfig = { ...this.grafanaConfig, ...config }
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.grafanaConfig))
      } catch (err) {
        console.error('Failed to save config to localStorage:', err)
      }
    },

    /**
     * Generate Loki URL for a request
     */
    getLokiUrl(entry) {
      if (!entry || !this.grafanaConfig.grafana_loki_url) return null

      const startTime = entry.time_start
      const from = new Date(startTime - 2 * 60 * 1000).toISOString()
      const to = new Date(startTime + 2 * 60 * 1000).toISOString()

      // Escape ? as .? if loki_escape is enabled
      let requestId = entry.x_request_id || ''
      if (this.grafanaConfig.grafana_loki_escape && requestId) {
        requestId = requestId.replace(/\?/g, '.?')
      }

      return this.grafanaConfig.grafana_loki_url
        .replace('{request_id}', requestId)
        .replace('{client_name}', entry.authority || '')
        .replace('{from}', from)
        .replace('{to}', to)
    },

    /**
     * Generate Coroot URL
     */
    getCorootUrl() {
      return this.grafanaConfig.coroot_url || null
    },

    /**
     * Generate Grafana Path URL for a request
     */
    getPathUrl(entry) {
      if (!entry || !this.grafanaConfig.grafana_path_url) return null

      const startTime = entry.time_start
      const from = new Date(startTime - 2 * 60 * 1000).toISOString()
      const to = new Date(startTime + 2 * 60 * 1000).toISOString()

      // Remove leading slash from path
      let cleanPath = (entry.path || '').replace(/^\//, '')

      // Escape ? as .? if path_loki_escape is enabled
      if (this.grafanaConfig.grafana_path_loki_escape && cleanPath) {
        cleanPath = cleanPath.replace(/\?/g, '.?')
      }

      // Use authority or domain as client_name
      const clientName = entry.authority || entry.domain || ''

      return this.grafanaConfig.grafana_path_url
        .replace('{path}', encodeURIComponent(cleanPath))
        .replace('{client_name}', encodeURIComponent(clientName))
        .replace('{from}', from)
        .replace('{to}', to)
    },

    /**
     * Generate Sentry Trace URL for a request
     * Returns null if no sentry-trace header or URL not configured
     */
    getSentryTraceUrl(entry) {
      if (!entry || !entry.sentry_trace || !this.grafanaConfig.sentry_trace_url) return null

      // Parse sentry-trace: {trace_id}-{span_id}-{sampled}
      const parts = entry.sentry_trace.split('-')
      if (parts.length < 3) return null

      const traceId = parts[0]
      const startTime = entry.time_start
      const from = new Date(startTime - 2 * 60 * 1000).toISOString()
      const to = new Date(startTime + 2 * 60 * 1000).toISOString()

      return this.grafanaConfig.sentry_trace_url
        .replace('{trace_id}', traceId)
        .replace('{from}', from)
        .replace('{to}', to)
    },

    /**
     * Select a request entry
     */
    selectEntry(entryId) {
      this.selectedEntryId = entryId
    },

    /**
     * Clear entry selection
     */
    clearSelection() {
      this.selectedEntryId = null
    },

    /**
     * Upload HAR file for comparison
     * @param {File} file - HAR file to upload
     * @param {number} slot - 1 or 2 (which comparison slot)
     */
    async uploadComparisonFile(file, slot) {
      if (slot !== 1 && slot !== 2) {
        throw new Error('Invalid slot: must be 1 or 2')
      }

      this.loading = true
      this.error = null

      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = async (event) => {
          try {
            const harData = JSON.parse(event.target.result)
            const session = parseHarFile(harData, file.name)

            if (slot === 1) {
              this.comparisonSessions.session1 = session
            } else {
              this.comparisonSessions.session2 = session
            }

            this.loading = false
            resolve(session)
          } catch (err) {
            this.loading = false
            this.error = 'Invalid HAR file: ' + err.message
            reject(err)
          }
        }

        reader.onerror = () => {
          this.loading = false
          this.error = 'Failed to read file'
          reject(new Error('Failed to read file'))
        }

        reader.readAsText(file)
      })
    },

    /**
     * Clear comparison data
     */
    clearComparison() {
      this.comparisonSessions.session1 = null
      this.comparisonSessions.session2 = null
      this.comparisonMode = false
      this.error = null
    },

    /**
     * Clear single comparison slot
     * @param {number} slot - 1 or 2
     */
    clearComparisonSlot(slot) {
      if (slot === 1) {
        this.comparisonSessions.session1 = null
      } else if (slot === 2) {
        this.comparisonSessions.session2 = null
      }
    },

    /**
     * Enable comparison mode
     */
    enableComparisonMode() {
      this.comparisonMode = true
    },
  },
})
