import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { apiService } from '@/api'
import Loader from '@/components/loader'
import { IconAlertTriangle, IconVolume, IconVolumeOff, IconMinimize, IconMaximize, IconDownload, IconDeviceTv } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { io } from 'socket.io-client'

/**
 * Normalize a Cloudinary video URL to ensure browser compatibility.
 * Device uploads (MOV, HEVC, etc.) need vc_auto transformation to become
 * web-playable H.264/MP4. Non-Cloudinary URLs are returned as-is.
 */
function normalizeVideoUrl(url: string): string {
    if (!url) return url
    // Only transform Cloudinary video URLs
    if (!url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) return url
    // Already has a transformation (e.g. vc_auto) - skip
    if (url.includes('/vc_auto/') || url.includes('vc_auto,')) return url
    // Inject vc_auto transformation after /upload/
    return url.replace('/video/upload/', '/video/upload/vc_auto/')
}

export default function ScreenPlayer() {
    const { screenId } = useParams()
    const [searchParams] = useSearchParams()
    const hideClockParam = searchParams.get('hideClock') === 'true'
    const hideControlsParam = searchParams.get('hideControls') === 'true'

    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isMuted, setIsMuted] = useState(true)

    // Get Secret Key from URL (?key=...)
    // Get Secret Key from URL (?key=...)
    const query = new URLSearchParams(window.location.search)
    let secretKey = query.get('key')

    // FIX: Handle known key corruption (insertion of "673f")
    if (secretKey && secretKey.length > 32 && secretKey.includes('673f')) {
        console.warn('[Player] Sanitizing corrupted secretKey:', secretKey)
        secretKey = secretKey.replace('673f', '')
    }

    const userId = query.get('userId')

    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date()
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    })

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

        // Safety: Force stop loading after 15 seconds to prevent white screen
        const safetyTimer = setTimeout(() => {
            setIsLoading(false)
        }, 15000)

        const fetchPlaybackData = async (retryCount = 0, isBackground = false) => {
            try {
                // Only show loader on first load, not background refreshes
                if (retryCount === 0 && !isBackground && !data) setIsLoading(true)

                // Fetch screen with optional key
                const screen = await apiService.get<any>(`/v1/screens/${screenId}`, {
                    params: secretKey ? { key: secretKey } : {}
                })
                setData(screen)
                setError(null)
                clearTimeout(safetyTimer) // Loaded successfully

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
                } else if (retryCount < 3) {
                    // Exponential backoff retry
                    const delay = Math.pow(2, retryCount) * 1000;
                    setTimeout(() => fetchPlaybackData(retryCount + 1, isBackground), delay);
                    return; // Return so we don't turn off loading until retries done
                } else {
                    if (!isBackground) setError(err.message || 'Failed to load screen data')
                }
            } finally {
                // Only turn off loading if we are not retrying or if we failed
                if (retryCount >= 3 || localStorage.getItem(STORAGE_KEY)) {
                    setIsLoading(false)
                    clearTimeout(safetyTimer)
                }
            }
        }

        fetchPlaybackData()

        // 30-second auto-refresh and ping (backup) - Pass true for background
        const interval = setInterval(() => fetchPlaybackData(0, true), 30 * 1000)
        return () => {
            clearInterval(interval)
            clearTimeout(safetyTimer)
        }
    }, [screenId])

    // Socket.io integration for real-time updates
    useEffect(() => {
        if (!screenId) return

        // FIX: Use VITE_API_URL for socket connection, fallback to origin
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin
        const socket = io(socketUrl)

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

    // Handle Fullscreen toggle function
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                // Silently fail if not supported
            })
        } else {
            document.exitFullscreen()
        }
    }

    // Handle Mute toggle function
    const toggleMute = () => {
        setIsMuted(prev => !prev)
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'f') toggleFullscreen()
            if (e.key.toLowerCase() === 'm') { toggleMute() }
            if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // --- HOOKS MUST BE CALLED BEFORE CONDITIONAL RETURNS ---
    
    // Resolve Content based on Data and Time
    const activeData = useMemo(() => {
        if (!data) return { content: null }
        
        const { defaultContent, schedules } = data
        const now = new Date()
        const currentDayOfWeek = now.getDay()
        const currentDate = now.toISOString().split('T')[0]

        const validSchedules = (schedules || []).filter((s: any) => {
            if (currentTime < s.startTime || currentTime > s.endTime) return false
            if (s.startDate && currentDate < new Date(s.startDate).toISOString().split('T')[0]) return false
            if (s.endDate && currentDate > new Date(s.endDate).toISOString().split('T')[0]) return false
            if (s.daysOfWeek && s.daysOfWeek.length > 0 && !s.daysOfWeek.includes(currentDayOfWeek)) return false
            return true
        })

        validSchedules.sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0))
        const activeSchedule = validSchedules[0]

        if (activeSchedule) {
            const mergedContent = { ...defaultContent }
            Object.keys(activeSchedule.content || {}).forEach(zoneId => {
                const scheduleZoneContent = activeSchedule.content[zoneId]
                const hasPlaylist = (scheduleZoneContent?.playlist && scheduleZoneContent.playlist.length > 0) ||
                    (scheduleZoneContent?.sourceType === 'playlist' && scheduleZoneContent?.playlistId)
                if (hasPlaylist) mergedContent[zoneId] = scheduleZoneContent
            })
            return { content: mergedContent }
        }
        return { content: defaultContent }
    }, [data, currentTime])

    const content = activeData.content

    const template = data?.templateId
    const resolution = template?.resolution || '1920x1080'
    const [targetWidth, targetHeight] = resolution.split('x').map(Number)
    const scale = Math.min(windowSize.width / targetWidth, windowSize.height / targetHeight)

    // Calculate Optimized Zones for Rendering
    const optimizedZones = useMemo(() => {
        if (!data?.templateId?.zones || !content) return []

        let zones = data.templateId.zones.map((z: any) => ({ ...z }))
        const THRESHOLD = 5
        const EMPTY_FILLING_THRESHOLD = 10

        const isEmptyTextZone = (z: any) => {
            if (z.type !== 'text') return false
            const zoneContent = content[z.id]
            return !zoneContent?.text || zoneContent.text.trim() === ''
        }

        const isEmptyMediaZone = (z: any) => {
            if (z.type === 'text') return false
            const zoneContent = content[z.id]
            if (!zoneContent) return true
            const hasPlaylist = zoneContent.playlist && zoneContent.playlist.length > 0
            const hasSrc = !!zoneContent.src
            return !hasPlaylist && !hasSrc
        }

        zones.forEach((z: any) => {
            if (isEmptyTextZone(z)) return
            if (z.x < THRESHOLD) { z.width += z.x; z.x = 0; }
            if (z.y < THRESHOLD) { z.height += z.y; z.y = 0; }
            if (Math.abs(targetWidth - (z.x + z.width)) < THRESHOLD) z.width = targetWidth - z.x
            if (Math.abs(targetHeight - (z.y + z.height)) < THRESHOLD) z.height = targetHeight - z.y
        })

        zones.forEach((z1: any) => {
            if (isEmptyTextZone(z1) || isEmptyMediaZone(z1)) return
            zones.forEach((z2: any) => {
                if (z1 === z2) return
                const yOverlap = Math.min(z1.y + z1.height, z2.y + z2.height) - Math.max(z1.y, z2.y)
                if (yOverlap > 10) {
                    const isEmpty = isEmptyTextZone(z2)
                    const limit = isEmpty ? EMPTY_FILLING_THRESHOLD : THRESHOLD
                    const gapRight = z2.x - (z1.x + z1.width)
                    if (gapRight >= 0 && gapRight < limit) z1.width += gapRight + (isEmpty ? z2.width : 0)
                    const gapLeft = z1.x - (z2.x + z2.width)
                    if (gapLeft >= 0 && gapLeft < limit) { z1.x -= (gapLeft + (isEmpty ? z2.width : 0)); z1.width += (gapLeft + (isEmpty ? z2.width : 0)); }
                }
                const xOverlap = Math.min(z1.x + z1.width, z2.x + z2.width) - Math.max(z1.x, z2.x)
                if (xOverlap > 10) {
                    const isEmpty = isEmptyTextZone(z2)
                    const limit = isEmpty ? EMPTY_FILLING_THRESHOLD : THRESHOLD
                    const gapBelow = z2.y - (z1.y + z1.height)
                    if (gapBelow >= 0 && gapBelow < limit) z1.height += gapBelow + (isEmpty ? z2.height : 0)
                    const gapAbove = z1.y - (z2.y + z2.height)
                    if (gapAbove >= 0 && gapAbove < limit) { z1.y -= (gapAbove + (isEmpty ? z2.height : 0)); z1.height += (gapAbove + (isEmpty ? z2.height : 0)); }
                }
            })
        })

        const zonesWithContent = zones.filter((z: any) => !isEmptyTextZone(z) && !isEmptyMediaZone(z))
        
        // --- NEW: Overlap Auto-Fix ---
        // If zones overlap, we adjust them to sit side-by-side or stacked
        for (let i = 0; i < zonesWithContent.length; i++) {
            for (let j = i + 1; j < zonesWithContent.length; j++) {
                const z1 = zonesWithContent[i]
                const z2 = zonesWithContent[j]

                // Check overlap
                const x1_max = z1.x + z1.width;
                const x2_max = z2.x + z2.width;
                const y1_max = z1.y + z1.height;
                const y2_max = z2.y + z2.height;

                const isOverlapping = z1.x < x2_max && x1_max > z2.x && z1.y < y2_max && y1_max > z2.y;

                if (isOverlapping) {
                    // Calculate intersection area
                    const interX = Math.min(x1_max, x2_max) - Math.max(z1.x, z2.x);
                    const interY = Math.min(y1_max, y2_max) - Math.max(z1.y, z2.y);

                    // If it's a major overlap, try to resolve it
                    if (interX > 2 && interY > 2) {
                        // Resolve horizontally if overlap is taller than wide, otherwise vertically
                        if (interX < interY) {
                            // Resolve horizontally: move z2 to the right of z1 or z1 to the left of z2
                            if (z1.x < z2.x) {
                                const diff = x1_max - z2.x;
                                z2.x += diff;
                                z2.width = Math.max(20, z2.width - diff);
                            } else {
                                const diff = x2_max - z1.x;
                                z1.x += diff;
                                z1.width = Math.max(20, z1.width - diff);
                            }
                        } else {
                            // Resolve vertically: move z2 below z1 or z1 above z2
                            if (z1.y < z2.y) {
                                const diff = y1_max - z2.y;
                                z2.y += diff;
                                z2.height = Math.max(20, z2.height - diff);
                            } else {
                                const diff = y2_max - z1.y;
                                z1.y += diff;
                                z1.height = Math.max(20, z1.height - diff);
                            }
                        }
                    }
                }
            }
        }

        if (zonesWithContent.length === 1) {
            const soloZone = zonesWithContent[0]
            soloZone.x = 0; soloZone.y = 0; soloZone.width = targetWidth; soloZone.height = targetHeight;
        }

        return zonesWithContent
    }, [data, content, targetWidth, targetHeight])

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

    const showClock = data?.showClock !== false // Default true

    return (
        <div className='fixed inset-0 bg-black overflow-hidden'>

            {/* Live Clock Overlay (top-left) */}
            {(showClock && !hideClockParam) && <LiveClock />}

            {/* QR Code Overlay (dynamic free space) */}
            {data?.qrCodeUrl && <QRCodeOverlay url={data.qrCodeUrl} zones={optimizedZones} targetWidth={targetWidth} targetHeight={targetHeight} />}

            {/* Recorder Overlay (if recording requested) */}
            {searchParams.get('record') === 'true' && (
                <RecorderOverlay targetWidth={targetWidth} targetHeight={targetHeight} />
            )}

            {/* Fullscreen Toggle Overlay (visible on hover or when not fullscreen) */}
            {!hideControlsParam && (
                <div className={`absolute top-4 right-4 z-50 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={toggleFullscreen}
                        className='h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60'
                    >
                        {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
                    </Button>
                </div>
            )}

            {/* Sound Toggle Overlay (bottom-right) */}
            {!hideControlsParam && (
                <div className={`absolute bottom-4 right-4 z-50 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={toggleMute}
                        className='h-10 w-10 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60'
                        title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    >
                        {isMuted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
                    </Button>
                </div>
            )}

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
                                content={zoneContent}
                                zone={zone}
                                screenId={data.id}
                                templateId={data.templateId?.id || data.templateId?._id}
                                secretKey={secretKey || undefined}
                                userId={userId || undefined}
                                isMuted={isMuted}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


function ZoneRenderer({ zone, content, screenId, templateId, secretKey, userId, isMuted }: { zone: any, content: any, screenId?: string, templateId?: string, secretKey?: string, userId?: string | null, isMuted?: boolean }) {
    if (zone.type === 'text') {
        return <TextZone content={content} style={content?.style || {}} />
    }

    return (
        <MediaZone 
            zone={zone}
            content={content} 
            screenId={screenId} 
            templateId={templateId} 
            secretKey={secretKey} 
            userId={userId}
            isMuted={isMuted}
        />
    )
}

function MediaZone({ zone, content, screenId, templateId, secretKey, userId, isMuted = true }: any) {
    const playlist = useMemo(() => {
        let list = content?.playlist || []

        if (zone.type === 'image') {
            list = list.filter((item: any) => item.type === 'image')
        } else if (zone.type === 'video') {
            list = list.filter((item: any) => item.type === 'video')
        }

        if (list.length === 0 && content?.src) {
            const fallbackSrc = content.src
            const isImage = fallbackSrc.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
            const isVideo = fallbackSrc.match(/\.(mp4|mov|webm)$/i)

            if (zone.type === 'mixed' ||
                (zone.type === 'image' && isImage) ||
                (zone.type === 'video' && isVideo)) {
                return [{ url: fallbackSrc, type: isVideo ? 'video' : 'image', duration: 10 }]
            }
        }
        return list
    }, [content, zone.type])

    const [currentIndex, setCurrentIndex] = useState(0)
    const [hasError, setHasError] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [transitionKey, setTransitionKey] = useState(0)
    const transition = content?.transition || 'fade'

    useEffect(() => {
        setCurrentIndex(0)
        setHasError(false)
    }, [content])

    useEffect(() => {
        setHasError(false)
        setTransitionKey(prev => prev + 1)
    }, [currentIndex])

    useEffect(() => {
        if (!playlist || playlist.length <= 1) return

        const currentItem = playlist[currentIndex]
        if (currentItem.type === 'video' || (zone.type === 'video' && !currentItem.type)) return

        const duration = (currentItem?.duration || 10) * 1000
        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length)
        }, duration)

        return () => clearTimeout(timer)
    }, [currentIndex, playlist, zone.type])

    useEffect(() => {
        if (!playlist || playlist.length === 0 || !screenId || !templateId) return
        const item = playlist[currentIndex]
        const startTime = new Date()
        const logPlayback = async (endTime: Date) => {
            try {
                const typeToLog = item?.type || zone.type
                const duration = (endTime.getTime() - startTime.getTime()) / 1000
                await apiService.post('/v1/playback-logs', {
                    screenId, templateId, zoneId: zone.id,
                    contentUrl: item.url, contentType: typeToLog,
                    startTime, endTime, duration,
                    secretKey,
                    userId
                })
            } catch { }
        }
        return () => { logPlayback(new Date()) }
    }, [currentIndex, playlist, screenId, templateId, zone.id, zone.type, secretKey, userId])

    const mediaType = playlist[currentIndex]?.type || zone.type
    useEffect(() => {
        if (mediaType === 'video' && videoRef.current) {
            const video = videoRef.current
            video.muted = isMuted
            video.play().catch(() => {
                // If unmuted autoplay fails, fall back to muted
                video.muted = true
                video.play().catch(() => {})
            })
        }
    }, [playlist, currentIndex, mediaType, isMuted])

    if (!playlist || playlist.length === 0) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center bg-gray-900 border border-gray-700 p-4 text-center'>
                <IconAlertTriangle size={32} className='mb-2 text-gray-500' />
                <p className='text-xs text-gray-400 font-mono'>No Content</p>
                <p className='text-[10px] text-gray-600'>{zone.id}</p>
                <div className="mt-2 text-[8px] opacity-60">
                    {zone.width}x{zone.height}
                </div>
            </div>
        )
    }

    const item = playlist[currentIndex]

    // CSS animation class based on transition type
    const getAnimationStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = { animationDuration: '600ms', animationFillMode: 'both', animationTimingFunction: 'ease-in-out' }
        switch (transition) {
            case 'slide-left':
                return { ...base, animationName: 'slideInFromRight' }
            case 'slide-up':
                return { ...base, animationName: 'slideInFromBottom' }
            case 'zoom':
                return { ...base, animationName: 'zoomIn' }
            case 'flip':
                return { ...base, animationName: 'flipIn', perspective: '1200px' }
            case 'fade':
            default:
                return { ...base, animationName: 'fadeIn' }
        }
    }

    const renderMedia = () => {
        if (hasError) return <div className="w-full h-full bg-black"></div>

        if (mediaType === 'video') {
            return (
                <video
                    ref={videoRef}
                    key={item.url}
                    src={normalizeVideoUrl(item.url)}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    loop={playlist.length === 1}
                    className='h-full w-full object-contain'
                    style={{ backgroundColor: 'black' }}
                    onError={() => {
                        if (playlist.length > 1) {
                            setTimeout(() => {
                                setHasError(false);
                                setCurrentIndex((prev) => (prev + 1) % playlist.length);
                            }, 50);
                        } else {
                            setTimeout(() => setHasError(true), 50);
                        }
                    }}
                    onEnded={() => {
                        if (playlist.length > 1) {
                            setCurrentIndex((prev) => (prev + 1) % playlist.length)
                        }
                    }}
                />
            )
        }

        return (
            <img
                src={item.url}
                alt=""
                className='h-full w-full object-contain'
                style={{ backgroundColor: 'black' }}
                onError={() => {
                    if (playlist.length > 1) {
                        setTimeout(() => {
                            setHasError(false);
                            setCurrentIndex((prev) => (prev + 1) % playlist.length);
                        }, 50);
                    } else {
                        setTimeout(() => setHasError(true), 50);
                    }
                }}
            />
        )
    }

    return (
        <div className='w-full h-full bg-black relative overflow-hidden'>
            <div
                key={transitionKey}
                className='absolute inset-0 flex items-center justify-center'
                style={playlist.length > 1 ? getAnimationStyle() : {}}
            >
                {renderMedia()}
            </div>
        </div>
    )
}

