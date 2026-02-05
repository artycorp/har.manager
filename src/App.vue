<template>
  <div class="min-h-screen bg-cyber-bg-dark">
    <header class="relative border-b border-cyber-border bg-cyber-bg-medium/50 backdrop-blur-sm">
      <div class="max-w-[1800px] mx-auto px-4 py-5 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-8">
            <div class="space-y-1 animate-slide-in-left">
              <div class="flex items-center gap-3">
                <div class="cursor-pointer" @click="currentView = 'home'">
                  <h1 class="text-4xl font-bold text-cyber-text tracking-tight">
                    {{ t('app.title') }}
                  </h1>
                </div>
                <span class="text-xs text-cyber-text-dim font-mono bg-cyber-bg-card px-2 py-0.5 rounded border border-cyber-border">
                  {{ appVersion }}
                </span>
              </div>
            </div>

            <!-- Navigation -->
            <nav class="flex gap-1">
              <button
                @click="currentView = 'home'"
                class="px-4 py-2 text-sm rounded-lg transition-all duration-200"
                :class="currentView === 'home'
                  ? 'bg-cyber-cyan text-white font-medium'
                  : 'text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-bg-card'"
              >
                <i class="pi pi-chart-line mr-2"></i>
                {{ t('nav.analyzer') }}
              </button>
              <button
                @click="currentView = 'compare'"
                class="px-4 py-2 text-sm rounded-lg transition-all duration-200"
                :class="currentView === 'compare'
                  ? 'bg-cyber-magenta text-white font-medium'
                  : 'text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-bg-card'"
              >
                <i class="pi pi-arrows-h mr-2"></i>
                {{ t('nav.compare') }}
              </button>
              <button
                @click="currentView = 'settings'"
                class="px-4 py-2 text-sm rounded-lg transition-all duration-200"
                :class="currentView === 'settings'
                  ? 'bg-cyber-bg-card text-cyber-text font-medium border border-cyber-border'
                  : 'text-cyber-text-dim hover:text-cyber-text hover:bg-cyber-bg-card'"
              >
                <i class="pi pi-cog mr-2"></i>
                {{ t('nav.settings') }}
              </button>
            </nav>
          </div>

          <!-- Language Switcher -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1 bg-cyber-bg-card rounded-lg p-0.5 border border-cyber-border">
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="changeLanguage(lang.code)"
                class="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200"
                :class="locale === lang.code
                  ? 'bg-cyber-cyan text-white'
                  : 'text-cyber-text-dim hover:text-cyber-text'"
                :title="lang.name"
              >
                {{ lang.code.toUpperCase() }}
              </button>
            </div>

            <div v-if="harStore.currentSession && currentView === 'home'" class="flex items-center gap-3 animate-slide-in-up">
              <div class="flex items-center gap-2 px-3 py-1.5 bg-cyber-bg-card border border-cyber-border rounded-lg">
                <i class="pi pi-file text-cyber-text-dim text-sm"></i>
                <span class="font-mono text-sm text-cyber-text-dim">{{ harStore.currentSession.filename }}</span>
              </div>
              <button
                @click="handleClearSession"
                class="group p-2 rounded-lg border border-cyber-border hover:border-status-error transition-all duration-200 hover:bg-status-error/10"
                :title="t('session.clear')"
              >
                <i class="pi pi-times text-sm text-cyber-text-dim group-hover:text-status-error transition-colors"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="relative max-w-[1800px] mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Home View -->
      <div v-if="currentView === 'home'">
        <FileUpload v-if="!harStore.currentSession" @file-uploaded="handleFileUploaded" />

        <div v-else class="space-y-6">
          <SessionStats />
          <RequestsTable />
        </div>
      </div>

      <!-- Compare View -->
      <ComparisonView v-else-if="currentView === 'compare'" />

      <!-- Settings View -->
      <Settings v-else-if="currentView === 'settings'" @close="currentView = 'home'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'
import FileUpload from '@/components/FileUpload.vue'
import SessionStats from '@/components/SessionStats.vue'
import RequestsTable from '@/components/RequestsTable.vue'
import Settings from '@/components/Settings.vue'
import ComparisonView from '@/components/ComparisonView.vue'
import { appVersion } from '@/main.js'

const { t, locale } = useI18n()
const harStore = useHarStore()
const currentView = ref('home')

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
]

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

const handleFileUploaded = (session) => {
  console.log('HAR file uploaded successfully:', session)
}

const handleClearSession = () => {
  if (confirm(t('session.clearConfirm'))) {
    harStore.clearSession()
  }
}
</script>
