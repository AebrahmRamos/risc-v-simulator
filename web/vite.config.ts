import { defineConfig } from 'vite'

// Dynamically import the ESM-only plugin to avoid "ESM file cannot be loaded by require" errors
export default defineConfig(async () => {
  const reactPlugin = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [reactPlugin()],
    server: { port: 5173 }
  }
})
