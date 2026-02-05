<template>
  <div class="max-w-3xl mx-auto">
    <div class="bg-cyber-bg-card rounded-xl border border-cyber-border overflow-hidden animate-slide-in-up">
      <!-- Header -->
      <div class="px-6 py-4 bg-cyber-bg-medium border-b border-cyber-border">
        <span class="font-mono text-sm text-cyber-text-dim">upload.har</span>
      </div>

      <!-- Content -->
      <div class="p-8">
        <div class="text-center mb-8 space-y-3">
          <i class="pi pi-cloud-upload text-5xl text-cyber-cyan"></i>
          <div>
            <h2 class="text-xl font-semibold text-cyber-text mb-1">
              {{ t('upload.title') }}
            </h2>
            <p class="text-cyber-text-dim text-sm">
              {{ t('upload.subtitle') }}
            </p>
          </div>
        </div>

        <!-- Drop zone -->
        <div
          class="relative group border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200"
          :class="[
            isDragging
              ? 'border-cyber-cyan bg-cyber-cyan/5'
              : 'border-cyber-border hover:border-cyber-text-dim'
          ]"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".har"
            class="hidden"
            @change="handleFileSelect"
          />

          <div v-if="!uploading" class="space-y-3">
            <i class="pi pi-file text-4xl transition-colors duration-200"
               :class="isDragging ? 'text-cyber-cyan' : 'text-cyber-text-dim group-hover:text-cyber-text'"></i>
            <div class="space-y-1">
              <p class="text-cyber-text font-medium">
                {{ isDragging ? t('upload.dropzoneActive') : t('upload.dropzone') }}
              </p>
              <p class="text-sm text-cyber-text-dim">
                {{ t('upload.browse') }} &middot; <span class="text-cyber-cyan font-medium">{{ t('upload.fileType') }}</span>
              </p>
            </div>
          </div>

          <div v-else class="space-y-3">
            <i class="pi pi-spin pi-spinner text-4xl text-cyber-cyan"></i>
            <div class="space-y-1">
              <p class="text-cyber-cyan font-medium">{{ t('upload.uploading') }}</p>
              <p class="text-sm text-cyber-text-dim">{{ t('upload.parsing') }}</p>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="mt-6 p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-status-error mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-semibold text-status-error">{{ t('upload.error') }}</p>
              <p class="text-sm text-cyber-text-dim mt-1">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="mt-6 p-5 bg-cyber-bg-medium rounded-lg border border-cyber-border">
          <p class="text-xs text-cyber-text-dim font-medium uppercase tracking-wider mb-3">
            {{ t('upload.howToTitle') }}
          </p>
          <div class="space-y-2 text-sm text-cyber-text-dim">
            <div class="flex items-start gap-3">
              <span class="text-cyber-cyan font-mono">1.</span>
              <span>{{ t('upload.howTo1') }}</span>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-cyber-cyan font-mono">2.</span>
              <span>{{ t('upload.howTo2') }}</span>
            </div>
            <div class="flex items-start gap-3">
              <span class="text-cyber-cyan font-mono">3.</span>
              <span>{{ t('upload.howTo3') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'

const { t } = useI18n()
const emit = defineEmits(['file-uploaded'])

const harStore = useHarStore()
const fileInput = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const error = ref(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    uploadFile(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) {
    if (!file.name.endsWith('.har')) {
      error.value = 'Please upload a .har file'
      return
    }
    uploadFile(file)
  }
}

const uploadFile = async (file) => {
  uploading.value = true
  error.value = null

  try {
    const session = await harStore.uploadHarFile(file)
    emit('file-uploaded', session)
  } catch (err) {
    error.value = err.response?.data?.detail || err.message || 'Failed to upload file'
  } finally {
    uploading.value = false
  }
}
</script>
