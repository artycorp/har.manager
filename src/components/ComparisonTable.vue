<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-mono uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
        <i class="pi pi-chart-bar"></i>
        {{ t('compare.matchedRequests') }} ({{ sortedMatches.length }})
      </h2>

      <div class="flex items-center gap-3">
        <!-- Sort Dropdown -->
        <div class="flex items-center gap-2">
          <label class="text-cyber-text-dim text-sm font-mono uppercase">{{ t('compare.sortBy') }}:</label>
          <select
            v-model="sortBy"
            class="px-3 py-2 bg-cyber-bg-card border border-cyber-border rounded-lg text-cyber-text font-mono text-sm focus:border-cyber-cyan focus:outline-none transition-colors"
          >
            <option value="total">{{ t('compare.sortByTotalDuration') }}</option>
            <option value="server">{{ t('compare.sortByServerDuration') }}</option>
          </select>
        </div>

        <!-- Differences Filter -->
        <button
          @click="showDifferencesOnly = !showDifferencesOnly"
          class="px-4 py-2 font-mono text-sm uppercase tracking-wider rounded-lg border transition-all duration-300"
          :class="showDifferencesOnly
            ? 'bg-cyber-lime text-cyber-bg-dark border-cyber-lime'
            : 'bg-cyber-bg-card/50 text-cyber-text-dim border-cyber-border hover:border-cyber-lime hover:text-cyber-lime'"
        >
          <i class="pi pi-filter mr-2"></i>
          {{ showDifferencesOnly ? t('compare.showAll') : t('compare.showDiffOnly') }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="border border-cyber-border rounded-lg overflow-hidden backdrop-blur-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm font-mono">
          <!-- Table Header -->
          <thead class="bg-cyber-bg-card/50 border-b border-cyber-border">
            <tr>
              <th class="px-4 py-3 text-left text-cyber-text-dim uppercase tracking-wider w-10"></th>
              <th class="px-4 py-3 text-left text-cyber-text-dim uppercase tracking-wider">
                {{ t('table.columns.method') }}
              </th>
              <th class="px-4 py-3 text-left text-cyber-text-dim uppercase tracking-wider">
                {{ t('table.columns.path') }}
              </th>
              <!-- HAR 1 columns -->
              <th colspan="3" class="px-4 py-3 text-center text-cyber-cyan uppercase tracking-wider border-l border-cyber-border">
                {{ t('compare.har1') }}
              </th>
              <!-- HAR 2 columns -->
              <th colspan="3" class="px-4 py-3 text-center text-cyber-magenta uppercase tracking-wider border-l border-cyber-border">
                {{ t('compare.har2') }}
              </th>
              <!-- Diff column -->
              <th class="px-4 py-3 text-center text-cyber-lime uppercase tracking-wider border-l border-cyber-border">
                {{ t('compare.diff') }}
              </th>
            </tr>
            <tr class="border-t border-cyber-border/50">
              <th class="px-4 py-2"></th>
              <th class="px-4 py-2"></th>
              <th class="px-4 py-2"></th>
              <!-- HAR 1 sub-headers -->
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase border-l border-cyber-border">{{ t('table.columns.status') }}</th>
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase">{{ t('table.columns.time') }}</th>
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase">{{ t('compare.serverDur') }}</th>
              <!-- HAR 2 sub-headers -->
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase border-l border-cyber-border">{{ t('table.columns.status') }}</th>
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase">{{ t('table.columns.time') }}</th>
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase">{{ t('compare.serverDur') }}</th>
              <!-- Diff sub-header -->
              <th class="px-2 py-2 text-center text-cyber-text-dim text-xs uppercase border-l border-cyber-border">{{ t('compare.diff') }}</th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody>
            <template v-for="(match, index) in filteredMatches" :key="match.key">
              <!-- Aggregated Row -->
              <tr
                class="border-t border-cyber-border hover:bg-cyber-bg-card/30 transition-colors cursor-pointer"
                @click="toggleExpand(match.key)"
              >
                <td class="px-4 py-3 text-center">
                  <i
                    class="pi transition-transform duration-200"
                    :class="expandedRows.has(match.key) ? 'pi-chevron-down text-cyber-cyan' : 'pi-chevron-right text-cyber-text-dim'"
                  ></i>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded text-xs font-bold uppercase" :class="getMethodClass(match.method)">
                    {{ match.method }}
                  </span>
                </td>
                <td
                  class="px-4 py-3 text-cyber-text cursor-pointer hover:text-cyber-lime transition-colors"
                  @contextmenu="showPathContextMenu($event, match)"
                  @click.stop
                  :title="t('compare.clickToOpenLoki')"
                >
                  {{ match.path }}
                  <span v-if="match.aggregated.entry1.isAverage" class="ml-2 text-cyber-text-dim text-xs">
                    ({{ t('compare.avg') }} × {{ match.aggregated.entry1.count }})
                  </span>
                </td>

                <!-- HAR 1 Data -->
                <td
                  class="px-2 py-3 text-center border-l border-cyber-border cursor-pointer hover:opacity-80 transition-opacity"
                  :class="getStatusClass(match.aggregated.entry1.status_code)"
                  @click.stop="openLoki(match.aggregated.entry1, 1)"
                  :title="match.aggregated.entry1.x_request_id ? t('compare.clickToOpenLoki') : ''"
                >
                  {{ match.aggregated.entry1.status_code }}
                </td>
                <td
                  class="px-2 py-3 text-center text-cyber-text cursor-pointer hover:text-cyber-cyan transition-colors"
                  @click.stop="openLoki(match.aggregated.entry1, 1)"
                  :title="match.aggregated.entry1.x_request_id ? t('compare.clickToOpenLoki') : ''"
                >
                  {{ formatDuration(match.aggregated.entry1.duration) }}
                </td>
                <td
                  class="px-2 py-3 text-center text-cyber-text-dim text-xs cursor-pointer hover:text-cyber-cyan transition-colors"
                  @click.stop="openLoki(match.aggregated.entry1, 1)"
                  :title="match.aggregated.entry1.x_request_id ? t('compare.clickToOpenLoki') : ''"
                >
                  {{ formatServerDur(match.aggregated.entry1.server_timing_dur) }}
                </td>

                <!-- HAR 2 Data -->
                <td
                  class="px-2 py-3 text-center border-l border-cyber-border cursor-pointer hover:opacity-80 transition-opacity"
                  :class="getStatusClass(match.aggregated.entry2.status_code)"
                  @click.stop="openLoki(match.aggregated.entry2, 2)"
                  :title="match.aggregated.entry2.x_request_id ? t('compare.clickToOpenLoki') : ''"
                >
                  {{ match.aggregated.entry2.status_code }}
                </td>
                <td
                  class="px-2 py-3 text-center text-cyber-text cursor-pointer hover:text-cyber-magenta transition-colors"
                  @click.stop="openLoki(match.aggregated.entry2, 2)"
                  :title="match.aggregated.entry2.x_request_id ? t('compare.clickToOpenLoki') : ''"
                >
                  {{ formatDuration(match.aggregated.entry2.duration) }}
                </td>
                <td
                  class="px-2 py-3 text-center text-cyber-text-dim text-xs cursor-pointer hover:text-cyber-magenta transition-colors"
                  @click.stop="openLoki(match.aggregated.entry2, 2)"
                  :title="match.aggregated.entry2.x_request_id ? t('compare.clickToOpenLoki') : ''"
                >
                  {{ formatServerDur(match.aggregated.entry2.server_timing_dur) }}
                </td>

                <!-- Diff -->
                <td class="px-2 py-3 text-center border-l border-cyber-border">
                  <DiffIndicator :diff="match.aggregated.diff" />
                </td>
              </tr>

              <!-- Expanded Individual Pairs -->
              <template v-if="expandedRows.has(match.key) && match.pairs.length > 1">
                <tr
                  v-for="(pair, pairIndex) in match.pairs"
                  :key="`${match.key}-${pairIndex}`"
                  class="border-t border-cyber-border/30 bg-cyber-bg-card/20"
                >
                  <td class="px-4 py-2"></td>
                  <td class="px-4 py-2 text-cyber-text-dim text-xs text-center">
                    #{{ pairIndex + 1 }}
                  </td>
                  <td class="px-4 py-2"></td>

                  <!-- Pair HAR 1 Data -->
                  <td
                    class="px-2 py-2 text-center border-l border-cyber-border/30"
                    :class="[pair.entry1 ? getStatusClass(pair.entry1.status_code) : 'text-cyber-text-dim', pair.entry1 && pair.entry1.x_request_id ? 'cursor-pointer hover:opacity-80 transition-opacity' : '']"
                    @click.stop="pair.entry1 ? openLoki(pair.entry1, 1) : null"
                    :title="pair.entry1 && pair.entry1.x_request_id ? t('compare.clickToOpenLoki') : ''"
                  >
                    {{ pair.entry1 ? pair.entry1.status_code : '-' }}
                  </td>
                  <td
                    class="px-2 py-2 text-center text-cyber-text text-xs"
                    :class="pair.entry1 && pair.entry1.x_request_id ? 'cursor-pointer hover:text-cyber-cyan transition-colors' : ''"
                    @click.stop="pair.entry1 ? openLoki(pair.entry1, 1) : null"
                    :title="pair.entry1 && pair.entry1.x_request_id ? t('compare.clickToOpenLoki') : ''"
                  >
                    {{ pair.entry1 ? formatDuration(pair.entry1.duration) : '-' }}
                  </td>
                  <td
                    class="px-2 py-2 text-center text-cyber-text-dim text-xs"
                    :class="pair.entry1 && pair.entry1.x_request_id ? 'cursor-pointer hover:text-cyber-cyan transition-colors' : ''"
                    @click.stop="pair.entry1 ? openLoki(pair.entry1, 1) : null"
                    :title="pair.entry1 && pair.entry1.x_request_id ? t('compare.clickToOpenLoki') : ''"
                  >
                    {{ pair.entry1 ? formatServerDur(pair.entry1.server_timing_dur) : '-' }}
                  </td>

                  <!-- Pair HAR 2 Data -->
                  <td
                    class="px-2 py-2 text-center border-l border-cyber-border/30"
                    :class="[pair.entry2 ? getStatusClass(pair.entry2.status_code) : 'text-cyber-text-dim', pair.entry2 && pair.entry2.x_request_id ? 'cursor-pointer hover:opacity-80 transition-opacity' : '']"
                    @click.stop="pair.entry2 ? openLoki(pair.entry2, 2) : null"
                    :title="pair.entry2 && pair.entry2.x_request_id ? t('compare.clickToOpenLoki') : ''"
                  >
                    {{ pair.entry2 ? pair.entry2.status_code : '-' }}
                  </td>
                  <td
                    class="px-2 py-2 text-center text-cyber-text text-xs"
                    :class="pair.entry2 && pair.entry2.x_request_id ? 'cursor-pointer hover:text-cyber-magenta transition-colors' : ''"
                    @click.stop="pair.entry2 ? openLoki(pair.entry2, 2) : null"
                    :title="pair.entry2 && pair.entry2.x_request_id ? t('compare.clickToOpenLoki') : ''"
                  >
                    {{ pair.entry2 ? formatDuration(pair.entry2.duration) : '-' }}
                  </td>
                  <td
                    class="px-2 py-2 text-center text-cyber-text-dim text-xs"
                    :class="pair.entry2 && pair.entry2.x_request_id ? 'cursor-pointer hover:text-cyber-magenta transition-colors' : ''"
                    @click.stop="pair.entry2 ? openLoki(pair.entry2, 2) : null"
                    :title="pair.entry2 && pair.entry2.x_request_id ? t('compare.clickToOpenLoki') : ''"
                  >
                    {{ pair.entry2 ? formatServerDur(pair.entry2.server_timing_dur) : '-' }}
                  </td>

                  <!-- Pair Diff -->
                  <td class="px-2 py-2 text-center border-l border-cyber-border/30">
                    <DiffIndicator v-if="pair.diff" :diff="pair.diff" :compact="true" />
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredMatches.length === 0" class="text-center py-12">
        <i class="pi pi-inbox text-6xl text-cyber-text-dim mb-4"></i>
        <p class="text-cyber-text-dim font-mono">
          {{ showDifferencesOnly ? t('compare.noDifferences') : t('compare.noMatches') }}
        </p>
      </div>
    </div>

    <!-- Context Menu -->
    <ContextMenu ref="contextMenu" :model="contextMenuItems" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'
import ContextMenu from 'primevue/contextmenu'
import DiffIndicator from './DiffIndicator.vue'

const { t } = useI18n()
const harStore = useHarStore()

const props = defineProps({
  matches: {
    type: Array,
    required: true,
  },
})

const showDifferencesOnly = ref(false)
const expandedRows = ref(new Set())
const sortBy = ref('total') // 'total' or 'server'
const contextMenu = ref(null)
const selectedMatch = ref(null)
const contextMenuItems = ref([])

const sortedMatches = computed(() => {
  const matches = [...props.matches]

  if (sortBy.value === 'server') {
    // Sort by server timing diff (largest absolute diff first)
    matches.sort((a, b) => {
      const hasServerA = a.aggregated.diff?.serverTiming !== null && a.aggregated.diff?.serverTiming !== undefined
      const hasServerB = b.aggregated.diff?.serverTiming !== null && b.aggregated.diff?.serverTiming !== undefined

      // Put items without server timing at the end
      if (!hasServerA && !hasServerB) return 0
      if (!hasServerA) return 1
      if (!hasServerB) return -1

      // Both have server timing, compare absolute diff
      const diffA = Math.abs(a.aggregated.diff.serverTiming.diff)
      const diffB = Math.abs(b.aggregated.diff.serverTiming.diff)
      return diffB - diffA
    })
  } else {
    // Sort by total duration diff (largest absolute diff first) - default
    matches.sort((a, b) => {
      const diffA = Math.abs(a.aggregated.diff?.duration?.diff || 0)
      const diffB = Math.abs(b.aggregated.diff?.duration?.diff || 0)
      return diffB - diffA
    })
  }

  return matches
})

const filteredMatches = computed(() => {
  if (!showDifferencesOnly.value) {
    return sortedMatches.value
  }
  return sortedMatches.value.filter(m => m.hasDifference)
})

const toggleExpand = (key) => {
  if (expandedRows.value.has(key)) {
    expandedRows.value.delete(key)
  } else {
    expandedRows.value.add(key)
  }
}

const getMethodClass = (method) => {
  const classes = {
    GET: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
    POST: 'bg-green-500/20 text-green-400 border border-green-500/50',
    PUT: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
    DELETE: 'bg-red-500/20 text-red-400 border border-red-500/50',
    PATCH: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
  }
  return classes[method] || 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
}

const getStatusClass = (status) => {
  if (status >= 200 && status < 300) return 'text-status-success'
  if (status >= 300 && status < 400) return 'text-status-redirect'
  if (status >= 400 && status < 500) return 'text-status-client-error'
  if (status >= 500) return 'text-status-error'
  return 'text-cyber-text-dim'
}

const formatDuration = (duration) => {
  if (duration === null || duration === undefined) return '-'
  return `${duration.toFixed(2)}ms`
}

const formatServerDur = (serverDur) => {
  if (serverDur === null || serverDur === undefined) return t('compare.notAvailable')
  return `${serverDur.toFixed(2)}ms`
}

// Grafana integration functions
const openLoki = (entry, harNum) => {
  if (!entry || !entry.x_request_id) return

  const url = harStore.getLokiUrl(entry)
  if (url) {
    window.open(url, '_blank')
  }
}

const openPath = (entry, harNum) => {
  if (!entry) return

  const url = harStore.getPathUrl(entry)
  if (url) {
    window.open(url, '_blank')
  }
}

const showPathContextMenu = (event, match) => {
  event.preventDefault()
  selectedMatch.value = match

  contextMenuItems.value = [
    {
      label: t('compare.contextMenu.openHar1Path'),
      icon: 'pi pi-chart-line',
      command: () => openPath(match.aggregated.entry1, 1)
    },
    {
      label: t('compare.contextMenu.openHar2Path'),
      icon: 'pi pi-chart-line',
      command: () => openPath(match.aggregated.entry2, 2)
    }
  ]

  contextMenu.value.show(event)
}
</script>
