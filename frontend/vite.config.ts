import { ValidateEnv } from '@julr/vite-plugin-validate-env'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), ValidateEnv()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
