<template>
  <div class="bg-cyber-bg-card rounded-xl border border-cyber-border overflow-hidden animate-slide-in-up" style="animation-delay: 0.1s;">
    <div class="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-cyber-bg-medium">
      <h3 class="text-sm font-medium text-cyber-text-dim uppercase tracking-wider">
        {{ t('table.title') }}
      </h3>
    </div>

    <!-- Filter Panel -->
    <div v-if="harStore.entries.length > 0" class="px-6 py-4 border-b border-cyber-border bg-cyber-bg-medium/30">
      <div class="flex flex-wrap items-center gap-4">

        <!-- Method Filter -->
        <div v-if="availableMethods.length > 0" class="flex-shrink-0">
          <label class="block text-xs text-cyber-text-dim uppercase mb-2">Method</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="method in availableMethods"
              :key="method"
              @click="toggleMethodFilter(method)"
              :class="methodFilterClass(method)"
              class="px-3 py-1.5 rounded border text-xs uppercase transition-all"
            >
              {{ method }}
            </button>
          </div>
        </div>

        <!-- Path Filter -->
        <div class="flex-1 min-w-[200px] max-w-[400px]">
          <label class="block text-xs text-cyber-text-dim uppercase mb-2">Path Contains</label>
          <input
            v-model="harStore.filters.path"
            type="text"
            placeholder="e.g., /api/users"
            class="w-full px-3 py-2 bg-cyber-bg-card border border-cyber-border rounded text-sm text-cyber-text placeholder-cyber-text-dim focus:border-cyber-cyan focus:outline-none transition-colors"
          />
        </div>

        <!-- Status Filter -->
        <div class="flex-shrink-0">
          <label class="block text-xs text-cyber-text-dim uppercase mb-2">Status</label>
          <div class="flex gap-2">
            <button
              v-for="group in ['1xx', '2xx', '3xx', '4xx', '5xx']"
              :key="group"
              @click="toggleStatusFilter(group)"
              :class="statusFilterClass(group)"
              class="px-3 py-1.5 rounded border text-xs uppercase transition-all"
            >
              {{ group }}
            </button>
          </div>
        </div>

        <!-- Errors Only Filter -->
        <div class="flex-shrink-0 self-end">
          <button
            @click="harStore.toggleErrorsFilter()"
            :class="harStore.showErrorsOnly
              ? 'bg-status-error/20 border-status-error text-status-error hover:bg-status-error/30'
              : 'bg-cyber-bg-card/50 border-cyber-border text-cyber-text-dim hover:border-cyber-cyan'"
            class="px-4 py-2 rounded border text-xs uppercase transition-all"
          >
            <i class="pi pi-filter mr-2"></i>
            {{ harStore.showErrorsOnly ? t('table.showAll') : t('table.errorsOnly') }}
          </button>
        </div>

        <!-- Sentry Trace Only Filter -->
        <div class="flex-shrink-0 self-end">
          <button
            @click="harStore.toggleSentryTraceFilter()"
            :class="harStore.showSentryTraceOnly
              ? 'bg-cyber-magenta/20 border-cyber-magenta text-cyber-magenta hover:bg-cyber-magenta/30'
              : 'bg-cyber-bg-card/50 border-cyber-border text-cyber-text-dim hover:border-cyber-magenta'"
            class="px-4 py-2 rounded border text-xs uppercase transition-all"
          >
            <i class="pi pi-eye mr-2"></i>
            {{ harStore.showSentryTraceOnly ? t('table.showAll') : t('table.sentryOnly') }}
          </button>
        </div>

        <!-- Clear Filters -->
        <div class="flex-shrink-0 self-end">
          <button
            @click="clearFilters"
            class="px-4 py-2 rounded border border-cyber-border bg-cyber-bg-card/50 text-cyber-text-dim hover:border-status-error hover:text-status-error text-xs uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!hasActiveFilters"
          >
            <i class="pi pi-times mr-2"></i>
            Clear
          </button>
        </div>

        <!-- Active Filter Count Badge -->
        <div v-if="activeFilterCount > 0" class="flex-shrink-0 self-end">
          <div class="px-3 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan text-xs">
            {{ activeFilterCount }} filter{{ activeFilterCount > 1 ? 's' : '' }} active
          </div>
        </div>

      </div>
    </div>

    <div class="p-4">
      <DataTable
        :value="filteredEntries"
        v-model:selection="selectedRow"
        selectionMode="single"
        dataKey="id"
        @row-click="onRowClick"
        :paginator="true"
        :rows="50"
        :rowsPerPageOptions="[25, 50, 100]"
        :loading="harStore.loading"
        :rowClass="getRowClass"
        class="cyber-table"
        :scrollable="true"
        scrollHeight="flex"
        sortField="duration"
        :sortOrder="-1"
      >
        <Column field="id" :header="t('table.columns.number')" :sortable="true" :style="{ width: '60px', minWidth: '60px', maxWidth: '60px' }">
          <template #body="slotProps">
            <span class="text-sm text-cyber-text-dim">{{ slotProps.data.id }}</span>
          </template>
        </Column>

      <Column :header="t('table.columns.waterfall')" :style="{ width: '400px', minWidth: '400px', maxWidth: '400px' }">
        <template #body="slotProps">
          <WaterfallBar
            :entry="slotProps.data"
            :sessionDuration="harStore.sessionDuration"
          />
        </template>
      </Column>

      <Column field="status_code" :header="t('table.columns.status')" :sortable="true" :style="{ width: '85px', minWidth: '85px', maxWidth: '85px' }">
        <template #body="slotProps">
          <span
            :class="getStatusClass(slotProps.data.status_code)"
            class="px-2.5 py-1.5 rounded-md text-xs font-bold tracking-wider"
          >
            {{ slotProps.data.status_code }}
          </span>
        </template>
      </Column>

      <Column field="method" :header="t('table.columns.method')" :sortable="true" :style="{ width: '90px', minWidth: '90px', maxWidth: '90px' }">
        <template #body="slotProps">
          <span class="text-sm font-bold uppercase tracking-wide" :class="getMethodClass(slotProps.data.method)">
            {{ slotProps.data.method }}
          </span>
        </template>
      </Column>

      <Column field="domain" :header="t('table.columns.domain')" :sortable="true" :style="{ width: '180px', minWidth: '180px', maxWidth: '180px' }">
        <template #body="slotProps">
          <div class="truncate text-sm text-cyber-text-dim" :title="slotProps.data.domain">
            {{ slotProps.data.domain }}
          </div>
        </template>
      </Column>

      <Column field="path" :header="t('table.columns.path')" :sortable="true" :style="{ width: '250px', minWidth: '250px', maxWidth: '250px' }">
        <template #body="slotProps">
          <div
            class="truncate text-sm text-cyber-text hover:text-cyber-lime transition-colors cursor-pointer"
            :title="slotProps.data.url"
            @click.stop="openPath(slotProps.data)"
          >
            {{ slotProps.data.path }}
          </div>
        </template>
      </Column>

      <Column field="duration" :header="t('table.columns.time')" :sortable="true" :style="{ width: '100px', minWidth: '100px', maxWidth: '100px' }">
        <template #body="slotProps">
          <span class="text-sm font-bold tabular-nums" :class="getDurationClass(slotProps.data.duration)">
            {{ formatDuration(slotProps.data.duration) }}
          </span>
        </template>
      </Column>
      <Column field="server_timing_dur" :header="t('table.columns.serverDur')" :sortable="true" :style="{ width: '150px', minWidth: '150px', maxWidth: '150px' }">
        <template #body="slotProps">
          <span
            v-if="slotProps.data.server_timing_dur !== null"
            class="text-sm font-bold tabular-nums cursor-pointer"
            :class="getDurationClass(slotProps.data.server_timing_dur)"
            @click.stop="showServerTiming(slotProps.data)"
          >
            {{ formatDuration(slotProps.data.server_timing_dur) }}
          </span>
          <span v-else class="text-cyber-border text-xs">---</span>
        </template>
      </Column>
      <Column field="x_request_id" :header="t('table.columns.requestId')" :style="{ width: '150px', minWidth: '150px', maxWidth: '150px' }">
        <template #body="slotProps">
           <div
            v-if="slotProps.data.x_request_id"
            class="truncate text-xs text-cyber-cyan hover:text-cyber-lime transition-colors cursor-pointer hover:underline flex items-center gap-1"
            :title="slotProps.data.x_request_id"
            @click.stop="openLoki(slotProps.data)"
          >
            <i class="pi pi-search text-xs"></i>
            {{ slotProps.data.x_request_id }}
          </div>
          <span v-else class="text-cyber-border text-xs">---</span>
        </template>
      </Column>

      <Column field="resp_size" :header="t('table.columns.size')" :sortable="true" :style="{ width: '95px', minWidth: '95px', maxWidth: '95px' }">
        <template #body="slotProps">
          <span class="text-sm text-cyber-text-dim tabular-nums">{{ formatSize(slotProps.data.resp_size) }}</span>
        </template>
      </Column>



      <Column header="" :style="{ width: '70px', minWidth: '70px', maxWidth: '70px' }">
        <template #body="slotProps">
          <button
            @click.stop="showContextMenu($event, slotProps.data)"
            class="px-3 py-1.5 text-sm text-cyber-text-dim hover:text-cyber-cyan hover:bg-cyber-bg-medium rounded-md border border-transparent hover:border-cyber-border transition-all"
          >
            <i class="pi pi-ellipsis-v"></i>
          </button>
        </template>
      </Column>
      </DataTable>
    </div>

    <ContextMenu ref="contextMenu" :model="contextMenuItems" />

    <Dialog v-model:visible="isDialogVisible" modal header="Server-Timing Details" :style="{ width: '50vw' }" class="cyber-dialog">
      <pre class="text-sm font-mono bg-cyber-bg-dark p-4 rounded-lg overflow-x-auto">{{ selectedServerTiming }}</pre>
    </Dialog>

    <RequestDetailsDrawer />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ContextMenu from 'primevue/contextmenu'
