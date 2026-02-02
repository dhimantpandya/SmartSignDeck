import { authService } from '@/api'
import Loader from '@/components/loader'
import { useAuth } from '@/hooks/use-auth'
import { useCrossTabSync } from '@/hooks/use-cross-tab-sync'
import { Routes } from '@/utilities/routes'
import { useQuery } from '@tanstack/react-query'
import { FC, useMemo } from 'react'
import { RouterProvider, createBrowserRouter, redirect } from 'react-router-dom'
import GeneralError from './pages/errors/general-error'
import MaintenanceError from './pages/errors/maintenance-error'
import NotFoundError from './pages/errors/not-found-error'
import { tokenStore } from '@/store/token'

const Setup = () => {
  const routers = useMemo(
    () =>
      createBrowserRouter([
        // Root redirect based on auth state
        {
          path: '/',
          loader: () => {
            const refreshToken = tokenStore.getRefreshToken();
            return refreshToken ? redirect(Routes.DASHBOARD) : redirect(Routes.SIGN_IN);
          },
        },
        // ===== AUTH ROUTES =====
        {
          lazy: async () => {
            const { default: AuthLayout } = await import('@/components/auth-layout')
            const { NavSyncProvider } = await import('@/components/nav-sync-provider')
            return {
              Component: () => (
                <NavSyncProvider>
                  <AuthLayout />
                </NavSyncProvider>
              )
            }
          },
          children: [
            {
              path: Routes.SIGN_IN,
              lazy: async () => ({
                Component: (await import('./pages/auth/sign-in')).default,
              }),
              loader: () => {
                const refreshToken = tokenStore.getRefreshToken()
                if (refreshToken) {
                  return redirect(Routes.DASHBOARD)
                }
                return null
              },
            },
            {
              path: Routes.SIGN_UP,
              lazy: async () => ({
                Component: (await import('./pages/auth/sign-up')).default,
              }),
            },
            {
              path: Routes.FORGOT_PASSWORD,
              lazy: async () => ({
                Component: (await import('./pages/auth/forgot-password')).default,
              }),
            },
            {
              path: Routes.OTP,
              lazy: async () => ({
                Component: (await import('./pages/auth/otp')).default,
              }),
            },
            {
              path: Routes.GOOGLE_CALLBACK,
              lazy: async () => ({
                Component: (await import('./pages/auth/google-callback')).default,
              }),
            },
          ]
        },

        // ===== PROTECTED ROUTES (WITH APP SHELL) =====
        {
          path: '/',
          lazy: async () => {
            const AppShell = await import('@/components/app-shell')
            const { NavSyncProvider } = await import('@/components/nav-sync-provider')
            return {
              Component: () => (
                <NavSyncProvider>
                  <AppShell.default />
                </NavSyncProvider>
              )
            }
          },
          loader: () => {
            const refreshToken = tokenStore.getRefreshToken()
            if (!refreshToken) {
              return redirect(Routes.SIGN_IN)
            }
            return null
          },
          errorElement: <GeneralError />,
          children: [
            {
              path: Routes.DASHBOARD,
              lazy: async () => ({
                Component: (await import('./pages/dashboard')).default,
              }),
            },
            {
              path: Routes.USERS,
              lazy: async () => ({
                Component: (await import('./pages/users')).default,
              }),
            },
            {
              path: Routes.PROFILE,
              lazy: async () => ({
                Component: (await import('./pages/profile')).default,
              }),
            },
            {
              path: Routes.TEMPLATES,
              lazy: async () => ({
                Component: (await import('./pages/templates')).default,
              }),
            },
            {
              path: Routes.SCREENS,
              lazy: async () => ({
                Component: (await import('./pages/screens')).default,
              }),
            },
            {
              path: Routes.ANALYTICS,
              lazy: async () => ({
                Component: (await import('./pages/analytics')).default,
              }),
            },
            {
              path: Routes.COLLABORATION,
              lazy: async () => ({
                Component: (await import('./pages/collaboration')).default,
              }),
            },
            {
              path: Routes.ADMIN_COMPANIES,
              lazy: async () => ({
                Component: (await import('./pages/admin/companies')).default,
              }),
            },
            {
              path: Routes.RECYCLE_BIN,
              lazy: async () => ({
                Component: (await import('./pages/recycle-bin')).default,
              }),
            },
          ],
        },
        // ===== STANDALONE ROUTES (NO LAYOUT) =====
        {
          path: Routes.PLAYER,
          lazy: async () => ({
            Component: (await import('./pages/player')).default,
          }),
        },

        // ===== ERRORS =====
        { path: Routes.ERROR.GENERAL, Component: GeneralError },
        { path: Routes.ERROR.NOT_FOUND, Component: NotFoundError },
        { path: Routes.ERROR.MAINTENANCE, Component: MaintenanceError },
        { path: Routes.FALLBACK, Component: NotFoundError },
      ]),
    []
  )

  return <RouterProvider router={routers} />
}

const Router: FC = () => {
  const { login } = useAuth()

  // Enable cross-tab logout synchronization
  useCrossTabSync()

  const { isLoading } = useQuery({
    queryKey: ['auth-bootstrap'],
    queryFn: async () => {
      const refreshToken = tokenStore.getRefreshToken()
      if (!refreshToken) return true

      try {
        // 1. Check if access token is already valid (shared session)
        // If it is, we can skip refresh and just fetch user info
        if (tokenStore.isAccessTokenValid()) {
          console.log('[Router] Valid access token found. Skipping refresh.')
          const userInfoResponse = await authService.getUserInfo()
          login(userInfoResponse.user, refreshToken)
          return true
        }

        // 2. Wait if another tab is already refreshing
        if (tokenStore.getRefreshingStatus()) {
          console.log('[Router] Another tab is refreshing. Waiting...')
          await tokenStore.waitForRefresh()

          if (tokenStore.isAccessTokenValid()) {
            const userInfoResponse = await authService.getUserInfo()
            login(userInfoResponse.user, tokenStore.getRefreshToken())
            return true
          }
        }

        // 3. Perform refresh
        const response = await authService.getAccessToken(refreshToken)
        const { tokens } = response
        if (!tokens || !tokens.access) {
          throw new Error('Invalid token response')
        }

        tokenStore.setAccessToken(tokens.access)
        const newRefreshToken = tokens.refresh ? tokens.refresh.token : refreshToken

        // 4. Get user info
        const userInfoResponse = await authService.getUserInfo()
        login(userInfoResponse.user, newRefreshToken)
      } catch (error) {
        console.error('Auth bootstrap failed:', error)

        // Double check if it really failed or if another tab refreshed while we were waiting
        if (!tokenStore.isAccessTokenValid()) {
          tokenStore.clearTokens()
        }
      }
      return true
    },
  })

  if (isLoading) return <Loader />
  return <Setup />
}

export default Router
