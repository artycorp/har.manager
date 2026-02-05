<template>
  <div class="timing-tab">
    <div class="timing-summary">
      <div class="summary-card">
        <div class="summary-label">{{ t('drawer.timing.total') }}</div>
        <div class="summary-value">{{ formatDuration(totalDuration) }}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">{{ t('drawer.timing.started') }}</div>
        <div class="summary-value">{{ formatTime(normalizedEntry?.time_relative || 0) }}</div>
      </div>
    </div>

    <div class="waterfall-section">
      <div class="section-title">{{ t('drawer.timing.waterfall') }}</div>
      <div class="waterfall-container">
        <div class="waterfall-bar">
          <div
            v-if="timings.dns > 0"
            :style="{ width: getTimingWidth(timings.dns) }"
            class="timing-segment timing-dns"
            :title="`DNS: ${formatDuration(timings.dns)}`"
          />
          <div
            v-if="timings.connect > 0"
            :style="{ width: getTimingWidth(timings.connect) }"
            class="timing-segment timing-connect"
            :title="`Connect: ${formatDuration(timings.connect)}`"
          />
          <div
            v-if="timings.ssl > 0"
            :style="{ width: getTimingWidth(timings.ssl) }"
            class="timing-segment timing-ssl"
            :title="`SSL: ${formatDuration(timings.ssl)}`"
          />
          <div
            v-if="timings.send > 0"
            :style="{ width: getTimingWidth(timings.send) }"
            class="timing-segment timing-send"
            :title="`Send: ${formatDuration(timings.send)}`"
          />
          <div
            v-if="timings.wait > 0"
            :style="{ width: getTimingWidth(timings.wait) }"
            class="timing-segment timing-wait"
            :title="`Wait: ${formatDuration(timings.wait)}`"
          />
          <div
            v-if="timings.receive > 0"
            :style="{ width: getTimingWidth(timings.receive) }"
            class="timing-segment timing-receive"
            :title="`Receive: ${formatDuration(timings.receive)}`"
          />
        </div>
        <div class="waterfall-duration">{{ formatDuration(totalDuration) }}</div>
      </div>
    </div>

    <div class="timing-breakdown">
      <div class="section-title">{{ t('drawer.timing.breakdown') }}</div>
      <div class="timing-table">
        <div v-if="timings.dns > 0" class="timing-row">
          <div class="timing-color timing-color-dns"></div>
          <div class="timing-name">{{ t('drawer.timing.dns') }}</div>
          <div class="timing-value">{{ formatDuration(timings.dns) }}</div>
          <div class="timing-percent">{{ getPercentage(timings.dns) }}%</div>
        </div>
        <div v-if="timings.connect > 0" class="timing-row">
          <div class="timing-color timing-color-connect"></div>
          <div class="timing-name">{{ t('drawer.timing.connect') }}</div>
          <div class="timing-value">{{ formatDuration(timings.connect) }}</div>
          <div class="timing-percent">{{ getPercentage(timings.connect) }}%</div>
        </div>
        <div v-if="timings.ssl > 0" class="timing-row">
          <div class="timing-color timing-color-ssl"></div>
          <div class="timing-name">{{ t('drawer.timing.ssl') }}</div>
          <div class="timing-value">{{ formatDuration(timings.ssl) }}</div>
          <div class="timing-percent">{{ getPercentage(timings.ssl) }}%</div>
        </div>
        <div v-if="timings.send > 0" class="timing-row">
          <div class="timing-color timing-color-send"></div>
          <div class="timing-name">{{ t('drawer.timing.send') }}</div>
          <div class="timing-value">{{ formatDuration(timings.send) }}</div>
          <div class="timing-percent">{{ getPercentage(timings.send) }}%</div>
        </div>
        <div v-if="timings.wait > 0" class="timing-row">
          <div class="timing-color timing-color-wait"></div>
          <div class="timing-name">{{ t('drawer.timing.wait') }} (TTFB)</div>
          <div class="timing-value">{{ formatDuration(timings.wait) }}</div>
          <div class="timing-percent">{{ getPercentage(timings.wait) }}%</div>
        </div>
        <div v-if="timings.receive > 0" class="timing-row">
          <div class="timing-color timing-color-receive"></div>
          <div class="timing-name">{{ t('drawer.timing.receive') }}</div>
          <div class="timing-value">{{ formatDuration(timings.receive) }}</div>
          <div class="timing-percent">{{ getPercentage(timings.receive) }}%</div>
        </div>
      </div>
    </div>

    <div v-if="serverTiming" class="server-timing-section">
      <div class="section-title">{{ t('drawer.timing.serverTiming') }}</div>
      <pre class="server-timing-content">{{ serverTiming }}</pre>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  normalizedEntry: {
    type: Object,
    required: false
  }
})

