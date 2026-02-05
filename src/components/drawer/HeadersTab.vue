<template>
  <div class="headers-tab">
    <div class="filter-section">
      <InputText
        v-model="searchQuery"
        :placeholder="t('drawer.headers.filter')"
        class="filter-input"
      >
        <template #prefix>
          <i class="pi pi-search" />
        </template>
      </InputText>
    </div>

    <Panel :header="`${t('drawer.headers.request')} (${filteredRequestHeaders.length})`" :toggleable="true" class="headers-panel">
      <div v-if="filteredRequestHeaders.length > 0" class="headers-list">
        <div v-for="h in filteredRequestHeaders" :key="h.name" class="header-row">
          <div class="header-name">{{ h.name }}</div>
          <div class="header-value-wrapper">
            <div class="header-value">{{ h.value }}</div>
            <button @click="copyValue(h.value)" class="copy-btn" :title="t('drawer.headers.copy')">
              <i class="pi pi-copy" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        {{ t('drawer.headers.empty') }}
      </div>
    </Panel>

    <Panel :header="`${t('drawer.headers.response')} (${filteredResponseHeaders.length})`" :toggleable="true" class="headers-panel">
      <div v-if="filteredResponseHeaders.length > 0" class="headers-list">
        <div v-for="h in filteredResponseHeaders" :key="h.name" class="header-row">
          <div class="header-name">{{ h.name }}</div>
          <div class="header-value-wrapper">
            <div class="header-value">{{ h.value }}</div>
            <button @click="copyValue(h.value)" class="copy-btn" :title="t('drawer.headers.copy')">
              <i class="pi pi-copy" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        {{ t('drawer.headers.empty') }}
      </div>
    </Panel>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Panel from 'primevue/panel'
import InputText from 'primevue/inputtext'
import { copyToClipboard } from '@/utils/curlGenerator'

const { t } = useI18n()

const props = defineProps({
  entry: {
    type: Object,
    required: true
  }
})

const searchQuery = ref('')

const filteredRequestHeaders = computed(() => {
  const headers = props.entry.request?.headers || []
  if (!searchQuery.value.trim()) return headers

  const query = searchQuery.value.toLowerCase()
  return headers.filter(h =>
    h.name.toLowerCase().includes(query) ||
    h.value.toLowerCase().includes(query)
  )
})

const filteredResponseHeaders = computed(() => {
  const headers = props.entry.response?.headers || []
  if (!searchQuery.value.trim()) return headers

  const query = searchQuery.value.toLowerCase()
  return headers.filter(h =>
    h.name.toLowerCase().includes(query) ||
    h.value.toLowerCase().includes(query)
  )
})

const copyValue = async (value) => {
  await copyToClipboard(value)
}
</script>

<style scoped>
.headers-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-section {
  position: sticky;
  top: 0;
  background: var(--cyber-bg-card);
  z-index: 10;
  padding-bottom: 1rem;
}

.filter-input {
  width: 100%;
  background: var(--cyber-bg-dark) !important;
  border: 1px solid var(--cyber-border) !important;
  color: var(--cyber-text) !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.875rem !important;
  padding: 0.75rem !important;
  border-radius: 0.375rem !important;
}

.filter-input:focus {
  border-color: var(--cyber-cyan) !important;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.2) !important;
}

.filter-input::placeholder {
  color: var(--cyber-text-dim) !important;
}

.headers-panel {
  background: var(--cyber-bg-dark) !important;
  border: 1px solid var(--cyber-border) !important;
  border-radius: 0.375rem !important;
}

.headers-panel :deep(.p-panel-header) {
  background: var(--cyber-bg-medium) !important;
  border-bottom: 1px solid var(--cyber-border) !important;
  color: var(--cyber-cyan) !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  padding: 0.75rem 1rem !important;
}

.headers-panel :deep(.p-panel-content) {
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
}

.headers-panel :deep(.p-panel-toggler) {
  color: var(--cyber-cyan) !important;
}

.headers-list {
  display: flex;
  flex-direction: column;
}

.header-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--cyber-border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  transition: background 0.2s;
}

.header-row:last-child {
  border-bottom: none;
}

.header-row:hover {
  background: var(--cyber-bg-medium);
}

.header-row:hover .copy-btn {
  opacity: 1;
}

.header-name {
  color: var(--cyber-cyan);
  font-weight: 600;
  word-break: break-word;
}

.header-value-wrapper {
  display: flex;
  align-items: start;
  gap: 0.5rem;
  min-width: 0;
}

.header-value {
  color: var(--cyber-text);
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.copy-btn {
  opacity: 0;
  background: transparent;
  border: none;
  color: var(--cyber-text-dim);
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-btn:hover {
  color: var(--cyber-cyan);
  transform: scale(1.1);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--cyber-text-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}
</style>
