<template>
  <div class="flex flex-col items-center gap-1.5" :class="compact ? 'text-xs' : ''">
    <!-- Total Duration Diff -->
    <div v-if="diff && diff.duration" class="flex items-center gap-1.5">
      <span class="text-cyber-text-dim text-xs font-mono">{{ t('compare.totalDiff') }}:</span>
      <template v-if="Math.abs(diff.duration.percent) < 0.1">
        <span class="text-cyber-text-dim">=</span>
      </template>
      <template v-else>
        <i
          class="pi text-xs"
          :class="diff.duration.improved ? 'pi-arrow-down text-status-success' : 'pi-arrow-up text-status-error'"
        ></i>
        <span
          class="font-bold font-mono"
          :class="diff.duration.improved ? 'text-status-success' : 'text-status-error'"
        >
          {{ formatPercent(diff.duration.percent) }}
        </span>
      </template>
    </div>

    <!-- Server Duration Diff -->
    <div v-if="diff && diff.serverTiming" class="flex items-center gap-1.5">
      <span class="text-cyber-text-dim text-xs font-mono">{{ t('compare.serverDiff') }}:</span>
      <template v-if="Math.abs(diff.serverTiming.percent) < 0.1">
        <span class="text-cyber-text-dim">=</span>
      </template>
      <template v-else>
        <i
          class="pi text-xs"
          :class="diff.serverTiming.improved ? 'pi-arrow-down text-status-success' : 'pi-arrow-up text-status-error'"
        ></i>
        <span
          class="font-bold font-mono"
          :class="diff.serverTiming.improved ? 'text-status-success' : 'text-status-error'"
        >
          {{ formatPercent(diff.serverTiming.percent) }}
        </span>
      </template>
    </div>

    <!-- Server Timing Not Available -->
    <div v-else-if="diff && !diff.serverTiming" class="flex items-center gap-1.5">
      <span class="text-cyber-text-dim text-xs font-mono">{{ t('compare.serverDiff') }}:</span>
      <span class="text-cyber-text-dim text-xs">{{ t('compare.notAvailable') }}</span>
    </div>

    <!-- Status Change Badge -->
    <div v-if="diff && diff.status && diff.status.changed" class="flex items-center gap-1 mt-0.5">
      <span
        class="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
        :class="getStatusBadgeClass()"
      >
        {{ t('compare.statusChanged') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  diff: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const formatPercent = (percent) => {
  const abs = Math.abs(percent)
  if (abs < 1) return `${abs.toFixed(1)}%`
  return `${abs.toFixed(0)}%`
}

const getStatusBadgeClass = () => {
  if (props.diff.status.worsened) {
    return 'bg-status-error/20 text-status-error border border-status-error/50'
  }
  if (props.diff.status.improved) {
    return 'bg-status-success/20 text-status-success border border-status-success/50'
  }
  return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
}
</script>
