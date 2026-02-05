<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- HAR 1 Upload Zone -->
    <div class="space-y-4">
      <h3 class="text-lg font-mono uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
        <i class="pi pi-file"></i>
        {{ t('compare.har1') }}
      </h3>

      <div
        v-if="!session1"
        class="relative group"
        @dragover.prevent="isDragging1 = true"
        @dragleave="isDragging1 = false"
        @drop.prevent="handleDrop($event, 1)"
      >
        <input
          ref="fileInput1"
          type="file"
          accept=".har"
          class="hidden"
          @change="handleFileSelect($event, 1)"
        />

        <div
          class="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300"
          :class="isDragging1
            ? 'border-cyber-cyan bg-cyber-cyan/10 '
            : 'border-cyber-border bg-cyber-bg-card/30 hover:border-cyber-cyan/50 hover:bg-cyber-bg-card/50'"
          @click="$refs.fileInput1.click()"
        >
          <i class="pi pi-cloud-upload text-6xl mb-4 transition-colors"
             :class="isDragging1 ? 'text-cyber-cyan' : 'text-cyber-text-dim'"></i>

          <p class="text-cyber-text font-mono mb-2">
            {{ isDragging1 ? t('compare.dropHere') : t('compare.uploadPrompt') }}
          </p>
          <p class="text-cyber-text-dim text-sm font-mono">
            {{ t('upload.fileType') }}
          </p>
        </div>
      </div>

      <!-- Uploaded File Display -->
      <div v-else class="border border-cyber-border rounded-lg p-4 bg-cyber-bg-card/50 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <i class="pi pi-file text-cyber-cyan text-2xl"></i>
            <div class="flex-1 min-w-0">
              <p class="font-mono text-sm text-cyber-text truncate">{{ session1.filename }}</p>
              <p class="font-mono text-xs text-cyber-text-dim">
                {{ session1.entries.length }} {{ t('compare.requests') }}
              </p>
            </div>
          </div>
          <button
            @click="$emit('clear-slot', 1)"
            class="ml-2 px-3 py-2 bg-cyber-bg-card/50 border border-cyber-border hover:border-status-error rounded-lg transition-all duration-300 hover:bg-status-error/10"
            :title="t('compare.clear')"
          >
            <i class="pi pi-times text-cyber-text-dim hover:text-status-error transition-colors"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- HAR 2 Upload Zone -->
    <div class="space-y-4">
      <h3 class="text-lg font-mono uppercase tracking-wider text-cyber-magenta flex items-center gap-2">
        <i class="pi pi-file"></i>
        {{ t('compare.har2') }}
      </h3>

      <div
        v-if="!session2"
        class="relative group"
        @dragover.prevent="isDragging2 = true"
        @dragleave="isDragging2 = false"
        @drop.prevent="handleDrop($event, 2)"
      >
        <input
          ref="fileInput2"
          type="file"
          accept=".har"
          class="hidden"
          @change="handleFileSelect($event, 2)"
        />

        <div
          class="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300"
          :class="isDragging2
            ? 'border-cyber-magenta bg-cyber-magenta/10 '
            : 'border-cyber-border bg-cyber-bg-card/30 hover:border-cyber-magenta/50 hover:bg-cyber-bg-card/50'"
          @click="$refs.fileInput2.click()"
        >
          <i class="pi pi-cloud-upload text-6xl mb-4 transition-colors"
             :class="isDragging2 ? 'text-cyber-magenta' : 'text-cyber-text-dim'"></i>

          <p class="text-cyber-text font-mono mb-2">
            {{ isDragging2 ? t('compare.dropHere') : t('compare.uploadPrompt') }}
          </p>
          <p class="text-cyber-text-dim text-sm font-mono">
            {{ t('upload.fileType') }}
          </p>
        </div>
      </div>

      <!-- Uploaded File Display -->
      <div v-else class="border border-cyber-border rounded-lg p-4 bg-cyber-bg-card/50 backdrop-blur-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <i class="pi pi-file text-cyber-magenta text-2xl"></i>
            <div class="flex-1 min-w-0">
              <p class="font-mono text-sm text-cyber-text truncate">{{ session2.filename }}</p>
              <p class="font-mono text-xs text-cyber-text-dim">
                {{ session2.entries.length }} {{ t('compare.requests') }}
              </p>
            </div>
          </div>
          <button
            @click="$emit('clear-slot', 2)"
            class="ml-2 px-3 py-2 bg-cyber-bg-card/50 border border-cyber-border hover:border-status-error rounded-lg transition-all duration-300 hover:bg-status-error/10"
            :title="t('compare.clear')"
          >
            <i class="pi pi-times text-cyber-text-dim hover:text-status-error transition-colors"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  session1: {
    type: Object,
    default: null,
  },
  session2: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['upload', 'clear-slot'])

const fileInput1 = ref(null)
const fileInput2 = ref(null)
const isDragging1 = ref(false)
const isDragging2 = ref(false)

const handleFileSelect = (event, slot) => {
  const file = event.target.files[0]
  if (file && file.name.endsWith('.har')) {
    emit('upload', { file, slot })
  }
  // Reset input
  event.target.value = ''
}

const handleDrop = (event, slot) => {
  if (slot === 1) {
    isDragging1.value = false
  } else {
    isDragging2.value = false
  }

  const file = event.dataTransfer.files[0]
  if (file && file.name.endsWith('.har')) {
    emit('upload', { file, slot })
  }
}
</script>
