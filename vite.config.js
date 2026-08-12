import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createExecutiveApiMiddleware } from './executive-api.js'
import { createUsageApiMiddleware } from './usage-api.js'

function executiveApiPlugin(env) {
  const middleware = createExecutiveApiMiddleware(env)
  return {
    name: 'pine-executive-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

function usageApiPlugin(env) {
  const middleware = createUsageApiMiddleware(env)
  return {
    name: 'pine-usage-api',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), executiveApiPlugin(env), usageApiPlugin(env)],
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
  }
})
