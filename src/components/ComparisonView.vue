<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 animate-slide-in-left">
      <h2 class="text-2xl font-semibold text-cyber-text tracking-tight">
        {{ t('compare.title') }}
      </h2>
      <p class="text-sm text-cyber-text-dim">
        {{ t('compare.subtitle') }}
      </p>
    </div>

    <!-- File Upload Section -->
    <div class="animate-slide-in-up">
      <ComparisonFileUpload
        :session1="harStore.comparisonSessions.session1"
        :session2="harStore.comparisonSessions.session2"
        @upload="handleFileUpload"
        @clear-slot="handleClearSlot"
      />
    </div>

    <!-- Loading State -->
    <div v-if="harStore.loading" class="text-center py-12 animate-pulse">
      <i class="pi pi-spin pi-spinner text-6xl text-cyber-cyan mb-4"></i>
      <p class="text-cyber-text font-mono">{{ t('upload.parsing') }}</p>
    </div>

    <!-- Error State -->
    <div v-if="harStore.error" class="border border-status-error rounded-lg p-4 bg-status-error/10 animate-shake">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-status-error text-2xl"></i>
        <div>
          <p class="font-mono font-bold text-status-error uppercase">{{ t('upload.error') }}</p>
          <p class="text-cyber-text text-sm">{{ harStore.error }}</p>
        </div>
      </div>
    </div>

    <!-- Comparison Stats -->
    <div
      v-if="bothFilesLoaded && !harStore.loading"
      class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in-up"
    >
      <!-- HAR 1 Stats -->
      <div class="border border-cyber-cyan/30 rounded-lg p-4 bg-cyber-bg-card/30 backdrop-blur-sm">
        <h3 class="text-sm font-mono uppercase tracking-wider text-cyber-cyan mb-3">
          {{ t('compare.har1Stats') }}
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-cyber-text-dim text-xs">{{ t('stats.totalRequests') }}</span>
            <span class="text-cyber-text font-bold">{{ harStore.comparisonSessions.session1.entries.length }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-cyber-text-dim text-xs">{{ t('compare.avgDuration') }}</span>
            <span class="text-cyber-text font-bold">{{ formatAvgDuration(harStore.comparisonSessions.session1.entries) }}</span>
          </div>
        </div>
      </div>

      <!-- HAR 2 Stats -->
      <div class="border border-cyber-magenta/30 rounded-lg p-4 bg-cyber-bg-card/30 backdrop-blur-sm">
        <h3 class="text-sm font-mono uppercase tracking-wider text-cyber-magenta mb-3">
          {{ t('compare.har2Stats') }}
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-cyber-text-dim text-xs">{{ t('stats.totalRequests') }}</span>
            <span class="text-cyber-text font-bold">{{ harStore.comparisonSessions.session2.entries.length }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-cyber-text-dim text-xs">{{ t('compare.avgDuration') }}</span>
            <span class="text-cyber-text font-bold">{{ formatAvgDuration(harStore.comparisonSessions.session2.entries) }}</span>
          </div>
        </div>
      </div>

      <!-- Match Stats -->
      <div class="border border-cyber-lime/30 rounded-lg p-4 bg-cyber-bg-card/30 backdrop-blur-sm">
        <h3 class="text-sm font-mono uppercase tracking-wider text-cyber-lime mb-3">
          {{ t('compare.matchStats') }}
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-cyber-text-dim text-xs">{{ t('compare.matchedEndpoints') }}</span>
            <span class="text-cyber-text font-bold">{{ matchedRequests.length }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-cyber-text-dim text-xs">{{ t('compare.withDifferences') }}</span>
            <span class="text-cyber-text font-bold">{{ matchesWithDifferences }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Table -->
    <div v-if="bothFilesLoaded && !harStore.loading && matchedRequests.length > 0" class="animate-slide-in-up">
      <ComparisonTable :matches="matchedRequests" />
    </div>

    <!-- Empty State - Both files loaded but no matches -->
    <div
      v-if="bothFilesLoaded && !harStore.loading && matchedRequests.length === 0"
      class="text-center py-12 border border-cyber-border rounded-lg bg-cyber-bg-card/30"
    >
      <i class="pi pi-ban text-6xl text-cyber-text-dim mb-4"></i>
      <p class="text-cyber-text font-mono mb-2">{{ t('compare.noMatchesFound') }}</p>
      <p class="text-cyber-text-dim text-sm font-mono">
        {{ t('compare.noMatchesHint') }}
      </p>
    </div>

    <!-- Empty State - No files uploaded -->
    <div
      v-if="!bothFilesLoaded && !harStore.loading"
      class="text-center py-12 border border-cyber-border/50 border-dashed rounded-lg bg-cyber-bg-card/10"
    >
      <div class="flex justify-center gap-8 mb-6">
        <i class="pi pi-file text-6xl text-cyber-cyan"></i>
        <i class="pi pi-arrows-h text-6xl text-cyber-lime"></i>
        <i class="pi pi-file text-6xl text-cyber-magenta"></i>
      </div>
      <p class="text-cyber-text font-mono mb-2">{{ t('compare.emptyState') }}</p>
      <p class="text-cyber-text-dim text-sm font-mono">
        {{ t('compare.emptyStateHint') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'
import ComparisonFileUpload from './ComparisonFileUpload.vue'
import ComparisonTable from './ComparisonTable.vue'

const { t } = useI18n()
const harStore = useHarStore()

// Enable comparison mode on mount
harStore.enableComparisonMode()

const bothFilesLoaded = computed(() => {
  return harStore.comparisonSessions.session1 !== null &&
         harStore.comparisonSessions.session2 !== null
})

const matchedRequests = computed(() => {
  return harStore.matchedRequests
})

const matchesWithDifferences = computed(() => {
  return matchedRequests.value.filter(m => m.hasDifference).length
})

const handleFileUpload = async ({ file, slot }) => {
  try {
    await harStore.uploadComparisonFile(file, slot)
  } catch (err) {
    console.error('Failed to upload comparison file:', err)
  }
}

const handleClearSlot = (slot) => {
  harStore.clearComparisonSlot(slot)
}

const formatAvgDuration = (entries) => {
  if (!entries || entries.length === 0) return '0ms'
  const sum = entries.reduce((acc, e) => acc + e.duration, 0)
  const avg = sum / entries.length
  return `${avg.toFixed(2)}ms`
}
</script>
