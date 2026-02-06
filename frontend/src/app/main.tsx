
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import '@/app/index.css'
import Router from './router'
import ErrorBoundary from '@/components/error-boundary'
import { tokenStore } from '@/store/token'

// Clear any stuck refresh status from previous sessions
tokenStore.forceClearRefreshStatus();

const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme='light' storageKey='my-ui-theme'>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router />
        <Toaster />
      </ErrorBoundary>
    </QueryClientProvider>
  </ThemeProvider>
)

// Remove loading overlay after app start
const overlay = document.getElementById('app-loading-overlay');
if (overlay) {
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.5s ease';
  setTimeout(() => overlay.remove(), 500);
}
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
