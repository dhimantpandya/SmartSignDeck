import { ValidateEnv } from '@julr/vite-plugin-validate-env'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()], // Disabled ValidateEnv() due to 'Maximum call stack size exceeded' error
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: [
      'inclinational-louring-kolton.ngrok-free.dev',
      '.ngrok-free.dev'
    ],
    proxy: {
      '/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
