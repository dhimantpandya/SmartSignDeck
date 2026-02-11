import { useEffect } from 'react'
import { useAuth } from './use-auth'
import { tokenStore } from '@/store/token'

/**
 * Hook to synchronize authentication state across browser tabs
 * 
 * Listens for localStorage changes and syncs logout events across tabs.
 * When a user logs out in one tab, all other tabs will automatically
 * detect the change and redirect to the login page.
 * 
 * Note: Uses window.location.href instead of useNavigate to avoid
 * requiring Router context, allowing it to be used anywhere.
 */
export const useCrossTabSync = () => {
    const { logout } = useAuth()

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            // Only respond to changes in OTHER tabs (storage event doesn't fire in current tab)

            // Case 1: Refresh token was removed (logout in another tab)
            if (event.key === 'refreshToken' && event.oldValue && !event.newValue) {
                console.log('[Cross-Tab Sync] Logout detected in another tab')

                // Skip if we are already logged out
                if (!tokenStore.getRefreshToken()) return

                // Clear local state WITHOUT calling backend logout again
                logout()

                // Force redirect using window.location
                window.location.href = '/sign-in'
            }

            // Case 3: New login in another tab (sync login state)
            if (event.key === 'refreshToken' && !event.oldValue && event.newValue) {
                console.log('[Cross-Tab Sync] Login detected in another tab')

                // Skip if we are already logged in with this token
                if (tokenStore.getRefreshToken() === event.newValue) return

                // 🛡️ Loop Protection: Prevent rapid sequential reloads
                const lastReload = sessionStorage.getItem('last_sync_reload')
                const now = Date.now()
                if (lastReload && (now - parseInt(lastReload)) < 5000) {
                    console.warn('[Cross-Tab Sync] Debouncing reload to prevent loop')
                    return
                }

                sessionStorage.setItem('last_sync_reload', now.toString())
                window.location.reload()
            }
        }

        // Add event listener for storage changes
        window.addEventListener('storage', handleStorageChange)

        // Cleanup on unmount
        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [logout])
}
