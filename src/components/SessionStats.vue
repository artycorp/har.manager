<template>
  <div class="animate-slide-in-up">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Requests -->
      <div class="group bg-cyber-bg-card border border-cyber-border rounded-xl p-5 transition-all duration-200 hover:border-cyber-cyan/40">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <p class="text-xs text-cyber-text-dim font-medium uppercase tracking-wider mb-2">{{ t('stats.totalRequests') }}</p>
            <p class="text-3xl font-semibold text-cyber-text font-mono tabular-nums">
              {{ harStore.totalRequests }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-cyber-cyan/10">
            <i class="pi pi-list text-lg text-cyber-cyan"></i>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-cyber-text-dim">
          <span>{{ t('stats.httpArchive') }}</span>
        </div>
      </div>

      <!-- Errors -->
      <div class="group bg-cyber-bg-card border border-cyber-border rounded-xl p-5 transition-all duration-200 cursor-pointer"
           :class="[
             harStore.errorCount > 0 ? 'hover:border-status-error/40' : 'hover:border-status-success/40',
             harStore.showErrorsOnly && harStore.errorCount > 0 ? 'border-status-error/40 bg-status-error/5' : ''
           ]"
           @click="harStore.toggleErrorsFilter()">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <p class="text-xs text-cyber-text-dim font-medium uppercase tracking-wider mb-2">{{ t('stats.errors') }}</p>
            <p class="text-3xl font-semibold font-mono tabular-nums"
               :class="harStore.errorCount > 0 ? 'text-status-error' : 'text-status-success'">
              {{ harStore.errorCount }}
            </p>
          </div>
          <div class="p-2 rounded-lg" :class="harStore.errorCount > 0 ? 'bg-status-error/10' : 'bg-status-success/10'">
            <i class="pi text-lg"
               :class="harStore.errorCount > 0 ? 'pi-exclamation-circle text-status-error' : 'pi-check-circle text-status-success'"></i>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-cyber-text-dim">
          <span>{{ harStore.errorCount > 0 ? t('stats.failedRequests') : t('stats.allOk') }}</span>
        </div>
      </div>

      <!-- Duration -->
      <div class="group bg-cyber-bg-card border border-cyber-border rounded-xl p-5 transition-all duration-200 hover:border-cyber-magenta/40">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <p class="text-xs text-cyber-text-dim font-medium uppercase tracking-wider mb-2">{{ t('stats.duration') }}</p>
            <p class="text-3xl font-semibold text-cyber-text font-mono tabular-nums">
              {{ formatDuration(harStore.sessionDuration) }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-cyber-magenta/10">
            <i class="pi pi-clock text-lg text-cyber-magenta"></i>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-cyber-text-dim">
          <span>{{ t('stats.sessionTime') }}</span>
        </div>
      </div>

      <!-- Total Size -->
      <div class="group bg-cyber-bg-card border border-cyber-border rounded-xl p-5 transition-all duration-200 hover:border-cyber-lime/40">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <p class="text-xs text-cyber-text-dim font-medium uppercase tracking-wider mb-2">{{ t('stats.size') }}</p>
            <p class="text-3xl font-semibold text-cyber-text font-mono tabular-nums">
              {{ formatSize(harStore.totalSize) }}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-cyber-lime/10">
            <i class="pi pi-database text-lg text-cyber-lime"></i>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-cyber-text-dim">
          <span>{{ t('stats.dataTransfer') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'

const { t } = useI18n()
const harStore = useHarStore()

const formatDuration = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
}
</script>
