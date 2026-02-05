<template>
  <div class="response-tab">
    <div v-if="hasResponse" class="response-container">
      <div class="response-header">
        <div class="response-info">
          <span class="info-label">{{ t('drawer.response.mimeType') }}:</span>
          <span class="info-value">{{ mimeType }}</span>
          <span class="info-separator">|</span>
          <span class="info-label">{{ t('drawer.response.size') }}:</span>
          <span class="info-value">{{ formatSize(responseSize) }}</span>
          <span v-if="isEncoded" class="encoding-badge">{{ encoding }}</span>
        </div>
        <Button
          v-if="!isImage"
          @click="copyResponse"
          :label="copied ? t('drawer.actions.copied') : t('drawer.response.copy')"
          :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
          :class="copied ? 'copied-button' : ''"
          class="copy-button"
          size="small"
        />
      </div>

      <div class="response-content">
        <img v-if="isImage" :src="imageDataUrl" alt="Response image" class="response-image" />
        <pre v-else-if="isJson" class="json-content"><code>{{ formattedResponse }}</code></pre>
        <pre v-else-if="isBinary" class="binary-content">
          <div class="binary-warning">
            <i class="pi pi-file"></i>
            <div>Binary content ({{ formatSize(responseSize) }})</div>
            <div class="binary-type">{{ mimeType }}</div>
          </div>
        </pre>
        <pre v-else class="text-content"><code>{{ decodedResponse }}</code></pre>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-inbox empty-icon"></i>
      <div>{{ t('drawer.response.empty') }}</div>
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

const hasResponse = computed(() => {
  return props.entry.response?.content?.text !== undefined
})

const mimeType = computed(() => {
  return props.entry.response?.content?.mimeType || 'text/plain'
})

const responseSize = computed(() => {
  return props.entry.response?.content?.size || 0
})

const encoding = computed(() => {
  return props.entry.response?.content?.encoding || ''
})

const isEncoded = computed(() => {
  return encoding.value === 'base64'
})

const responseText = computed(() => {
  return props.entry.response?.content?.text || ''
})

const isJson = computed(() => {
  const mime = mimeType.value.toLowerCase()
  return mime.includes('json')
})

const isImage = computed(() => {
  const mime = mimeType.value.toLowerCase()
  return mime.startsWith('image/')
})

const isBinary = computed(() => {
  const mime = mimeType.value.toLowerCase()
  return (
    !isJson.value &&
    !isImage.value &&
    (mime.includes('octet-stream') ||
      mime.includes('pdf') ||
      mime.includes('zip') ||
      mime.includes('binary'))
  )
})

const decodedResponse = computed(() => {
  if (!isEncoded.value) return responseText.value

  try {
    return atob(responseText.value)
  } catch (e) {
    return responseText.value
  }
})

const formattedResponse = computed(() => {
  if (!isJson.value) return decodedResponse.value

  try {
    const text = decodedResponse.value
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return decodedResponse.value
  }
})

const imageDataUrl = computed(() => {
  if (!isImage.value) return ''

  if (isEncoded.value) {
    return `data:${mimeType.value};base64,${responseText.value}`
  }

  return responseText.value
})

const copyResponse = async () => {
  const success = await copyToClipboard(decodedResponse.value)

  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}
</script>

<style scoped>
.response-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.response-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--cyber-bg-medium);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.response-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  flex-wrap: wrap;
}

.info-label {
  color: var(--cyber-text-dim);
  font-weight: 600;
}

.info-value {
  color: var(--cyber-cyan);
}

.info-separator {
  color: var(--cyber-border);
}

.encoding-badge {
  padding: 0.25rem 0.5rem;
  background: rgba(255, 136, 0, 0.15);
  border: 1px solid var(--status-warning);
  color: var(--status-warning);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  text-transform: uppercase;
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

.response-content {
  flex: 1;
  overflow: auto;
  background: var(--cyber-bg-dark);
  border: 1px solid var(--cyber-border);
  border-radius: 0.375rem;
}

.json-content,
.text-content,
.binary-content {
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

.response-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1rem auto;
  border-radius: 0.375rem;
  border: 1px solid var(--cyber-border);
}

.binary-warning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--cyber-text-dim);
  text-align: center;
}

.binary-warning i {
  font-size: 3rem;
  opacity: 0.5;
}

.binary-type {
  font-size: 0.75rem;
  color: var(--cyber-cyan);
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
