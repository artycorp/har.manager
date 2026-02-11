import { describe, it, expect } from 'vitest'

// Reimplement the filter and helper logic from RequestsTable.vue
// since it lives inside <script setup> and is not exported

function filterEntries(entries, { showErrorsOnly, showSentryTraceOnly, filters }) {
  let results = entries

  if (showErrorsOnly) {
    results = results.filter(e => e.status_code >= 400)
  }

  if (showSentryTraceOnly) {
    results = results.filter(e => e.sentry_trace && e.sentry_trace.length > 0)
  }

  if (filters.methods.length > 0) {
    results = results.filter(e => filters.methods.includes(e.method))
  }

  if (filters.path.trim()) {
    const pathSearch = filters.path.toLowerCase()
    results = results.filter(e => e.path.toLowerCase().includes(pathSearch))
  }

  if (filters.statusGroups.length > 0) {
    results = results.filter(e => {
      const status = e.status_code
      return filters.statusGroups.some(group => {
        if (group === '1xx') return status >= 100 && status < 200
        if (group === '2xx') return status >= 200 && status < 300
        if (group === '3xx') return status >= 300 && status < 400
        if (group === '4xx') return status >= 400 && status < 500
        if (group === '5xx') return status >= 500 && status < 600
        return false
      })
    })
  }

  return results
}

function getStatusClass(statusCode) {
  if (statusCode >= 500) return 'bg-status-critical/15 text-status-critical font-bold border border-status-critical/30'
  if (statusCode >= 400) return 'bg-status-error/15 text-status-error font-bold border border-status-error/30'
  if (statusCode >= 300) return 'bg-status-info/15 text-status-info font-bold border border-status-info/30'
  if (statusCode >= 200) return 'bg-status-success/15 text-status-success font-bold border border-status-success/30'
  return 'bg-cyber-bg-medium text-cyber-text-dim border border-cyber-border'
}

function getMethodClass(method) {
  const classes = {
    GET: 'text-timing-dns',
    POST: 'text-status-success',
    PUT: 'text-cyber-yellow',
    DELETE: 'text-status-error',
    PATCH: 'text-cyber-magenta',
    OPTIONS: 'text-cyber-text-dim',
    HEAD: 'text-cyber-text-dim',
    CONNECT: 'text-cyber-text-dim',
    TRACE: 'text-cyber-text-dim'
  }
  return classes[method] || 'text-cyber-text-dim'
}

function getDurationClass(duration) {
  if (duration > 1000) return 'text-status-error'
  if (duration > 200) return 'text-status-warning'
  return 'text-cyber-text'
}

// Sample entries for testing
const sampleEntries = [
  { id: 1, method: 'GET', path: '/api/users', status_code: 200, duration: 150, sentry_trace: '' },
  { id: 2, method: 'POST', path: '/api/orders', status_code: 201, duration: 300, sentry_trace: 'abc-def-1' },
  { id: 3, method: 'GET', path: '/api/products', status_code: 404, duration: 50, sentry_trace: '' },
  { id: 4, method: 'DELETE', path: '/api/users/1', status_code: 500, duration: 1200, sentry_trace: 'xyz-123-0' },
  { id: 5, method: 'PUT', path: '/api/settings', status_code: 302, duration: 80, sentry_trace: '' },
  { id: 6, method: 'GET', path: '/health', status_code: 100, duration: 10, sentry_trace: '' },
]

const defaultFilters = () => ({
  showErrorsOnly: false,
  showSentryTraceOnly: false,
  filters: { methods: [], path: '', statusGroups: [] },
})

