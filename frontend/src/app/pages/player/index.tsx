import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiService } from '@/api'
import Loader from '@/components/loader'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { toast } from '@/components/ui/use-toast'
import { io } from 'socket.io-client'

export default function ScreenPlayer() {
    const { screenId } = useParams()
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Get Secret Key from URL (?key=...)
    // Get Secret Key from URL (?key=...)
    const query = new URLSearchParams(window.location.search)
    let secretKey = query.get('key')

    // FIX: Handle known key corruption (insertion of "673f")
    if (secretKey && secretKey.length > 32 && secretKey.includes('673f')) {
        console.warn('[Player] Sanitizing corrupted secretKey:', secretKey)
        secretKey = secretKey.replace('673f', '')
    }

    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date()
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    })

    // Debug State
    const [showDebug, setShowDebug] = useState(true) // Default to true for user demo

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'd') setShowDebug(prev => !prev)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Update window size on resize
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Update time every minute to check for schedule changes
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
            setCurrentTime(timeStr)
        }, 30000) // Check every 30s
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const STORAGE_KEY = `screen_cache_${screenId}`;

        const fetchPlaybackData = async (retryCount = 0) => {
            try {
                if (retryCount === 0) setIsLoading(true)

                // Fetch screen with optional key
                const screen = await apiService.get<any>(`/v1/screens/${screenId}`, {
                    params: secretKey ? { key: secretKey } : {}
                })
                setData(screen)
                setError(null)

                // Cache successful response
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    data: screen,
                    timestamp: Date.now()
                }));

                // Report online status
                await apiService.post(`/v1/screens/${screenId}/ping`, {})
            } catch (err: any) {
                console.error(`Playback fetch attempt ${retryCount + 1} failed:`, err)

                // Try to load from cache on failure
                const cached = localStorage.getItem(STORAGE_KEY);
                if (cached) {
                    const { data: cachedData } = JSON.parse(cached);
                    setData(cachedData);
                    setError(null);
                    /* 
                    toast({
                        title: "Offline Mode",
                        description: "Running on cached content due to network issues.",
                        variant: "destructive"
                    });
                    */
                } else if (retryCount < 3) {
                    // Exponential backoff retry
                    const delay = Math.pow(2, retryCount) * 1000;
                    setTimeout(() => fetchPlaybackData(retryCount + 1), delay);
                } else {
                    setError(err.message || 'Failed to load screen data')
                }
            } finally {
                if (retryCount === 0) setIsLoading(false)
            }
        }

        fetchPlaybackData()

        // 5-minute auto-refresh and ping (backup)
        const interval = setInterval(() => fetchPlaybackData(), 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [screenId])

    // Socket.io integration for real-time updates
    useEffect(() => {
        if (!screenId) return

        const socket = io(import.meta.env.VITE_APP_URL || 'http://localhost:5000')

        socket.on('connect', () => {
            console.log('Connected to socket server')
            socket.emit('join_screen', screenId)
        })

        socket.on('content_update', (data) => {
            console.log('Real-time content update received:', data)
            // Call the same fetch logic to refresh data
            const fetchPlaybackData = async () => {
                try {
                    const screen = await apiService.get<any>(`/v1/screens/${screenId}`, {
                        params: secretKey ? { key: secretKey } : {}
                    })
                    setData(screen)
                } catch (err) {
                    console.error('Failed to sync real-time update:', err)
                }
            }
            fetchPlaybackData()
        })

        socket.on('screen_command', (data) => {
            if (data.command === 'force_refresh') {
                window.location.reload()
            }
        })

        return () => {
            socket.disconnect()
        }
    }, [screenId])

    // Monitor fullscreen changes
    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handleFsChange)
        return () => document.removeEventListener('fullscreenchange', handleFsChange)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') toggleFullscreen()
            if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Handle Fullscreen toggle function (not a hook, but used by them)
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                toast({ title: "Error entering fullscreen", description: err.message, variant: "destructive" })
            })
        } else {
            document.exitFullscreen()
        }
    }

    if (isLoading) {
        return (
            <div className='flex h-screen w-full flex-col items-center justify-center bg-black text-white'>
                <Loader />
                <p className='mt-4 animate-pulse text-sm font-medium tracking-widest uppercase'>Initializing Player...</p>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className='flex h-screen w-full flex-col items-center justify-center bg-red-950 text-white p-10 text-center'>
                <IconAlertTriangle size={64} className='mb-6 text-red-500' />
                <h1 className='text-3xl font-bold mb-2'>Playback Error</h1>
                <p className='text-red-200 opacity-80 max-w-md'>{error}</p>
                <p className='mt-8 text-xs opacity-40 italic'>Screen ID: {screenId}</p>
            </div>
        )
    }

    const determineActiveContent = () => {
        const { defaultContent, schedules } = data
        const now = new Date()
        const currentDayOfWeek = now.getDay() // 0-6
        const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD for simple comparison

        // 1. Filter valid schedules based on Time, Day, and Date
        const validSchedules = (schedules || []).filter((s: any) => {
            // Time Check
            if (currentTime < s.startTime || currentTime > s.endTime) return false

            // Date Range Check
            if (s.startDate && currentDate < new Date(s.startDate).toISOString().split('T')[0]) return false
            if (s.endDate && currentDate > new Date(s.endDate).toISOString().split('T')[0]) return false

            // Day of Week Check
            if (s.daysOfWeek && s.daysOfWeek.length > 0 && !s.daysOfWeek.includes(currentDayOfWeek)) return false

            return true
        })

        // 2. Sort by Priority (Descending)
        // If priority is missing, treat as 0
        validSchedules.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0))

        const activeSchedule = validSchedules[0]

        if (activeSchedule) {
            // MERGE LOGIC: Start with default content, then overlay schedule content
            // but ONLY for zones that actually have items in their playlist.
            const mergedContent = { ...defaultContent }

            Object.keys(activeSchedule.content || {}).forEach(zoneId => {
                const scheduleZoneContent = activeSchedule.content[zoneId]
                // Check local playlist OR linked playlist
                const hasPlaylist = (scheduleZoneContent?.playlist && scheduleZoneContent.playlist.length > 0) ||
                    (scheduleZoneContent?.sourceType === 'playlist' && scheduleZoneContent?.playlistId)

                if (hasPlaylist) {
                    mergedContent[zoneId] = scheduleZoneContent
                }
            })

            return { content: mergedContent, source: 'schedule', rule: activeSchedule }
        }

        return { content: defaultContent, source: 'default', rule: null }
    }

    const { templateId: template } = data
    const { content, source, rule } = determineActiveContent()
    const resolution = template?.resolution || '1920x1080'
    const [targetWidth, targetHeight] = resolution.split('x').map(Number)

    // Calculate scale to fit within viewport while maintaining aspect ratio
    const scale = Math.min(windowSize.width / targetWidth, windowSize.height / targetHeight)


    // --- GAP FILLING & RESPONSIVE SNAPPING LOGIC ---
    // Fixes "black lines" by snapping zones to edges and each other
    // NEW: Intelligent Gap Filling - active zones "eat" neighboring empty text zones
    const optimizedZones = (() => {
        if (!data?.templateId?.zones) return []

        // Deep copy
        let zones = data.templateId.zones.map((z: any) => ({ ...z }))
        const THRESHOLD = 5 // Reduced from 25 to respect intentional gaps
        const EMPTY_FILLING_THRESHOLD = 10 // Reduced from 500 to prevent aggressive expansion

        // Helper to check if a zone is an "empty text zone"
        const isEmptyTextZone = (z: any) => {
            if (z.type !== 'text') return false
            const zoneContent = content[z.id]
            return !zoneContent?.text || zoneContent.text.trim() === ''
        }

        // 1. Snap to Canvas Borders
        zones.forEach((z: any) => {
            if (isEmptyTextZone(z)) return // Skip stretching the empty zone itself

            // Left Snap
            if (z.x < THRESHOLD) {
                z.width += z.x
                z.x = 0
            }
            // Top Snap
            if (z.y < THRESHOLD) {
                z.height += z.y
                z.y = 0
            }
            // Right Snap
            if (Math.abs(targetWidth - (z.x + z.width)) < THRESHOLD) {
                z.width = targetWidth - z.x
            }
            // Bottom Snap
            if (Math.abs(targetHeight - (z.y + z.height)) < THRESHOLD) {
                z.height = targetHeight - z.y
            }
        })

        // 2. Intra-Zone Gap Filling (Snap to neighbors)
        zones.forEach((z1: any) => {
            if (isEmptyTextZone(z1)) return // Active zones grow INTO empty zones

            zones.forEach((z2: any) => {
                if (z1 === z2) return

                // Check Horizontal Gap (z1 and z2 overlap vertically)
                const yOverlap = Math.min(z1.y + z1.height, z2.y + z2.height) - Math.max(z1.y, z2.y)
                if (yOverlap > 10) {
                    const isEmpty = isEmptyTextZone(z2)
                    const limit = isEmpty ? EMPTY_FILLING_THRESHOLD : THRESHOLD

                    // z1 is to the left of z2
                    const gapRight = z2.x - (z1.x + z1.width)
                    if (gapRight >= 0 && gapRight < limit) {
                        z1.width += gapRight + (isEmpty ? z2.width : 0)
                    }
                    // z1 is to the right of z2
                    const gapLeft = z1.x - (z2.x + z2.width)
                    if (gapLeft >= 0 && gapLeft < limit) {
                        z1.x -= (gapLeft + (isEmpty ? z2.width : 0))
                        z1.width += (gapLeft + (isEmpty ? z2.width : 0))
                    }
                }

                // Check Vertical Gap (z1 and z2 overlap horizontally)
                const xOverlap = Math.min(z1.x + z1.width, z2.x + z2.width) - Math.max(z1.x, z2.x)
                if (xOverlap > 10) {
                    const isEmpty = isEmptyTextZone(z2)
                    const limit = isEmpty ? EMPTY_FILLING_THRESHOLD : THRESHOLD

                    // z1 is above z2
                    const gapBelow = z2.y - (z1.y + z1.height)
                    if (gapBelow >= 0 && gapBelow < limit) {
                        z1.height += gapBelow + (isEmpty ? z2.height : 0)
                    }
                    // z1 is below z2
                    const gapAbove = z1.y - (z2.y + z2.height)
                    if (gapAbove >= 0 && gapAbove < limit) {
                        z1.y -= (gapAbove + (isEmpty ? z2.height : 0))
                        z1.height += (gapAbove + (isEmpty ? z2.height : 0))
                    }
                }
            })
        })

        // 3. Final Pass: Hide empty text zones so they don't render black boxes
        return zones.filter((z: any) => !isEmptyTextZone(z))
    })()

    return (
        <div className='fixed inset-0 bg-black overflow-hidden'>

            {/* Debug Overlay */}
            {showDebug && (
                <div className="absolute top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg border border-white/20 shadow-xl max-w-sm font-mono text-xs backdrop-blur-sm pointer-events-none select-none">
                    <h3 className="font-bold border-b border-white/20 pb-2 mb-2 text-sm text-green-400">⚡ Smart Logic Debugger</h3>

                    <div className="space-y-3">
                        {/* Schedule Status */}
                        <div className={`p-2 rounded ${source === 'schedule' ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-white/5'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="text-orange-300 font-bold">1. Schedule (Time)</span>
                                {source === 'schedule' && <span className="text-orange-400">ACTIVE</span>}
                            </div>
                            <div className="pl-2 border-l-2 border-white/10">
                                <div className="mb-1">Time: {currentTime}</div>
                                <div>Current Rule: {source === 'schedule' ? rule?.name : 'Inactive'}</div>
                            </div>
                        </div>
                        {/* Snap Status */}
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 mt-2">
                            <div className="text-blue-300 font-bold mb-1">2. Auto-Layout (Fixed)</div>
                            <div className="opacity-70">Zones processed: {optimizedZones.length}</div>
                            <div className="opacity-70">Gap Snapping: Active</div>
                        </div>

                        <div className="text-[10px] text-center opacity-40 pt-2 border-t border-white/10">
                            Press 'D' to toggle this menu
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Toggle Overlay (visible on hover or when not fullscreen) */}
            <div className={`absolute top-4 right-4 z-50 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-black/50 border-white/20 text-white hover:bg-white/20"
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
                </Button>
            </div>

            <div
                className='absolute top-1/2 left-1/2 bg-black'
                style={{
                    width: `${targetWidth}px`,
                    height: `${targetHeight}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center'
                }}
            >
                {optimizedZones.map((zone: any) => {
                    const zoneContent = content[zone.id]
                    return (
                        <div
                            key={zone.id}
                            className='absolute overflow-hidden'
                            style={{
                                left: `${zone.x}px`,
                                top: `${zone.y}px`,
                                width: `${zone.width}px`,
                                height: `${zone.height}px`,
                            }}
                        >
                            <ZoneRenderer
                                zone={zone}
                                content={zoneContent}
                                screenId={data.id}
                                templateId={data.templateId?.id || data.templateId?._id}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


function ZoneRenderer({ zone, content, screenId, templateId }: { zone: any, content: any, screenId?: string, templateId?: string }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [hasError, setHasError] = useState(false)

    // Reset error when item changes
    useEffect(() => {
        setHasError(false)
        setCurrentIndex(0)
    }, [content])

    // --- TEXT ZONE HANDLER ---
    if (zone.type === 'text') {
        const style = content?.style || {}
        // ... (existing text logic remains same)
        const [dynamicColor, setDynamicColor] = useState(style.color || '#fff')
        const [animIndex, setAnimIndex] = useState(0)

        useEffect(() => {
            const sequence = content?.colorSequence
            if (!sequence || sequence.length === 0) {
                setDynamicColor(style.color || '#fff')
                return
            }
            const currentFrame = sequence[animIndex]
            if (!currentFrame) {
                setAnimIndex(0)
                return
            }
            setDynamicColor(currentFrame.color)
            const timer = setTimeout(() => {
                setAnimIndex((prev) => (prev + 1) % sequence.length)
            }, (currentFrame.duration || 5) * 1000)
            return () => clearTimeout(timer)
        }, [content, animIndex, style.color])

        const cssStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: style.textAlign === 'left' || style.textAlign === 'start' ? 'flex-start' :
                style.textAlign === 'right' || style.textAlign === 'end' ? 'flex-end' : 'center',
            backgroundColor: style.backgroundColor || 'transparent',
            color: dynamicColor,
            transition: 'color 1s ease-in-out',
            fontFamily: style.fontFamily || 'sans-serif',
            fontSize: `${style.fontSize || 48}px`,
            fontWeight: style.fontWeight || 'normal',
            fontStyle: style.fontStyle || 'normal',
            padding: `${style.padding || 0}px`,
            textAlign: (style.textAlign as any) || 'center',
            lineHeight: style.lineHeight || 1.2,
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            wordBreak: 'break-word',
            textShadow: style.shadowColor ? `${style.shadowOffsetX || 0}px ${style.shadowOffsetY || 0}px ${style.shadowBlur || 0}px ${style.shadowColor}` : 'none',
            WebkitTextStroke: style.strokeWidth ? `${style.strokeWidth}px ${style.strokeColor || 'transparent'}` : 'none',
            zIndex: 1,
        }

        return (
            <div style={cssStyle}>
                {content?.text || ''}
            </div>
        )
    }

    // --- PRIORITY & FALLBACK LOGIC ---
    // Start with the primary playlist (linked or local)
    // Fallback to simpler 'src' if playlist is empty or if we are in error state and playlist was the only content.

    // 1. Determine the active playlist based on sourceType priority
    let playlist = content?.playlist || []

    // NEW: Apply strict type-based filtering for image/video only zones
    if (zone.type === 'image') {
        playlist = playlist.filter((item: any) => item.type === 'image')
    } else if (zone.type === 'video') {
        playlist = playlist.filter((item: any) => item.type === 'video')
    }

    // If we have an ERROR and there is a src available, we can try to fallback to it
    // But usually, we only fallback if the playlist is actually empty.
    const hasItems = playlist && playlist.length > 0
    const fallbackSrc = content?.src

    // If no items in playlist, try to use the legacy/default 'src'
    if (!hasItems && fallbackSrc) {
        // Respect strict filtering for the default 'src' too
        const isImage = fallbackSrc.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
        const isVideo = fallbackSrc.match(/\.(mp4|mov|webm)$/i)

        if (zone.type === 'mixed' ||
            (zone.type === 'image' && isImage) ||
            (zone.type === 'video' && isVideo)) {
            playlist = [{ url: fallbackSrc, type: isVideo ? 'video' : 'image', duration: 10 }]
        }
    }

    useEffect(() => {
        if (!playlist || playlist.length <= 1) return

        const currentItem = playlist[currentIndex]
        const duration = (currentItem?.duration || 10) * 1000

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length)
        }, duration)

        return () => clearTimeout(timer)
    }, [currentIndex, playlist])

    // Proof of Play Logging remains same...
    useEffect(() => {
        if (!playlist || playlist.length === 0 || !screenId || !templateId) return
        const item = playlist[currentIndex]
        const startTime = new Date()
        const logPlayback = async (endTime: Date) => {
            try {
                const typeToLog = item?.type || zone.type
                if (zone.type === 'text') return
                const duration = (endTime.getTime() - startTime.getTime()) / 1000
                await apiService.post('/v1/playback-logs', {
                    screenId, templateId, zoneId: zone.id,
                    contentUrl: item.url, contentType: typeToLog,
                    startTime, endTime, duration,
                    secretKey // Pass key for auth
                })
            } catch (err) { }
        }
        return () => { logPlayback(new Date()) }
    }, [currentIndex, playlist, screenId, templateId, zone.id, zone.type])

    if (!playlist || playlist.length === 0) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center bg-gray-900 border border-gray-700 p-4 text-center'>
                <IconAlertTriangle size={32} className='mb-2 text-gray-500' />
                <p className='text-xs text-gray-400 font-mono'>No Content</p>
                <p className='text-[10px] text-gray-600'>{zone.id}</p>
            </div>
        )
    }

    const item = playlist[currentIndex]

    // ERROR HANDLER WITH FALLBACK
    if (hasError) {
        // If we are showing a playlist and it failed, and we have a fallbackSrc, we COULD try to show that.
        // But for now, just show error if everything failed.
        return (
            <div className='flex h-full w-full flex-col items-center justify-center bg-red-950/50 border border-red-900 p-4 text-center anim-pulse'>
                <IconAlertTriangle size={32} className='mb-2 text-red-500' />
                <p className='text-xs text-red-400 font-bold'>Playback Error</p>
                <p className='text-[10px] text-red-300/50 truncate max-w-full px-2'>{item?.url || 'Unknown'}</p>
            </div>
        )
    }

    if (!item) return null

    const mediaType = item.type || zone.type

    return (
        <div className='w-full h-full bg-black relative'>
            {mediaType === 'video' ? (
                <video
                    key={item.url}
                    src={item.url}
                    autoPlay muted playsInline
                    loop={playlist.length === 1}
                    className='h-full w-full object-cover'
                    onError={() => setHasError(true)}
                    onEnded={() => {
                        if (playlist.length > 1) {
                            setCurrentIndex((prev) => (prev + 1) % playlist.length)
                        }
                    }}
                />
            ) : (
                <img
                    src={item.url}
                    alt=""
                    className='h-full w-full object-cover animate-in fade-in duration-500'
                    onError={() => setHasError(true)}
                />
            )}
        </div>
    )
}