// --- LIVE CLOCK OVERLAY ---
function LiveClock() {
    const [time, setTime] = useState('')
    const [date, setDate] = useState('')

    useEffect(() => {
        const update = () => {
            const now = new Date()
            const hours = now.getHours()
            const mins = now.getMinutes().toString().padStart(2, '0')
            const ampm = hours >= 12 ? 'PM' : 'AM'
            const h12 = hours % 12 || 12
            setTime(`${h12}:${mins} ${ampm}`)

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`)
        }
        update()
        const timer = setInterval(update, 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="absolute top-4 left-4 z-50 pointer-events-none select-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                <div className="text-white text-2xl font-bold tracking-tight leading-none">{time}</div>
                <div className="text-white/70 text-xs font-medium tracking-wide mt-0.5">{date}</div>
            </div>
        </div>
    )
}

// --- QR CODE OVERLAY ---
function QRCodeOverlay({ url, zones, targetWidth, targetHeight }: { url: string, zones: any[], targetWidth: number, targetHeight: number }) {
    const [position, setPosition] = useState<{ top?: number, right?: number, bottom?: number, left?: number }>({ top: 16, right: 16 })

    useEffect(() => {
        // Find "best" corner that doesn't have a zone
        // Corners to check: Top-Right (TR), Bottom-Left (BL), Bottom-Right (BR)
        // (Top-Left is reserved for Clock)
        
        // Find the "center" of free space by checking a grid
        const gridX = 5;
        const gridY = 5;
        const cellW = targetWidth / gridX;
        const cellH = targetHeight / gridY;
        
        const qrSize = 180;
        const padding = 40;
        
        let freeCells: {x: number, y: number, score: number}[] = [];

        for (let ix = 0; ix < gridX; ix++) {
            for (let iy = 0; iy < gridY; iy++) {
                const cx = ix * cellW + cellW/2;
                const cy = iy * cellH + cellH/2;
                
                // Avoid Top-Left (Clock)
                if (ix === 0 && iy === 0) continue;

                // Ensure it stays within bounds with padding
                if (cx < qrSize/2 + padding || cx > targetWidth - qrSize/2 - padding) continue;
                if (cy < qrSize/2 + padding || cy > targetHeight - qrSize/2 - padding) continue;

                // Score based on distance from zones (higher is better)
                let minSubDist = 2000;
                zones.forEach(z => {
                    const zcx = z.x + z.width/2;
                    const zcy = z.y + z.height/2;
                    const d = Math.sqrt(Math.pow(cx - zcx, 2) + Math.pow(cy - zcy, 2));
                    if (d < minSubDist) minSubDist = d;
                });
                
                freeCells.push({ x: cx, y: cy, score: minSubDist });
            }
        }

        const bestCell = freeCells.sort((a,b) => b.score - a.score)[0];
        
        // Only show if we found a "good" spot (distance score > 150)
        // If the screen is too crowded, bestCell.score will be low.
        if (bestCell && bestCell.score > 150) {
            setPosition({ 
                top: Math.max(padding, Math.min(targetHeight - qrSize - padding, bestCell.y - qrSize/2)), 
                left: Math.max(padding, Math.min(targetWidth - qrSize - padding, bestCell.x - qrSize/2))
            });
        } else {
            // Hide by moving off screen or returning null in render
            setPosition({ top: -1000, left: -1000 });
        }
    }, [zones, targetWidth, targetHeight])

    const qrImageUrl = url ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}&color=000&bgcolor=fff&margin=1` : ''

    if (!url || position.top === -1000) return null;

    return (
        <div 
            className="absolute z-50 pointer-events-none select-none transition-all duration-700 ease-in-out"
            style={{ 
                ...position as any,
                animation: 'fadeIn 1s ease-out'
            }}
        >
            <div className="bg-white p-2 rounded-xl shadow-2xl border border-black/10 flex flex-col items-center gap-1">
                <div className="w-[120px] h-[120px] bg-white rounded overflow-hidden">
                    <img src={qrImageUrl} alt="QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="bg-black text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-tighter">
                    Scan Me
                </div>
            </div>
        </div>
    )
}

// --- RECORDER OVERLAY ---
function RecorderOverlay({ }: { targetWidth: number, targetHeight: number }) {
    const [duration, setDuration] = useState(30)
    const [isRecording, setIsRecording] = useState(false)
    const [status, setStatus] = useState<'idle' | 'recording' | 'finalizing' | 'done'>('idle')

    const startRecording = async () => {
        setIsRecording(true)
        setStatus('recording')

        // Actually, capturing the window is easier if we are in a tab.
        
        try {
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { 
                    frameRate: 30, 
                    displaySurface: 'browser',
                    cursor: 'never' // Hide cursor in recording
                } as any,
                audio: true,
                preferCurrentTab: true
            })

            const mimeType = MediaRecorder.isTypeSupported('video/mp4; codecs=avc1.42E01E,mp4a.40.2') 
                ? 'video/mp4' 
                : 'video/webm;codecs=h264'
            
            const recorder = new MediaRecorder(stream, { mimeType })
            const chunks: BlobPart[] = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            recorder.onstop = () => {
                setStatus('finalizing')
                const blob = new Blob(chunks, { type: mimeType })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `smart-sign-deck-export.mp4`
                a.click()
                setStatus('done')
                setIsRecording(false)
                
                // Stop all tracks
                stream.getTracks().forEach((t: any) => t.stop())
            }

            recorder.start()

            const startTime = Date.now()
            const interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000
                const p = Math.min(100, (elapsed / duration) * 100)
                document.title = `Recording: ${Math.round(p)}% - SmartSignDeck`

                if (elapsed >= duration) {
                    clearInterval(interval)
                    document.title = "Finalizing..."
                    recorder.stop()
                }
            }, 200)

        } catch (err) {
            console.error('Recording failed:', err)
            setIsRecording(false)
            setStatus('idle')
        }
    }

    if (status === 'done') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center shadow-2xl scale-110">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <IconDeviceTv size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Download Ready!</h2>
                    <p className="text-sm text-gray-500">Your video has been exported successfully.</p>
                    <div className="flex gap-2">
                        <Button onClick={() => window.location.reload()} variant="outline">Record Again</Button>
                        <Button onClick={() => window.close()}>Close Tab</Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${isRecording ? 'bg-transparent pointer-events-none' : 'bg-black/60 backdrop-blur-sm'}`}>
            <div className={`bg-white rounded-2xl p-6 w-[400px] shadow-2xl flex flex-col gap-6 transition-all duration-500 ${isRecording ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <IconDownload size={20} />
                        </div>
                        <h3 className="font-bold text-lg">Export to Video</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => window.close()}>×</Button>
                </div>

                {!isRecording ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Select a duration. Note: Recording is real-time to preserve animation quality. Please <b>do not</b> move your mouse or switch tabs.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {[15, 30, 60].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`py-3 rounded-xl border-2 transition-all ${duration === d 
                                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-md' 
                                        : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}
                                >
                                    {d}s
                                </button>
                            ))}
                        </div>
                        <Button 
                            className="w-full h-12 text-md font-bold rounded-xl shadow-lg shadow-primary/20" 
                            onClick={startRecording}
                        >
                            Start Recording
                        </Button>
                    </div>
                ) : null}
            </div>
            
            {/* Minimal recording indicator - REMOVED for clean video export per user request */}
            {/* We now use document.title to show progress instead */}
        </div>
    )
}

function TextZone({ content, style }: { content: any, style: any }) {
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

