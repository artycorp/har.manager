import { describe, it, expect } from 'vitest'
import { formatDuration, formatSize } from '../formatters'

describe('formatDuration', () => {
  it('formats milliseconds < 1000 with ms suffix', () => {
    expect(formatDuration(150)).toBe('150ms')
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('rounds millisecond values', () => {
    expect(formatDuration(150.7)).toBe('151ms')
    expect(formatDuration(0.4)).toBe('0ms')
  })

  it('formats >= 1000 as seconds with 2 decimal places', () => {
    expect(formatDuration(1000)).toBe('1.00s')
    expect(formatDuration(1500)).toBe('1.50s')
    expect(formatDuration(12345)).toBe('12.35s')
  })

  it('returns dash for null/undefined', () => {
    expect(formatDuration(null)).toBe('-')
    expect(formatDuration(undefined)).toBe('-')
  })
})

describe('formatSize', () => {
  it('formats bytes < 1024 with B suffix', () => {
    expect(formatSize(0)).toBe('0B')
    expect(formatSize(512)).toBe('512B')
    expect(formatSize(1023)).toBe('1023B')
  })

  it('formats kilobytes with 2 decimal places', () => {
    expect(formatSize(1024)).toBe('1.00KB')
    expect(formatSize(1536)).toBe('1.50KB')
  })

  it('formats megabytes with 2 decimal places', () => {
    expect(formatSize(1024 * 1024)).toBe('1.00MB')
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2.50MB')
  })

  it('returns dash for null/undefined', () => {
    expect(formatSize(null)).toBe('-')
    expect(formatSize(undefined)).toBe('-')
  })
})
