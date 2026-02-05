<template>
  <div
    class="resize-handle"
    @mousedown="startResize"
    :class="{ 'is-resizing': isResizing }"
  >
    <div class="resize-indicator">
      <i class="pi pi-chevron-left"></i>
      <i class="pi pi-chevron-right"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['resize'])

const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

const MIN_WIDTH_PERCENT = 30
const MAX_WIDTH_PERCENT = 80

const startResize = (e) => {
  isResizing.value = true
  startX.value = e.clientX

  // Get current sidebar width
  const sidebar = e.target.closest('.p-sidebar')
  if (sidebar) {
    startWidth.value = sidebar.offsetWidth
  }

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)

  // Prevent text selection during resize
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ew-resize'
}

const handleResize = (e) => {
  if (!isResizing.value) return

  const delta = startX.value - e.clientX
  const newWidth = startWidth.value + delta

  // Calculate as percentage of viewport width
  const viewportWidth = window.innerWidth
  const widthPercent = (newWidth / viewportWidth) * 100

  // Constrain to min/max
  const constrainedPercent = Math.max(
    MIN_WIDTH_PERCENT,
    Math.min(MAX_WIDTH_PERCENT, widthPercent)
  )

  emit('resize', `${constrainedPercent}%`)
}

const stopResize = () => {
  isResizing.value = false

  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)

  // Restore normal cursor and selection
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})
</script>

<style scoped>
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.resize-handle:hover,
.resize-handle.is-resizing {
  background: rgba(0, 255, 255, 0.1);
}

.resize-handle::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--cyber-border);
  transition: background 0.2s;
}

.resize-handle:hover::before,
.resize-handle.is-resizing::before {
  background: var(--cyber-cyan);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.resize-indicator {
  display: none;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  color: var(--cyber-cyan);
  font-size: 0.625rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.resize-handle:hover .resize-indicator,
.resize-handle.is-resizing .resize-indicator {
  display: flex;
  opacity: 1;
}
</style>
