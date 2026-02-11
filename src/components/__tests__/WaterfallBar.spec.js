import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WaterfallBar from '../WaterfallBar.vue'

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key) => key }),
}))

// Mock formatters import
vi.mock('@/utils/formatters', () => ({
  formatDuration: (ms) => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`,
}))

const defaultEntry = {
  duration: 500,
  time_relative: 100,
  dns: 10,
  connect: 20,
  ssl: 0,
  send: 5,
  wait: 400,
  receive: 65,
}

function mountBar(entry = defaultEntry, sessionDuration = 1000) {
  return mount(WaterfallBar, {
    props: { entry, sessionDuration },
  })
}

describe('WaterfallBar — waterfallStyle computed', () => {
  it('calculates marginLeft and width based on session duration', () => {
    const wrapper = mountBar()
    const barWrapper = wrapper.find('.waterfall-bar-wrapper')
    const style = barWrapper.attributes('style')

    // marginLeft = 100/1000 * 100 = 10%
    expect(style).toContain('margin-left: 10%')
    // width = 500/1000 * 100 = 50%
    expect(style).toContain('width: 50%')
  })

  it('uses full width when sessionDuration is 0', () => {
    const wrapper = mountBar(defaultEntry, 0)
    const barWrapper = wrapper.find('.waterfall-bar-wrapper')
    const style = barWrapper.attributes('style')

    expect(style).toContain('margin-left: 0%')
    expect(style).toContain('width: 100%')
  })

  it('enforces minimum 0.5% width for tiny durations', () => {
    const entry = { ...defaultEntry, duration: 0.1, time_relative: 0 }
    const wrapper = mountBar(entry, 10000)
    const barWrapper = wrapper.find('.waterfall-bar-wrapper')
    const style = barWrapper.attributes('style')

    // width = 0.1/10000 * 100 = 0.001%, but clamped to 0.5%
    expect(style).toContain('width: 0.5%')
  })

  it('positions bar at the correct offset', () => {
    const entry = { ...defaultEntry, time_relative: 500, duration: 200 }
    const wrapper = mountBar(entry, 2000)
    const barWrapper = wrapper.find('.waterfall-bar-wrapper')
    const style = barWrapper.attributes('style')

    // marginLeft = 500/2000 * 100 = 25%
    expect(style).toContain('margin-left: 25%')
    // width = 200/2000 * 100 = 10%
    expect(style).toContain('width: 10%')
  })
})

describe('WaterfallBar — getSegmentWidth', () => {
  it('calculates segment proportion of total duration', () => {
    const wrapper = mountBar()
    // The wait segment: 400/500 * 100 = 80%
    const waitSegment = wrapper.find('.waterfall-segment.wait')
    expect(waitSegment.exists()).toBe(true)
    expect(waitSegment.attributes('style')).toContain('width: 80%')
  })

  it('returns 0% when entry duration is 0', () => {
    const entry = { ...defaultEntry, duration: 0, dns: 0, connect: 0, send: 0, wait: 0, receive: 0 }
    const wrapper = mountBar(entry, 1000)
    // No segments should be rendered since all values are 0
    const segments = wrapper.findAll('.waterfall-segment')
    expect(segments).toHaveLength(0)
  })

  it('renders only segments with positive values', () => {
    // ssl is 0, so it should not appear
    const wrapper = mountBar()
    const segments = wrapper.findAll('.waterfall-segment')
    // dns=10, connect=20, send=5, wait=400, receive=65 — 5 visible segments (no ssl)
    expect(segments).toHaveLength(5)
  })

  it('calculates dns segment width correctly', () => {
    const wrapper = mountBar()
    const dnsSegment = wrapper.find('.waterfall-segment.dns')
    // dns = 10/500 * 100 = 2%
    expect(dnsSegment.attributes('style')).toContain('width: 2%')
  })

  it('calculates connect segment width correctly', () => {
    const wrapper = mountBar()
    const connectSegment = wrapper.find('.waterfall-segment.connect')
    // connect = 20/500 * 100 = 4%
    expect(connectSegment.attributes('style')).toContain('width: 4%')
  })
})

describe('WaterfallBar — label', () => {
  it('displays formatted duration label', () => {
    const wrapper = mountBar()
    const label = wrapper.find('.waterfall-label')
    expect(label.text()).toBe('500ms')
  })

  it('formats durations >= 1000ms in seconds', () => {
    const entry = { ...defaultEntry, duration: 2500 }
    const wrapper = mountBar(entry, 5000)
    const label = wrapper.find('.waterfall-label')
    expect(label.text()).toBe('2.50s')
  })
})