describe('RequestsTable — filteredEntries logic', () => {
  it('returns all entries when no filters are active', () => {
    const result = filterEntries(sampleEntries, defaultFilters())
    expect(result).toHaveLength(sampleEntries.length)
  })

  describe('showErrorsOnly', () => {
    it('filters to status_code >= 400 only', () => {
      const opts = { ...defaultFilters(), showErrorsOnly: true }
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(2)
      expect(result.every(e => e.status_code >= 400)).toBe(true)
    })

    it('includes both 4xx and 5xx', () => {
      const opts = { ...defaultFilters(), showErrorsOnly: true }
      const result = filterEntries(sampleEntries, opts)
      const statuses = result.map(e => e.status_code)
      expect(statuses).toContain(404)
      expect(statuses).toContain(500)
    })
  })

  describe('showSentryTraceOnly', () => {
    it('filters to entries with non-empty sentry_trace', () => {
      const opts = { ...defaultFilters(), showSentryTraceOnly: true }
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(2)
      expect(result.every(e => e.sentry_trace && e.sentry_trace.length > 0)).toBe(true)
    })

    it('excludes entries with empty string sentry_trace', () => {
      const opts = { ...defaultFilters(), showSentryTraceOnly: true }
      const result = filterEntries(sampleEntries, opts)
      expect(result.find(e => e.id === 1)).toBeUndefined()
    })
  })

  describe('method filter', () => {
    it('filters by a single method', () => {
      const opts = defaultFilters()
      opts.filters.methods = ['GET']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(3)
      expect(result.every(e => e.method === 'GET')).toBe(true)
    })

    it('filters by multiple methods', () => {
      const opts = defaultFilters()
      opts.filters.methods = ['GET', 'POST']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(4)
      expect(result.every(e => ['GET', 'POST'].includes(e.method))).toBe(true)
    })

    it('returns empty when method has no matches', () => {
      const opts = defaultFilters()
      opts.filters.methods = ['PATCH']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(0)
    })
  })

  describe('status group filter', () => {
    it('filters 1xx range (100-199)', () => {
      const opts = defaultFilters()
      opts.filters.statusGroups = ['1xx']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].status_code).toBe(100)
    })

    it('filters 2xx range (200-299)', () => {
      const opts = defaultFilters()
      opts.filters.statusGroups = ['2xx']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(2)
      expect(result.every(e => e.status_code >= 200 && e.status_code < 300)).toBe(true)
    })

    it('filters 3xx range (300-399)', () => {
      const opts = defaultFilters()
      opts.filters.statusGroups = ['3xx']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].status_code).toBe(302)
    })

    it('filters 4xx range (400-499)', () => {
      const opts = defaultFilters()
      opts.filters.statusGroups = ['4xx']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].status_code).toBe(404)
    })

    it('filters 5xx range (500-599)', () => {
      const opts = defaultFilters()
      opts.filters.statusGroups = ['5xx']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].status_code).toBe(500)
    })

    it('filters multiple status groups (OR within groups)', () => {
      const opts = defaultFilters()
      opts.filters.statusGroups = ['4xx', '5xx']
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(2)
      expect(result.every(e => e.status_code >= 400)).toBe(true)
    })
  })

  describe('path filter', () => {
    it('filters by case-insensitive substring', () => {
      const opts = defaultFilters()
      opts.filters.path = 'users'
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(2)
    })

    it('is case-insensitive', () => {
      const opts = defaultFilters()
      opts.filters.path = 'USERS'
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(2)
    })

    it('ignores whitespace-only path filter', () => {
      const opts = defaultFilters()
      opts.filters.path = '   '
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(sampleEntries.length)
    })

    it('matches partial paths', () => {
      const opts = defaultFilters()
      opts.filters.path = '/api'
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(5) // all except /health
    })
  })

  describe('combined AND logic', () => {
    it('combines showErrorsOnly + method filter', () => {
      const opts = {
        showErrorsOnly: true,
        showSentryTraceOnly: false,
        filters: { methods: ['GET'], path: '', statusGroups: [] },
      }
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3) // GET /api/products 404
    })

    it('combines path + status group filters', () => {
      const opts = {
        showErrorsOnly: false,
        showSentryTraceOnly: false,
        filters: { methods: [], path: 'users', statusGroups: ['2xx'] },
      }
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1) // GET /api/users 200
    })

    it('combines all filters resulting in empty set', () => {
      const opts = {
        showErrorsOnly: true,
        showSentryTraceOnly: true,
        filters: { methods: ['GET'], path: 'users', statusGroups: ['5xx'] },
      }
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(0)
    })

    it('combines sentry trace + method filter', () => {
      const opts = {
        showErrorsOnly: false,
        showSentryTraceOnly: true,
        filters: { methods: ['POST'], path: '', statusGroups: [] },
      }
      const result = filterEntries(sampleEntries, opts)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })
  })
})

describe('RequestsTable — getStatusClass', () => {
  it('returns critical class for 5xx status codes', () => {
    expect(getStatusClass(500)).toContain('text-status-critical')
    expect(getStatusClass(503)).toContain('text-status-critical')
  })

  it('returns error class for 4xx status codes', () => {
    expect(getStatusClass(400)).toContain('text-status-error')
    expect(getStatusClass(404)).toContain('text-status-error')
    expect(getStatusClass(499)).toContain('text-status-error')
  })

  it('returns info class for 3xx status codes', () => {
    expect(getStatusClass(300)).toContain('text-status-info')
    expect(getStatusClass(301)).toContain('text-status-info')
  })

  it('returns success class for 2xx status codes', () => {
    expect(getStatusClass(200)).toContain('text-status-success')
    expect(getStatusClass(204)).toContain('text-status-success')
  })

  it('returns dim class for status codes below 200', () => {
    expect(getStatusClass(100)).toContain('text-cyber-text-dim')
    expect(getStatusClass(0)).toContain('text-cyber-text-dim')
  })
})

describe('RequestsTable — getMethodClass', () => {
  it('returns correct class for known methods', () => {
    expect(getMethodClass('GET')).toBe('text-timing-dns')
    expect(getMethodClass('POST')).toBe('text-status-success')
    expect(getMethodClass('PUT')).toBe('text-cyber-yellow')
    expect(getMethodClass('DELETE')).toBe('text-status-error')
    expect(getMethodClass('PATCH')).toBe('text-cyber-magenta')
  })

  it('returns dim class for secondary methods', () => {
    expect(getMethodClass('OPTIONS')).toBe('text-cyber-text-dim')
    expect(getMethodClass('HEAD')).toBe('text-cyber-text-dim')
    expect(getMethodClass('CONNECT')).toBe('text-cyber-text-dim')
    expect(getMethodClass('TRACE')).toBe('text-cyber-text-dim')
  })

  it('returns dim class for unknown methods', () => {
    expect(getMethodClass('UNKNOWN')).toBe('text-cyber-text-dim')
  })
})

describe('RequestsTable — getDurationClass', () => {
  it('returns error class for duration > 1000ms', () => {
    expect(getDurationClass(1001)).toBe('text-status-error')
    expect(getDurationClass(5000)).toBe('text-status-error')
  })

  it('returns warning class for duration > 200ms and <= 1000ms', () => {
    expect(getDurationClass(201)).toBe('text-status-warning')
    expect(getDurationClass(1000)).toBe('text-status-warning')
  })

  it('returns default class for duration <= 200ms', () => {
    expect(getDurationClass(200)).toBe('text-cyber-text')
    expect(getDurationClass(50)).toBe('text-cyber-text')
    expect(getDurationClass(0)).toBe('text-cyber-text')
  })
})
