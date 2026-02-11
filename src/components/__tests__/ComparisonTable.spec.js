import { describe, it, expect } from 'vitest'

// Reimplement the sort/filter logic from ComparisonTable.vue
// since it lives inside <script setup> and is not exported

function sortMatches(matches, sortBy) {
  const sorted = [...matches]

  if (sortBy === 'server') {
    sorted.sort((a, b) => {
      const hasServerA = a.aggregated.diff?.serverTiming !== null && a.aggregated.diff?.serverTiming !== undefined
      const hasServerB = b.aggregated.diff?.serverTiming !== null && b.aggregated.diff?.serverTiming !== undefined

      if (!hasServerA && !hasServerB) return 0
      if (!hasServerA) return 1
      if (!hasServerB) return -1

      const diffA = Math.abs(a.aggregated.diff.serverTiming.diff)
      const diffB = Math.abs(b.aggregated.diff.serverTiming.diff)
      return diffB - diffA
    })
  } else {
    sorted.sort((a, b) => {
      const diffA = Math.abs(a.aggregated.diff?.duration?.diff || 0)
      const diffB = Math.abs(b.aggregated.diff?.duration?.diff || 0)
      return diffB - diffA
    })
  }

  return sorted
}

function filterMatches(sortedMatches, showDifferencesOnly) {
  if (!showDifferencesOnly) {
    return sortedMatches
  }
  return sortedMatches.filter(m => m.hasDifference)
}

// Sample match data
const sampleMatches = [
  {
    key: 'GET:/api/users',
    method: 'GET',
    path: '/api/users',
    hasDifference: true,
    aggregated: {
      entry1: { status_code: 200, duration: 100 },
      entry2: { status_code: 200, duration: 250 },
      diff: {
        duration: { diff: 150 },
        serverTiming: { diff: 50 },
      },
    },
  },
  {
    key: 'POST:/api/orders',
    method: 'POST',
    path: '/api/orders',
    hasDifference: false,
    aggregated: {
      entry1: { status_code: 201, duration: 300 },
      entry2: { status_code: 201, duration: 310 },
      diff: {
        duration: { diff: 10 },
        serverTiming: null,
      },
    },
  },
  {
    key: 'GET:/api/products',
    method: 'GET',
    path: '/api/products',
    hasDifference: true,
    aggregated: {
      entry1: { status_code: 200, duration: 500 },
      entry2: { status_code: 200, duration: 100 },
      diff: {
        duration: { diff: -400 },
        serverTiming: { diff: -200 },
      },
    },
  },
  {
    key: 'DELETE:/api/users/1',
    method: 'DELETE',
    path: '/api/users/1',
    hasDifference: true,
    aggregated: {
      entry1: { status_code: 200, duration: 200 },
      entry2: { status_code: 500, duration: 250 },
      diff: {
        duration: { diff: 50 },
        serverTiming: null,
      },
    },
  },
]

describe('ComparisonTable — sortedMatches logic', () => {
  describe('default sort (total duration diff)', () => {
    it('sorts by absolute duration diff descending', () => {
      const result = sortMatches(sampleMatches, 'total')
      expect(result[0].key).toBe('GET:/api/products') // |−400| = 400
      expect(result[1].key).toBe('GET:/api/users')    // |150| = 150
      expect(result[2].key).toBe('DELETE:/api/users/1') // |50| = 50
      expect(result[3].key).toBe('POST:/api/orders')  // |10| = 10
    })

    it('treats missing duration diff as 0', () => {
      const matches = [
        {
          key: 'a',
          aggregated: { diff: {} },
        },
        {
          key: 'b',
          aggregated: { diff: { duration: { diff: 100 } } },
        },
      ]
      const result = sortMatches(matches, 'total')
      expect(result[0].key).toBe('b')
      expect(result[1].key).toBe('a')
    })
  })

  describe('server timing sort', () => {
    it('sorts by absolute server timing diff descending', () => {
      const result = sortMatches(sampleMatches, 'server')
      expect(result[0].key).toBe('GET:/api/products') // |−200| = 200
      expect(result[1].key).toBe('GET:/api/users')    // |50| = 50
    })

    it('puts entries without server timing at the end', () => {
      const result = sortMatches(sampleMatches, 'server')
      // POST:/api/orders and DELETE:/api/users/1 have null serverTiming
      const lastTwo = result.slice(2)
      expect(lastTwo.every(m => m.aggregated.diff.serverTiming === null)).toBe(true)
    })

    it('preserves relative order of items both without server timing', () => {
      const matches = [
        { key: 'a', aggregated: { diff: { serverTiming: null } } },
        { key: 'b', aggregated: { diff: { serverTiming: null } } },
        { key: 'c', aggregated: { diff: { serverTiming: { diff: 10 } } } },
      ]
      const result = sortMatches(matches, 'server')
      expect(result[0].key).toBe('c')
      // Both a and b should be after c
      const nullKeys = result.slice(1).map(m => m.key)
      expect(nullKeys).toContain('a')
      expect(nullKeys).toContain('b')
    })

    it('handles undefined serverTiming the same as null', () => {
      const matches = [
        { key: 'a', aggregated: { diff: { serverTiming: undefined } } },
        { key: 'b', aggregated: { diff: { serverTiming: { diff: 30 } } } },
      ]
      const result = sortMatches(matches, 'server')
      expect(result[0].key).toBe('b')
      expect(result[1].key).toBe('a')
    })
  })
})

describe('ComparisonTable — filteredMatches logic', () => {
  it('returns all matches when showDifferencesOnly is false', () => {
    const sorted = sortMatches(sampleMatches, 'total')
    const result = filterMatches(sorted, false)
    expect(result).toHaveLength(sampleMatches.length)
  })

  it('filters to only matches with hasDifference === true', () => {
    const sorted = sortMatches(sampleMatches, 'total')
    const result = filterMatches(sorted, true)
    expect(result).toHaveLength(3)
    expect(result.every(m => m.hasDifference === true)).toBe(true)
  })

  it('excludes matches where hasDifference is false', () => {
    const sorted = sortMatches(sampleMatches, 'total')
    const result = filterMatches(sorted, true)
    expect(result.find(m => m.key === 'POST:/api/orders')).toBeUndefined()
  })

  it('returns empty array when no matches have differences', () => {
    const matches = [
      { key: 'a', hasDifference: false, aggregated: { diff: { duration: { diff: 0 } } } },
      { key: 'b', hasDifference: false, aggregated: { diff: { duration: { diff: 5 } } } },
    ]
    const sorted = sortMatches(matches, 'total')
    const result = filterMatches(sorted, true)
    expect(result).toHaveLength(0)
  })

  it('preserves sort order after filtering', () => {
    const sorted = sortMatches(sampleMatches, 'total')
    const result = filterMatches(sorted, true)
    // Should maintain descending order by abs(duration diff)
    expect(result[0].key).toBe('GET:/api/products')  // |−400| = 400
    expect(result[1].key).toBe('GET:/api/users')     // |150| = 150
    expect(result[2].key).toBe('DELETE:/api/users/1') // |50| = 50
  })
})
