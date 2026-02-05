<template>
  <div class="waterfall-container">
    <div class="waterfall-bar-wrapper" :style="waterfallStyle">
      <div class="waterfall-bar">
        <!-- DNS -->
        <div
          v-if="entry.dns > 0"
          class="waterfall-segment dns"
          :style="{ width: getSegmentWidth(entry.dns) }"
          :title="`${t('waterfall.dns')}: ${entry.dns.toFixed(2)}ms`"
        >
          <div class="segment-glow"></div>
        </div>

        <!-- Connect -->
        <div
          v-if="entry.connect > 0"
          class="waterfall-segment connect"
          :style="{ width: getSegmentWidth(entry.connect) }"
          :title="`${t('waterfall.connect')}: ${entry.connect.toFixed(2)}ms`"
        >
          <div class="segment-glow"></div>
        </div>

        <!-- Send -->
        <div
          v-if="entry.send > 0"
          class="waterfall-segment send"
          :style="{ width: getSegmentWidth(entry.send) }"
          :title="`${t('waterfall.send')}: ${entry.send.toFixed(2)}ms`"
        >
          <div class="segment-glow"></div>
        </div>

        <!-- Wait (TTFB) -->
        <div
          v-if="entry.wait > 0"
          class="waterfall-segment wait"
          :style="{ width: getSegmentWidth(entry.wait) }"
          :title="`${t('waterfall.wait')}: ${entry.wait.toFixed(2)}ms`"
        >
          <div class="segment-glow"></div>
        </div>

        <!-- Receive -->
        <div
          v-if="entry.receive > 0"
          class="waterfall-segment receive"
          :style="{ width: getSegmentWidth(entry.receive) }"
          :title="`${t('waterfall.receive')}: ${entry.receive.toFixed(2)}ms`"
        >
          <div class="segment-glow"></div>
        </div>
      </div>
    </div>

    <span class="waterfall-label">{{ formatDuration(entry.duration) }}</span>
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
  sessionDuration: {
    type: Number,
    required: true
  }
})

const waterfallStyle = computed(() => {
  if (props.sessionDuration === 0) {
    return {
      marginLeft: '0%',
      width: '100%'
    }
  }

  // Calculate position (when request started) and width (how long it took)
  const marginLeftPercent = (props.entry.time_relative / props.sessionDuration) * 100
  const widthPercent = (props.entry.duration / props.sessionDuration) * 100

  return {
    marginLeft: `${marginLeftPercent}%`,
    width: `${Math.max(0.5, widthPercent)}%`,
    minWidth: '1px' // Ensure small requests are visible
  }
})


const getSegmentWidth = (segmentDuration) => {
  if (props.entry.duration === 0) return '0%'
  const percent = (segmentDuration / props.entry.duration) * 100
  return `${percent}%`
}

const formatDuration = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
</script>

<style scoped>
.waterfall-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 28px;
  position: relative;
}

.waterfall-bar-wrapper {
  position: relative;
  display: flex;
  min-width: 20px;
  background-color: var(--cyber-bg-card) !important;
}

.waterfall-bar {
  display: flex;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background: rgba(42, 53, 72, 0.3);
  border: 1px solid rgba(42, 53, 72, 0.5);
}

.waterfall-segment {
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
  cursor: help;
}

.waterfall-segment:hover {
  filter: brightness(1.3);
}

.waterfall-segment:hover .segment-glow {
  opacity: 1;
}

.segment-glow {
  position: absolute;
  inset: -2px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  border-radius: inherit;
}

/* DNS - Cyan */
.waterfall-segment.dns {
  background: linear-gradient(180deg, #00bfff 0%, #0099cc 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.waterfall-segment.dns .segment-glow {
  box-shadow: 0 0 15px rgba(0, 191, 255, 0.8), inset 0 0 10px rgba(0, 191, 255, 0.4);
}

/* Connect - Purple */
.waterfall-segment.connect {
  background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.waterfall-segment.connect .segment-glow {
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.8), inset 0 0 10px rgba(139, 92, 246, 0.4);
}

/* Send - Lime */
.waterfall-segment.send {
  background: linear-gradient(180deg, #00ff88 0%, #00cc6a 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.waterfall-segment.send .segment-glow {
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.8), inset 0 0 10px rgba(0, 255, 136, 0.4);
}

/* Wait - Orange */
.waterfall-segment.wait {
  background: linear-gradient(180deg, #ffa500 0%, #ff8800 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.waterfall-segment.wait .segment-glow {
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.8), inset 0 0 10px rgba(255, 165, 0, 0.4);
}

/* Receive - Magenta */
.waterfall-segment.receive {
  background: linear-gradient(180deg, #ff0080 0%, #cc0066 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.waterfall-segment.receive .segment-glow {
  box-shadow: 0 0 15px rgba(255, 0, 128, 0.8), inset 0 0 10px rgba(255, 0, 128, 0.4);
}

.waterfall-label {
  margin-left: 10px;
  font-size: 0.75rem;
  color: var(--cyber-text-dim);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
