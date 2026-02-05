<template>
  <div class="max-w-4xl mx-auto animate-slide-in-up">
    <div class="relative">
      <!-- Terminal-style container -->
      <div class="bg-cyber-bg-card/50 backdrop-blur-md rounded-lg border border-cyber-border overflow-hidden">
        <!-- Header bar -->
        <div class="flex items-center justify-between px-6 py-4 bg-cyber-bg-medium border-b border-cyber-border">
          <span class="font-mono text-sm text-cyber-text-dim">config.json</span>
          <button
            @click="handleClose"
            class="p-1.5 rounded-md hover:bg-cyber-bg-card text-cyber-text-dim hover:text-cyber-text transition-all"
            :title="t('settings.closeTooltip')"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>

        <!-- Header -->
        <div class="p-8 border-b border-cyber-border">
          <div class="flex items-center gap-4 mb-4">
            <i class="pi pi-cog text-3xl text-cyber-magenta"></i>
            <div>
              <h2 class="text-xl font-semibold text-cyber-text">
                {{ t('settings.title') }}
              </h2>
              <p class="text-cyber-text-dim font-mono text-sm">
                {{ t('settings.subtitle') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Settings Form -->
        <div class="p-8 space-y-6">
          <!-- Success Message -->
          <div v-if="saveSuccess" class="p-4 bg-status-success/10 border border-status-success/30 rounded-lg animate-slide-in-up">
            <div class="flex items-center gap-3">
              <i class="pi pi-check-circle text-status-success text-xl"></i>
              <div>
                <p class="text-sm font-bold text-status-success font-mono uppercase">{{ t('settings.success') }}</p>
                <p class="text-sm text-cyber-text mt-1 font-mono">{{ t('settings.successMessage') }}</p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-status-error/10 border border-status-error/30 rounded-lg">
            <div class="flex items-start gap-3">
              <i class="pi pi-exclamation-triangle text-status-error text-xl mt-0.5"></i>
              <div class="flex-1">
                <p class="text-sm font-bold text-status-error font-mono uppercase tracking-wide">{{ t('settings.error') }}</p>
                <p class="text-sm text-cyber-text mt-1 font-mono">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Grafana Request ID Dashboard URL -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 font-mono text-sm text-cyber-cyan uppercase tracking-wider">
              <i class="pi pi-search text-cyber-cyan"></i>
              {{ t('settings.lokiUrl') }}
            </label>
            <input
              v-model="config.grafana_loki_url"
              type="text"
              :placeholder="t('settings.lokiPlaceholder')"
              class="w-full px-4 py-3 bg-cyber-bg-medium border border-cyber-border rounded-lg font-mono text-sm text-cyber-text placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan focus:ring-2 focus:ring-cyber-cyan/20 transition-all"
              :disabled="saving"
            />
            <div class="flex items-center gap-2 pt-2">
              <input
                v-model="config.grafana_loki_escape"
                type="checkbox"
                id="loki-escape"
                class="w-4 h-4 bg-cyber-bg-medium border border-cyber-border rounded focus:ring-2 focus:ring-cyber-cyan"
                :disabled="saving"
              />
              <label for="loki-escape" class="text-xs text-cyber-text-dim font-mono cursor-pointer">
                {{ t('settings.lokiEscape') }}
              </label>
            </div>
            <p class="text-xs text-cyber-text-dim font-mono">
              {{ t('settings.lokiPlaceholder') }}
            </p>
          </div>

          <!-- Grafana Path URL -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 font-mono text-sm text-cyber-yellow uppercase tracking-wider">
              <i class="pi pi-chart-line text-cyber-yellow"></i>
              {{ t('settings.pathUrl') }}
            </label>
            <input
              v-model="config.grafana_path_url"
              type="text"
              :placeholder="t('settings.pathPlaceholder')"
              class="w-full px-4 py-3 bg-cyber-bg-medium border border-cyber-border rounded-lg font-mono text-sm text-cyber-text placeholder-cyber-text-dim focus:outline-none focus:border-cyber-yellow focus:ring-2 focus:ring-cyber-yellow/20 transition-all"
              :disabled="saving"
            />
            <div class="flex items-center gap-2 pt-2">
              <input
                v-model="config.grafana_path_loki_escape"
                type="checkbox"
                id="path-loki-escape"
                class="w-4 h-4 bg-cyber-bg-medium border border-cyber-border rounded focus:ring-2 focus:ring-cyber-yellow"
                :disabled="saving"
              />
              <label for="path-loki-escape" class="text-xs text-cyber-text-dim font-mono cursor-pointer">
                {{ t('settings.pathLokiEscape') }}
              </label>
            </div>
            <p class="text-xs text-cyber-text-dim font-mono">
              {{ t('settings.pathPlaceholder') }}
            </p>
          </div>

          <!-- Coroot URL -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 font-mono text-sm text-cyber-lime uppercase tracking-wider">
              <i class="pi pi-server text-cyber-lime"></i>
              {{ t('settings.corootUrl') }}
            </label>
            <input
              v-model="config.coroot_url"
              type="text"
              :placeholder="t('settings.corootPlaceholder')"
              class="w-full px-4 py-3 bg-cyber-bg-medium border border-cyber-border rounded-lg font-mono text-sm text-cyber-text placeholder-cyber-text-dim focus:outline-none focus:border-cyber-lime focus:ring-2 focus:ring-cyber-lime/20 transition-all"
              :disabled="saving"
            />
            <p class="text-xs text-cyber-text-dim font-mono">
              {{ t('settings.corootPlaceholder') }}
            </p>
          </div>

          <!-- Sentry Trace URL -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 font-mono text-sm text-cyber-magenta uppercase tracking-wider">
              <i class="pi pi-external-link text-cyber-magenta"></i>
              {{ t('settings.sentryUrl') }}
            </label>
            <input
              v-model="config.sentry_trace_url"
              type="text"
              :placeholder="t('settings.sentryPlaceholder')"
              class="w-full px-4 py-3 bg-cyber-bg-medium border border-cyber-border rounded-lg font-mono text-sm text-cyber-text placeholder-cyber-text-dim focus:outline-none focus:border-cyber-magenta focus:ring-2 focus:ring-cyber-magenta/20 transition-all"
              :disabled="saving"
            />
            <p class="text-xs text-cyber-text-dim font-mono">
              {{ t('settings.sentryPlaceholder') }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 pt-4">
            <button
              @click="saveConfig"
              :disabled="saving"
              class="group flex-1 px-6 py-3 bg-cyber-cyan text-white font-mono font-semibold uppercase tracking-wider rounded-lg border-2 border-cyber-cyan hover:bg-transparent hover:text-cyber-cyan transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!saving" class="flex items-center justify-center gap-2">
                <i class="pi pi-save"></i>
                {{ t('settings.saveButton') }}
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <i class="pi pi-spin pi-spinner"></i>
                {{ t('settings.saving') }}
              </span>
            </button>

            <button
              @click="loadConfig"
              :disabled="saving"
              class="px-6 py-3 bg-cyber-bg-medium text-cyber-text-dim font-mono font-bold uppercase tracking-wider rounded-lg border-2 border-cyber-border hover:border-cyber-text-dim hover:text-cyber-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :title="t('settings.resetTooltip')"
            >
              <i class="pi pi-refresh mr-2"></i>
              {{ t('settings.resetButton') }}
            </button>

            <button
              @click="handleClose"
              :disabled="saving"
              class="px-6 py-3 bg-cyber-bg-medium text-cyber-text-dim font-mono font-bold uppercase tracking-wider rounded-lg border-2 border-cyber-border hover:border-cyber-magenta hover:text-cyber-magenta transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :title="t('settings.backTooltip')"
            >
              <i class="pi pi-arrow-left mr-2"></i>
              {{ t('settings.backButton') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'

const { t } = useI18n()
const emit = defineEmits(['close'])

const harStore = useHarStore()

const config = ref({
  grafana_loki_url: '',
  grafana_loki_escape: true,
  coroot_url: '',
  grafana_path_url: '',
  grafana_path_loki_escape: true,
  sentry_trace_url: ''
})

const saving = ref(false)
const saveSuccess = ref(false)
const error = ref(null)

const handleClose = () => {
  emit('close')
}

const loadConfig = () => {
  try {
    error.value = null
    harStore.loadConfig()
    config.value = { ...harStore.grafanaConfig }
  } catch (err) {
    error.value = err.message || 'Failed to load configuration'
    console.error('Failed to load config:', err)
  }
}

const saveConfig = async () => {
  saving.value = true
  error.value = null
  saveSuccess.value = false

  try {
    harStore.updateGrafanaConfig(config.value)
    saveSuccess.value = true

    // Hide success message after 3 seconds
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (err) {
    error.value = err.message || 'Failed to save configuration'
    console.error('Failed to save config:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
