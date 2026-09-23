import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export const createAppConfig = (appTarget) =>
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@app-router': fileURLToPath(
          new URL(`./src/router/${appTarget}Router.jsx`, import.meta.url),
        ),
      },
    },
    build: {
      outDir: `dist/${appTarget}`,
      emptyOutDir: true,
    },
    server: {
      port: appTarget === 'admin' ? 5174 : 5173,
      strictPort: true,
    },
    preview: {
      port: appTarget === 'admin' ? 4174 : 4173,
      strictPort: true,
    },
  })

// 기본 개발 서버와 빌드는 일반 사용자 앱을 대상으로 한다.
export default createAppConfig('user')
