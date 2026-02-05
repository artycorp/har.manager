/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber': {
          'bg-dark': '#09090b',
          'bg-medium': '#18181b',
          'bg-card': '#27272a',
          'border': '#3f3f46',
          'cyan': '#6366f1',
          'magenta': '#8b5cf6',
          'lime': '#22c55e',
          'yellow': '#eab308',
          'orange': '#f59e0b',
          'text': '#fafafa',
          'text-dim': '#a1a1aa',
        },
        'timing': {
          'dns': '#3b82f6',
          'connect': '#8b5cf6',
          'send': '#22c55e',
          'wait': '#f59e0b',
          'receive': '#ec4899',
          'ssl': '#a855f7',
        },
        'status': {
          'success': '#22c55e',
          'info': '#3b82f6',
          'redirect': '#3b82f6',
          'warning': '#f59e0b',
          'client-error': '#f59e0b',
          'error': '#ef4444',
          'critical': '#dc2626',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
