import React, { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { tokenStore } from '@/store/token'
import { Routes } from '@/utilities/routes'

const NAV_SYNC_CHANNEL = 'smart_sign_deck_nav_sync'

interface NavSyncProviderProps {
    children: React.ReactNode
}

export const NavSyncProvider: React.FC<NavSyncProviderProps> = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
    const isNavigatingFromSync = useRef(false)

    // Initialize BroadcastChannel
    useEffect(() => {
        broadcastChannelRef.current = new BroadcastChannel(NAV_SYNC_CHANNEL)

        const handleMessage = (event: MessageEvent) => {
            const { pathname, search, state } = event.data

            const currentFullUrl = location.pathname + location.search
            const targetFullUrl = pathname + search

            if (currentFullUrl !== targetFullUrl) {
                const hasToken = !!tokenStore.getRefreshToken()

                // RECEIVING GUARD 1: 
                // If we receive a sync to a protected page (e.g. Dashboard) but we don't have a token,
                // it means we're in the middle of an auth sync. Ignore it and wait for bootstrap reload.
                const isTargetProtected = targetFullUrl.includes(Routes.DASHBOARD)
                if (isTargetProtected && !hasToken) {
                    console.log('[NavSync] Ignoring protected sync - no token yet')
                    return
                }

                // RECEIVING GUARD 2 (LOGOUT PROTECTION):
                // If we receive a sync TO an auth page (Sign-In/Up) but we STILL have a token,
                // it means the other tab might have failed a refresh race. DO NOT follow it to logout.
                const isTargetAuth = targetFullUrl.includes(Routes.SIGN_IN) || targetFullUrl.includes(Routes.SIGN_UP)
                if (isTargetAuth && hasToken) {
                    console.log('[NavSync] Ignoring auth sync - we still have a valid token')
                    return
                }

                console.log('[NavSync] Received navigation sync:', targetFullUrl)
                isNavigatingFromSync.current = true
                navigate(targetFullUrl, { state, replace: true })
                // Reset the flag after a short delay or in the next effect cycle
                setTimeout(() => {
                    isNavigatingFromSync.current = false
                }, 100)
            }
        }

        broadcastChannelRef.current.onmessage = handleMessage

        return () => {
            broadcastChannelRef.current?.close()
        }
    }, [navigate, location.pathname, location.search])

    // Broadcast navigation changes
    useEffect(() => {
        if (isNavigatingFromSync.current) return

        const fullUrl = location.pathname + location.search

        // BROADCASTING GUARD:
        // If we're redirecting TO Sign-In but we have a token, it's likely a transient guard failure
        // during auth bootstrap or sync. DO NOT BROADCAST this to other tabs.
        const isRedirectingToAuth = fullUrl.includes(Routes.SIGN_IN) || fullUrl.includes(Routes.SIGN_UP)
        const hasToken = !!tokenStore.getRefreshToken()

        if (isRedirectingToAuth && hasToken) {
            console.log('[NavSync] Skipping auth redirect broadcast - user has token')
            return
        }

        console.log('[NavSync] Broadcasting navigation:', fullUrl)

        broadcastChannelRef.current?.postMessage({
            pathname: location.pathname,
            search: location.search,
            state: location.state,
        })
    }, [location])

    return <>{children}</>
}