const timings = computed(() => {
  const t = props.entry.timings || {}
  return {
    dns: Math.max(t.dns || 0, 0),
    connect: Math.max(t.connect || 0, 0),
    ssl: Math.max(t.ssl || 0, 0),
    send: Math.max(t.send || 0, 0),
    wait: Math.max(t.wait || 0, 0),
    receive: Math.max(t.receive || 0, 0)
  }
})

const totalDuration = computed(() => {
  return props.entry.time || 0
})

const serverTiming = computed(() => {
  return props.normalizedEntry?.server_timing || null
})

const getTimingWidth = (timing) => {
  if (totalDuration.value === 0) return '0%'
  const percentage = (timing / totalDuration.value) * 100
  return `${Math.max(percentage, 0.5)}%`
}

const getPercentage = (timing) => {
  if (totalDuration.value === 0) return '0'
  const percentage = (timing / totalDuration.value) * 100
  return percentage.toFixed(1)
}

const formatDuration = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatTime = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
</script>

<style scoped>
.timing-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timing-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1rem;
  background: var(--cyber-bg-medium);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--cyber-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cyber-cyan);
}

.waterfall-section,
.timing-breakdown,
.server-timing-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--cyber-cyan);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.waterfall-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
}

.waterfall-bar {
  flex: 1;
  height: 40px;
  display: flex;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid var(--cyber-border);
}

.timing-segment {
  height: 100%;
  transition: opacity 0.2s;
}

.timing-segment:hover {
  opacity: 0.8;
}

.timing-dns {
  background: var(--timing-dns);
}

.timing-connect {
  background: var(--timing-connect);
}

.timing-ssl {
  background: var(--timing-ssl);
}

.timing-send {
  background: var(--timing-send);
}

.timing-wait {
  background: var(--timing-wait);
}

.timing-receive {
  background: var(--timing-receive);
}

.waterfall-duration {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--cyber-text);
  white-space: nowrap;
}

.timing-table {
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
  overflow: hidden;
}

.timing-row {
  display: grid;
  grid-template-columns: 20px 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--cyber-border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  transition: background 0.2s;
}

.timing-row:last-child {
  border-bottom: none;
}

.timing-row:hover {
  background: var(--cyber-bg-medium);
}

.timing-color {
  width: 20px;
  height: 20px;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.timing-color-dns {
  background: var(--timing-dns);
}

.timing-color-connect {
  background: var(--timing-connect);
}

.timing-color-ssl {
  background: var(--timing-ssl);
}

.timing-color-send {
  background: var(--timing-send);
}

.timing-color-wait {
  background: var(--timing-wait);
}

.timing-color-receive {
  background: var(--timing-receive);
}

.timing-name {
  color: var(--cyber-text);
  font-weight: 600;
}

.timing-value {
  color: var(--cyber-cyan);
  font-weight: 700;
  tabular-nums: true;
}

.timing-percent {
  color: var(--cyber-text-dim);
  font-size: 0.75rem;
  tabular-nums: true;
}

.server-timing-content {
  margin: 0;
  padding: 1rem;
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  color: var(--cyber-text);
  overflow-x: auto;
}
</style>
