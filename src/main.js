import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import { useHarStore } from '@/stores/harStore'
import i18n from './i18n'

// Get app version from window or fallback
export const appVersion = window.__APP_VERSION__ || 'dev'

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Tailwind CSS
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(PrimeVue)

app.mount('#app')

// Load config on app startup
const harStore = useHarStore()
harStore.loadConfig()
