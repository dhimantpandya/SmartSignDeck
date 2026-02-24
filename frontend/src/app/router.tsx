import { authService } from '@/api'
import Loader from '@/components/loader'
import { useAuth } from '@/hooks/use-auth'
import { useCrossTabSync } from '@/hooks/use-cross-tab-sync'
import { Routes } from '@/utilities/routes'
import { useQuery } from '@tanstack/react-query'
import { FC, useMemo } from 'react'
import { RouterProvider, createBrowserRouter, redirect, Navigate } from 'react-router-dom'
import GeneralError from './pages/errors/general-error'
import MaintenanceError from './pages/errors/maintenance-error'
import NotFoundError from './pages/errors/not-found-error'
import { tokenStore } from '@/store/token'

const Setup = () => {
  const routers = useMemo(
    () =>
      createBrowserRouter([
        // Root route
        {
          path: Routes.LANDING,
          lazy: async () => ({
            Component: (await import('./pages/landing')).default,
          }),
          loader: () => {
            const refreshToken = tokenStore.getRefreshToken();
            if (refreshToken) {
              return redirect(Routes.DASHBOARD);
            }
            return null;
          },
        },
        {
          path: Routes.ABOUT_US,
          lazy: async () => ({
            Component: (await import('./pages/landing/about-us')).default,
          }),
        },
        {
          path: Routes.CONTACT_US,
          lazy: async () => ({
            Component: (await import('./pages/landing/contact-us')).default,
          }),
        },
        {
          path: Routes.PRIVACY_POLICY,
          lazy: async () => ({
            Component: (await import('./pages/landing/privacy-policy')).default,
          }),
        },
        {
          path: Routes.TERMS_OF_SERVICE,
          lazy: async () => ({
            Component: (await import('./pages/landing/terms-of-service')).default,
          }),
        },
        {
          path: Routes.INDUSTRIES,
          lazy: async () => ({
            Component: (await import('./pages/landing/industries')).default,
          }),
        },
        {
          path: Routes.DIRECT_MANAGEMENT,
          lazy: async () => ({
            Component: (await import('./pages/landing/direct-management')).default,
          }),
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
            {
              path: Routes.INVITED,
              lazy: async () => ({
                Component: (await import('./pages/auth/invited')).default,
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
            const { NotificationProvider } = await import('@/components/nav-notification-provider')
            return {
              Component: () => (
                <NavSyncProvider>
                  <NotificationProvider>
                    <AppShell.default />
                  </NotificationProvider>
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
              path: '/dashboard/templates',
              element: <Navigate to={Routes.TEMPLATES} replace />,
            },
            {
              path: '/dashboard/screens',
              element: <Navigate to={Routes.SCREENS} replace />,
            },
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
              path: '/screens/:id?',
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
              path: Routes.PLAYLISTS,
              lazy: async () => ({
                Component: (await import('./pages/playlists')).default,
              }),
            },
            {
              path: Routes.COLLABORATION,
              lazy: async () => ({
                Component: (await import('./pages/collaboration')).default,
              }),
            },
            {
              path: Routes.ADMIN_REQUESTS,
              lazy: async () => ({
                Component: (await import('./pages/admin-requests')).default,
              }),
            },
            {
              path: Routes.RECYCLE_BIN,
              lazy: async () => ({
                Component: (await import('./pages/recycle-bin')).default,
              }),
            },
            {
              path: Routes.ADMIN_COMPANIES,
              lazy: async () => ({
                Component: (await import('./pages/admin/companies')).default,
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
        // ===== BACKWARD COMPATIBILITY =====
        {
          path: '/verify-otp',
          element: <Navigate to={Routes.OTP} replace />,
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
    staleTime: Infinity, // 🛡️ Never refetch automatically - only runs once per app load
    gcTime: Infinity,
    refetchOnWindowFocus: false, // 🛡️ Prevent loops triggered by focus changes
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
