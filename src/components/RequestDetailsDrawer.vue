<template>
  <Sidebar
    v-model:visible="isVisible"
    position="right"
    :modal="true"
    :dismissable="true"
    :showCloseIcon="true"
    :style="{ width: drawerWidth }"
    class="request-details-drawer"
    :pt="{
      root: { style: 'background: var(--cyber-bg-card) !important; border-left: 2px solid var(--cyber-border) !important;' },
      header: { style: 'background: var(--cyber-bg-medium) !important; border-bottom: 2px solid var(--cyber-border) !important;' },
      content: { style: 'background: var(--cyber-bg-card) !important;' }
    }"
    @hide="handleClose"
  >
    <template #header>
      <DrawerHeader v-if="fullEntry" :entry="fullEntry" :normalizedEntry="normalizedEntry" />
    </template>

    <div v-if="fullEntry" class="drawer-content">
      <TabView v-model:activeIndex="activeTabIndex" class="drawer-tabs">
        <TabPanel :header="t('drawer.tabs.headers')">
          <HeadersTab :entry="fullEntry" />
        </TabPanel>
        <TabPanel :header="t('drawer.tabs.payload')">
          <PayloadTab :entry="fullEntry" />
        </TabPanel>
        <TabPanel :header="t('drawer.tabs.response')">
          <ResponseTab :entry="fullEntry" />
        </TabPanel>
        <TabPanel :header="t('drawer.tabs.timing')">
          <TimingTab :entry="fullEntry" :normalizedEntry="normalizedEntry" />
        </TabPanel>
      </TabView>
    </div>

    <ResizeHandle @resize="onResize" />
  </Sidebar>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHarStore } from '@/stores/harStore'
import Sidebar from 'primevue/sidebar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DrawerHeader from './drawer/DrawerHeader.vue'
import HeadersTab from './drawer/HeadersTab.vue'
import PayloadTab from './drawer/PayloadTab.vue'
import ResponseTab from './drawer/ResponseTab.vue'
import TimingTab from './drawer/TimingTab.vue'
import ResizeHandle from './drawer/ResizeHandle.vue'

const { t } = useI18n()
const harStore = useHarStore()

const STORAGE_KEY_DRAWER_WIDTH = 'har_manager_drawer_width'
const DEFAULT_WIDTH = '50%'

const activeTabIndex = ref(0)
const drawerWidth = ref(DEFAULT_WIDTH)

// Load saved width from localStorage
const savedWidth = localStorage.getItem(STORAGE_KEY_DRAWER_WIDTH)
if (savedWidth) {
  drawerWidth.value = savedWidth
}

const isVisible = computed({
  get: () => harStore.selectedEntryId !== null,
  set: (value) => {
    if (!value) {
      harStore.clearSelection()
    }
  }
})

const normalizedEntry = computed(() => harStore.selectedEntry)
const fullEntry = computed(() => harStore.selectedEntryDetails)

const handleClose = () => {
  harStore.clearSelection()
}

const onResize = (newWidth) => {
  drawerWidth.value = newWidth
  localStorage.setItem(STORAGE_KEY_DRAWER_WIDTH, newWidth)
}

// Reset to Headers tab when a new entry is selected
watch(() => harStore.selectedEntryId, (newId) => {
  if (newId !== null) {
    activeTabIndex.value = 0
  }
})
</script>

<style scoped>
.drawer-content {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.drawer-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Drawer Sidebar Styling */
:deep(.p-sidebar) {
  background: var(--cyber-bg-card) !important;
  border-left: 2px solid var(--cyber-border) !important;
  box-shadow: -5px 0 30px rgba(0, 0, 0, 0.5) !important;
}

:deep(.p-sidebar-header) {
  background: var(--cyber-bg-medium) !important;
  border-bottom: 2px solid var(--cyber-border) !important;
  padding: 1.5rem !important;
}

:deep(.p-sidebar-content) {
  background: var(--cyber-bg-card) !important;
  padding: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.p-sidebar-close) {
  color: var(--cyber-cyan) !important;
}

:deep(.p-sidebar-close:hover) {
  background: var(--cyber-bg-card) !important;
  color: var(--cyber-lime) !important;
}

/* Tab Navigation Styling */
:deep(.p-tabview) {
  background: transparent !important;
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

:deep(.p-tabview-nav) {
  background: var(--cyber-bg-medium) !important;
  border-bottom: 2px solid var(--cyber-border) !important;
  padding: 0 1.5rem !important;
  flex-shrink: 0 !important;
}

:deep(.p-tabview-nav-content) {
  background: transparent !important;
}

:deep(.p-tabview-nav li) {
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
}

:deep(.p-tabview-nav-link) {
  color: var(--cyber-text-dim) !important;
  border: none !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 1rem 1.5rem !important;
  transition: all 0.2s !important;
  background: transparent !important;
  border-bottom: 3px solid transparent !important;
}

:deep(.p-tabview-nav-link:hover) {
  color: var(--cyber-cyan) !important;
  background: rgba(0, 255, 255, 0.05) !important;
  border-bottom-color: rgba(0, 255, 255, 0.3) !important;
}

:deep(.p-tabview-nav-link.p-highlight),
:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link),
:deep(.p-tabview-nav-link[aria-selected="true"]) {
  color: var(--cyber-cyan) !important;
  background: rgba(0, 255, 255, 0.1) !important;
  border-bottom: 3px solid var(--cyber-cyan) !important;
  box-shadow:
    0 0 10px rgba(0, 255, 255, 0.3),
    inset 0 -3px 0 0 var(--cyber-cyan) !important;
  font-weight: 700 !important;
}

:deep(.p-tabview-nav li.p-highlight) {
  background: transparent !important;
}

:deep(.p-tabview-panels) {
  background: transparent !important;
  padding: 0 !important;
  flex: 1 !important;
  overflow: auto !important;
}

:deep(.p-tabview-panel) {
  padding: 1.5rem !important;
}
</style>
