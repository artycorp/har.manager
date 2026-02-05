<template>
  <div class="drawer-header">
    <div class="header-main">
      <div class="flex items-center gap-3 mb-2">
        <span :class="getMethodClass(entry.request.method)" class="method-badge">
          {{ entry.request.method }}
        </span>
        <span :class="getStatusClass(entry.response.status)" class="status-badge">
          {{ entry.response.status }} {{ entry.response.statusText }}
        </span>
      </div>

      <div class="url-display">
        <div class="font-mono text-sm text-cyber-text break-all">
          {{ entry.request.url }}
        </div>
      </div>
    </div>

    <div class="header-actions">
      <Button
        @click="copyCurl"
        :label="copied ? t('drawer.actions.copied') : t('drawer.actions.copyCurl')"
        :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
        :class="copied ? 'copied-button' : ''"
        class="curl-button"
        size="small"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import { generateCurl, copyToClipboard } from '@/utils/curlGenerator'

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

const copied = ref(false)

const copyCurl = async () => {
  const curlCommand = generateCurl(props.entry)
  const success = await copyToClipboard(curlCommand)

  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const getMethodClass = (method) => {
  const classes = {
    GET: 'method-get',
    POST: 'method-post',
    PUT: 'method-put',
    DELETE: 'method-delete',
    PATCH: 'method-patch',
    OPTIONS: 'method-options',
    HEAD: 'method-head'
  }
  return classes[method] || 'method-default'
}

const getStatusClass = (status) => {
  if (status >= 500) return 'status-5xx'
  if (status >= 400) return 'status-4xx'
  if (status >= 300) return 'status-3xx'
  if (status >= 200) return 'status-2xx'
  return 'status-default'
}
</script>

<style scoped>
.drawer-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.header-main {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.method-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.method-get {
  background: rgba(0, 191, 255, 0.15);
  color: var(--timing-dns);
  border: 1px solid var(--timing-dns);
}

.method-post {
  background: rgba(0, 255, 102, 0.15);
  color: var(--status-success);
  border: 1px solid var(--status-success);
}

.method-put {
  background: rgba(255, 255, 0, 0.15);
  color: var(--cyber-yellow);
  border: 1px solid var(--cyber-yellow);
}

.method-delete {
  background: rgba(255, 0, 85, 0.15);
  color: var(--status-error);
  border: 1px solid var(--status-error);
}

.method-patch {
  background: rgba(255, 0, 255, 0.15);
  color: var(--cyber-magenta);
  border: 1px solid var(--cyber-magenta);
}

.method-options,
.method-head,
.method-default {
  background: rgba(136, 146, 166, 0.15);
  color: var(--cyber-text-dim);
  border: 1px solid var(--cyber-text-dim);
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  border-width: 1px;
}

.status-2xx {
  background: rgba(0, 255, 102, 0.15);
  color: var(--status-success);
  border-color: var(--status-success);
  box-shadow: 0 0 10px rgba(0, 255, 102, 0.3);
}

.status-3xx {
  background: rgba(0, 212, 255, 0.15);
  color: var(--status-info);
  border-color: var(--status-info);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.status-4xx {
  background: rgba(255, 0, 85, 0.15);
  color: var(--status-error);
  border-color: var(--status-error);
  box-shadow: 0 0 10px rgba(255, 0, 85, 0.3);
}

.status-5xx {
  background: rgba(255, 0, 0, 0.15);
  color: var(--status-critical);
  border-color: var(--status-critical);
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.4);
}

.status-default {
  background: rgba(136, 146, 166, 0.15);
  color: var(--cyber-text-dim);
  border-color: var(--cyber-text-dim);
}

.url-display {
  padding: 0.75rem;
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.curl-button {
  background: var(--cyber-bg-medium) !important;
  border: 1px solid var(--cyber-border) !important;
  color: var(--cyber-cyan) !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.75rem !important;
  transition: all 0.2s !important;
}

.curl-button:hover {
  background: var(--cyber-bg-card) !important;
  border-color: var(--cyber-cyan) !important;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
}

.curl-button.copied-button {
  background: rgba(0, 255, 102, 0.15) !important;
  border-color: var(--status-success) !important;
  color: var(--status-success) !important;
}
</style>
