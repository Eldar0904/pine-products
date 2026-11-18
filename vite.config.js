import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createUsageApiMiddleware } from './usage-api.js'
import { createFeedbackMiddleware } from './feedback-api.js'

function usageApiPlugin(env) {
  const middleware = createUsageApiMiddleware(env)
  const feedback = createFeedbackMiddleware(env)
  return {
    name: 'pine-usage-api',
    configureServer(server) { server.middlewares.use(middleware); server.middlewares.use(feedback) },
    configurePreviewServer(server) { server.middlewares.use(middleware); server.middlewares.use(feedback) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), usageApiPlugin(env)],
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
  }
})