import WaterfallBar from './WaterfallBar.vue'
import Dialog from 'primevue/dialog'
import RequestDetailsDrawer from './RequestDetailsDrawer.vue'

const { t } = useI18n()
const harStore = useHarStore()
const contextMenu = ref()
const selectedEntry = ref(null)
const isDialogVisible = ref(false)
const selectedServerTiming = ref('')

const selectedRow = computed({
  get: () => harStore.selectedEntry,
  set: (value) => {
    if (value) harStore.selectEntry(value.id)
    else harStore.clearSelection()
  }
})

const onRowClick = (event) => {
  harStore.selectEntry(event.data.id)
}

const showServerTiming = (entry) => {
  if (entry.server_timing) {
    selectedServerTiming.value = entry.server_timing
    isDialogVisible.value = true
  }
}

const filteredEntries = computed(() => {
  let results = harStore.entries

  // Existing error filter
  if (harStore.showErrorsOnly) {
    results = results.filter(e => e.status_code >= 400)
  }

  // Sentry trace only filter
  if (harStore.showSentryTraceOnly) {
    results = results.filter(e => e.sentry_trace && e.sentry_trace.length > 0)
  }

  // Method filter
  if (harStore.filters.methods.length > 0) {
    results = results.filter(e =>
      harStore.filters.methods.includes(e.method)
    )
  }

  // Path filter (case-insensitive contains)
  if (harStore.filters.path.trim()) {
    const pathSearch = harStore.filters.path.toLowerCase()
    results = results.filter(e =>
      e.path.toLowerCase().includes(pathSearch)
    )
  }

  // Status group filter
  if (harStore.filters.statusGroups.length > 0) {
    results = results.filter(e => {
      const status = e.status_code
      return harStore.filters.statusGroups.some(group => {
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
})

const availableMethods = computed(() => {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'CONNECT', 'TRACE']
})

const hasActiveFilters = computed(() =>
  harStore.filters.methods.length > 0 ||
  harStore.filters.path.trim() !== '' ||
  harStore.filters.statusGroups.length > 0 ||
  harStore.showErrorsOnly ||
  harStore.showSentryTraceOnly
)

const activeFilterCount = computed(() => harStore.activeFilterCount)

const contextMenuItems = computed(() => {
  if (!selectedEntry.value) return []

  const items = []

  // Open RequestID Dashboard (Loki)
  if (selectedEntry.value.x_request_id) {
    items.push({
      label: t('table.contextMenu.openRequestId'),
      icon: 'pi pi-search',
      command: () => openLoki(selectedEntry.value)
    })
  }

  // Open Path Dashboard
  if (selectedEntry.value.path) {
    items.push({
      label: t('table.contextMenu.openPath'),
      icon: 'pi pi-chart-line',
      command: () => openPath(selectedEntry.value)
    })
  }

  // Sentry Trace - conditional logic based on sampled flag
  const sentryTrace = selectedEntry.value.sentry_trace
  if (sentryTrace) {
    const parts = sentryTrace.split('-')
    const sampled = parts.length >= 3 && parts[parts.length - 1] === '1'

    if (sampled) {
      items.push({
        label: t('table.contextMenu.openSentry'),
        icon: 'pi pi-external-link',
        command: () => openSentryTrace(selectedEntry.value)
      })
    } else {
      items.push({
        label: t('table.contextMenu.sentryNotSampled'),
        icon: 'pi pi-ban',
        disabled: true
      })
    }
  }

  items.push({
    label: t('table.contextMenu.copyUrl'),
    icon: 'pi pi-copy',
    command: () => copyToClipboard(selectedEntry.value.url)
  })

  return items
})


const showContextMenu = (event, entry) => {
  selectedEntry.value = entry
  contextMenu.value.show(event)
}

const openLoki = (entry) => {
  const url = harStore.getLokiUrl(entry)
  if (url) {
    window.open(url, '_blank')
  }
}

const openPath = (entry) => {
  const url = harStore.getPathUrl(entry)
  if (url) {
    window.open(url, '_blank')
  }
}

const openSentryTrace = (entry) => {
  const url = harStore.getSentryTraceUrl(entry)
  if (url) {
    window.open(url, '_blank')
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
}

const toggleMethodFilter = (method) => {
  harStore.toggleMethodFilter(method)
}

const toggleStatusFilter = (group) => {
  harStore.toggleStatusFilter(group)
}

const clearFilters = () => {
  harStore.clearAllFilters()
}

const methodFilterClass = (method) => {
  const isSelected = harStore.filters.methods.includes(method)
  if (isSelected) {
    const baseClass = getMethodClass(method)
    return `${baseClass} bg-current/10 border-current`
  }
  return 'bg-cyber-bg-card/50 border-cyber-border text-cyber-text-dim hover:border-cyber-cyan'
}

const statusFilterClass = (group) => {
  const isSelected = harStore.filters.statusGroups.includes(group)
  if (!isSelected) {
    return 'bg-cyber-bg-card/50 border-cyber-border text-cyber-text-dim hover:border-cyber-cyan'
  }

  switch(group) {
    case '1xx': return 'bg-cyber-text-dim/20 border-cyber-text-dim text-cyber-text-dim'
    case '2xx': return 'bg-status-success/20 border-status-success text-status-success'
    case '3xx': return 'bg-status-info/20 border-status-info text-status-info'
    case '4xx': return 'bg-status-error/20 border-status-error text-status-error'
    case '5xx': return 'bg-status-critical/20 border-status-critical text-status-critical'
    default: return ''
  }
}

const getRowClass = (data) => {
  const classes = []
  if (data.status_code >= 500) classes.push('error-row')
  else if (data.status_code >= 400) classes.push('warning-row')
  else classes.push('normal-row')

  if (harStore.selectedEntryId === data.id) {
    classes.push('selected-row')
  }

  return classes.join(' ')
}

const getStatusClass = (statusCode) => {
  if (statusCode >= 500) return 'bg-status-critical/15 text-status-critical font-bold border border-status-critical/30'
  if (statusCode >= 400) return 'bg-status-error/15 text-status-error font-bold border border-status-error/30'
  if (statusCode >= 300) return 'bg-status-info/15 text-status-info font-bold border border-status-info/30'
  if (statusCode >= 200) return 'bg-status-success/15 text-status-success font-bold border border-status-success/30'
  return 'bg-cyber-bg-medium text-cyber-text-dim border border-cyber-border'
}

const getMethodClass = (method) => {
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

const getDurationClass = (duration) => {
  if (duration > 1000) return 'text-status-error'
  if (duration > 200) return 'text-status-warning'
  return 'text-cyber-text'
}

const formatDuration = (ms) => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
</script>

<style>
/* DataTable Styling */
.cyber-table :deep(.p-datatable) {
  background: transparent !important;
}

.cyber-table :deep(.p-datatable-wrapper) {
  background: transparent !important;
}

.cyber-table :deep(.p-datatable-table) {
  background: transparent !important;
}

.cyber-table :deep(.p-datatable-header) {
  background: var(--cyber-bg-medium) !important;
  border: 1px solid var(--cyber-border) !important;
  color: var(--cyber-text) !important;
}

.cyber-table :deep(.p-datatable-thead) {
  background: var(--cyber-bg-medium) !important;
}

.cyber-table :deep(.p-datatable-thead > tr) {
  background: var(--cyber-bg-medium) !important;
}

.cyber-table :deep(.p-datatable-thead > tr > th) {
  background: var(--cyber-bg-medium) !important;
  border-color: var(--cyber-border) !important;
  color: var(--cyber-text-dim) !important;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 0.5rem;
}

.cyber-table :deep(.p-datatable-thead > tr > th:hover) {
  background: var(--cyber-bg-card) !important;
  color: var(--cyber-text) !important;
}

.cyber-table :deep(.p-datatable-tbody) {
  background: transparent !important;
}

.cyber-table :deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.cyber-table :deep(.p-datatable-tbody > tr.normal-row) {
  background: transparent !important;
  border-bottom: 1px solid var(--cyber-border);
}

.cyber-table :deep(.p-datatable-tbody > tr.warning-row) {
  background: rgba(245, 158, 11, 0.06) !important;
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
}

.cyber-table :deep(.p-datatable-tbody > tr.error-row) {
  background: rgba(239, 68, 68, 0.06) !important;
  border-bottom: 1px solid rgba(239, 68, 68, 0.15);
}

.cyber-table :deep(.p-datatable-tbody > tr > td) {
  border-color: transparent !important;
  background: transparent !important;
  color: var(--cyber-text) !important;
  padding: 0.625rem 0.5rem;
  font-size: 0.875rem;
}

.cyber-table :deep(.p-paginator) {
  background: var(--cyber-bg-medium) !important;
  border: 1px solid var(--cyber-border) !important;
  border-top: none !important;
  color: var(--cyber-text) !important;
  padding: 0.75rem;
  font-family: 'Inter', sans-serif;
}

.cyber-table :deep(.p-paginator .p-paginator-pages .p-paginator-page) {
  color: var(--cyber-text-dim);
  border: 1px solid transparent;
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.375rem;
  transition: all 0.15s;
}

.cyber-table :deep(.p-paginator .p-paginator-pages .p-paginator-page:hover) {
  background: var(--cyber-bg-card);
  color: var(--cyber-text);
}

.cyber-table :deep(.p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
  background: var(--cyber-cyan);
  color: white;
  border-color: var(--cyber-cyan);
}

.cyber-table :deep(.p-paginator .p-dropdown) {
  background: var(--cyber-bg-card) !important;
  border: 1px solid var(--cyber-border) !important;
  color: var(--cyber-text) !important;
}

.cyber-table :deep(.p-paginator .p-dropdown:hover) {
  border-color: var(--cyber-cyan) !important;
}

.cyber-table :deep(.p-paginator .p-dropdown .p-dropdown-label) {
  color: var(--cyber-text) !important;
}

.cyber-table :deep(.p-paginator .p-dropdown .p-dropdown-trigger) {
  color: var(--cyber-text-dim) !important;
}

.cyber-table :deep(.p-paginator-first),
.cyber-table :deep(.p-paginator-prev),
.cyber-table :deep(.p-paginator-next),
.cyber-table :deep(.p-paginator-last) {
  color: var(--cyber-text-dim);
  border: 1px solid transparent;
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.375rem;
  transition: all 0.15s;
}

.cyber-table :deep(.p-paginator-first:hover),
.cyber-table :deep(.p-paginator-prev:hover),
.cyber-table :deep(.p-paginator-next:hover),
.cyber-table :deep(.p-paginator-last:hover) {
  background: var(--cyber-bg-card);
  color: var(--cyber-text);
}

.cyber-table :deep(.p-sortable-column-icon) {
  color: var(--cyber-text-dim) !important;
}

.cyber-table :deep(.p-datatable-emptymessage td) {
  background: transparent !important;
  color: var(--cyber-text-dim) !important;
}

.cyber-table :deep(.p-datatable-loading-overlay) {
  background: rgba(9, 9, 11, 0.9) !important;
}

.cyber-table :deep(.p-datatable .p-component-overlay) {
  background: rgba(9, 9, 11, 0.9) !important;
}

.cyber-table :deep(.p-datatable-loading-icon) {
  color: var(--cyber-cyan) !important;
}

/* White background removal */
.cyber-table :deep(td),
.cyber-table :deep(th),
.cyber-table :deep(.p-datatable-thead),
.cyber-table :deep(.p-datatable-tbody),
.cyber-table :deep(.p-datatable-tfoot),
.cyber-table :deep(.p-datatable-wrapper),
.cyber-table :deep(.p-datatable-table),
.cyber-table :deep(tr) {
  background: transparent !important;
}

.cyber-table :deep(.p-datatable-tbody > tr > td) {
  background: inherit !important;
}

.cyber-table,
.cyber-table table,
.cyber-table thead,
.cyber-table tfoot,
.cyber-table th {
  background-color: transparent !important;
}

.cyber-table tbody,
.cyber-table td {
  background-color: inherit;
}

/* Re-apply row backgrounds */
.cyber-table :deep(.p-datatable-tbody > tr.normal-row) {
  background: transparent !important;
  background-color: transparent !important;
}

.cyber-table :deep(.p-datatable-tbody > tr.warning-row) {
  background: rgba(245, 158, 11, 0.06) !important;
  background-color: rgba(245, 158, 11, 0.06) !important;
}

.cyber-table :deep(.p-datatable-tbody > tr.error-row) {
  background: rgba(239, 68, 68, 0.06) !important;
  background-color: rgba(239, 68, 68, 0.06) !important;
}

/* Ensure header stays dark */
.cyber-table :deep(.p-datatable-thead > tr),
.cyber-table :deep(.p-datatable-thead > tr > th) {
  background: var(--cyber-bg-medium) !important;
  background-color: var(--cyber-bg-medium) !important;
}

/* Force column widths to respect style attributes */
.cyber-table :deep(.p-datatable-thead > tr > th),
.cyber-table :deep(.p-datatable-tbody > tr > td) {
  width: inherit !important;
  min-width: inherit !important;
  max-width: inherit !important;
}
</style>

<style>
/* Global hover styles */
.cyber-table .p-datatable-tbody > tr.normal-row:hover {
  background: var(--cyber-bg-medium) !important;
  background-color: var(--cyber-bg-medium) !important;
}

.cyber-table .p-datatable-tbody > tr.warning-row:hover {
  background: rgba(245, 158, 11, 0.12) !important;
  background-color: rgba(245, 158, 11, 0.12) !important;
}

.cyber-table .p-datatable-tbody > tr.error-row:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  background-color: rgba(239, 68, 68, 0.12) !important;
}

/* Selected row styles */
.cyber-table .p-datatable-tbody > tr.selected-row {
  background: rgba(99, 102, 241, 0.1) !important;
  background-color: rgba(99, 102, 241, 0.1) !important;
  border-left: 3px solid var(--cyber-cyan) !important;
}

.cyber-table .p-datatable-tbody > tr.selected-row:hover {
  background: rgba(99, 102, 241, 0.15) !important;
  background-color: rgba(99, 102, 241, 0.15) !important;
  border-left: 3px solid var(--cyber-cyan) !important;
}

/* Dialog styling */
.cyber-dialog.p-dialog {
  background: var(--cyber-bg-card) !important;
  border: 1px solid var(--cyber-border) !important;
  border-radius: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.cyber-dialog .p-dialog-header {
  background: var(--cyber-bg-medium) !important;
  color: var(--cyber-text) !important;
  border-bottom: 1px solid var(--cyber-border) !important;
  font-family: 'Inter', sans-serif;
  padding: 1rem 1.5rem;
}

.cyber-dialog .p-dialog-header .p-dialog-title {
  color: var(--cyber-text) !important;
  font-weight: 600;
}

.cyber-dialog .p-dialog-header-icons {
  display: flex;
  align-items: center;
}

.cyber-dialog .p-dialog-header-icon {
  color: var(--cyber-text-dim) !important;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.cyber-dialog .p-dialog-header-icon:hover {
  background: var(--cyber-bg-card) !important;
  color: var(--cyber-text) !important;
}

.cyber-dialog .p-dialog-content {
  background: var(--cyber-bg-card) !important;
  color: var(--cyber-text) !important;
  padding: 1.5rem;
}

.p-dialog-mask {
  background: rgba(9, 9, 11, 0.8) !important;
  backdrop-filter: blur(4px);
}
</style>
