<template>
  <div class="payload-tab">
    <div v-if="hasPayload" class="payload-container">
      <div class="payload-header">
        <div class="payload-info">
          <span class="info-label">{{ t('drawer.payload.mimeType') }}:</span>
          <span class="info-value">{{ mimeType }}</span>
        </div>
        <Button
          @click="copyPayload"
          :label="copied ? t('drawer.actions.copied') : t('drawer.payload.copy')"
          :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
          :class="copied ? 'copied-button' : ''"
          class="copy-button"
          size="small"
        />
      </div>

      <div class="payload-content">
        <pre v-if="isJson" class="json-content"><code>{{ formattedPayload }}</code></pre>
        <div v-else-if="isFormData" class="form-data">
          <div v-for="(param, index) in formParams" :key="index" class="form-param">
            <div class="param-name">{{ param.name }}</div>
            <div class="param-value">{{ param.value }}</div>
          </div>
        </div>
        <pre v-else class="text-content"><code>{{ payloadText }}</code></pre>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-inbox empty-icon"></i>
      <div>{{ t('drawer.payload.empty') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import { copyToClipboard } from '@/utils/curlGenerator'

const { t } = useI18n()

const props = defineProps({
  entry: {
    type: Object,
    required: true
  }
})

const copied = ref(false)

const hasPayload = computed(() => {
  return props.entry.request?.postData?.text
})

const mimeType = computed(() => {
  return props.entry.request?.postData?.mimeType || 'text/plain'
})

const payloadText = computed(() => {
  return props.entry.request?.postData?.text || ''
})

const isJson = computed(() => {
  const mime = mimeType.value.toLowerCase()
  return mime.includes('json')
})

const isFormData = computed(() => {
  const mime = mimeType.value.toLowerCase()
  return mime.includes('form-urlencoded') || mime.includes('form-data')
})

const formattedPayload = computed(() => {
  if (!isJson.value) return payloadText.value

  try {
    const parsed = JSON.parse(payloadText.value)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return payloadText.value
  }
})

const formParams = computed(() => {
  if (!isFormData.value) return []

  const params = props.entry.request?.postData?.params || []
  if (params.length > 0) return params

  // Try to parse URL-encoded form data
  try {
    const text = payloadText.value
    const pairs = text.split('&')
    return pairs.map(pair => {
      const [name, value] = pair.split('=')
      return {
        name: decodeURIComponent(name),
        value: decodeURIComponent(value || '')
      }
    })
  } catch (e) {
    return []
  }
})

const copyPayload = async () => {
  const success = await copyToClipboard(payloadText.value)

  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.payload-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.payload-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.payload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--cyber-bg-medium);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
}

.payload-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
}

.info-label {
  color: var(--cyber-text-dim);
  font-weight: 600;
}

.info-value {
  color: var(--cyber-cyan);
}

.copy-button {
  background: var(--cyber-bg-dark) !important;
  border: 1px solid var(--cyber-border) !important;
  color: var(--cyber-cyan) !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.75rem !important;
  transition: all 0.2s !important;
}

.copy-button:hover {
  background: var(--cyber-bg-card) !important;
  border-color: var(--cyber-cyan) !important;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;
}

.copy-button.copied-button {
  background: rgba(0, 255, 102, 0.15) !important;
  border-color: var(--status-success) !important;
  color: var(--status-success) !important;
}

.payload-content {
  flex: 1;
  overflow: auto;
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
}

.json-content,
.text-content {
  margin: 0;
  padding: 1rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--cyber-text);
  overflow-x: auto;
}

.json-content code,
.text-content code {
  color: var(--cyber-text);
}

.form-data {
  padding: 1rem;
}

.form-param {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--cyber-border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
}

.form-param:last-child {
  border-bottom: none;
}

.param-name {
  color: var(--cyber-cyan);
  font-weight: 600;
  word-break: break-word;
}

.param-value {
  color: var(--cyber-text);
  word-break: break-all;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--cyber-text-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}
</style>
