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

        // PRIORITY 1: Early load from cache to avoid white screen
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached && !data) {
            try {
                const { data: cachedData } = JSON.parse(cached);
                setData(cachedData);
            } catch (e) { console.warn('Cache corrupted:', e); }
        }

        const fetchPlaybackData = async (retryCount = 0, isBackground = false) => {
            try {
                // Only show loader if we have NO data at all (not even cached)
                const hasNoData = !data && !cached;
                if (retryCount === 0 && !isBackground && hasNoData) setIsLoading(true)

                // Fetch fresh data
                const response = await apiService.get<any>(`/v1/screens/${screenId}`, {
                    params: secretKey ? { key: secretKey } : {}
                })
                
                setData(response)
                setError(null)
                setIsLoading(false)
                clearTimeout(safetyTimer)

                // Cache fresh version
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    data: response,
                    timestamp: Date.now()
                }));

                await apiService.post(`/v1/screens/${screenId}/ping`, {}).catch(() => {})
            } catch (err: any) {
                console.error(`Fetch attempt ${retryCount + 1} failed:`, err)
                
                if (retryCount < 2) {
                    setTimeout(() => fetchPlaybackData(retryCount + 1, isBackground), 2000);
                } else {
                    if (!data) setError(err.message || 'Failed to sync with server');
                    setIsLoading(false);
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

        const isActuallyEmpty = (z: any) => {
            const zoneContent = content[z.id]
            if (!zoneContent) return true
            if (z.type === 'text') {
                return !zoneContent.text || zoneContent.text.trim() === ''
            } else {
                // Media zone is empty if it has no list, no src, and no linked playlist
                const hasPlaylist = zoneContent.playlist && zoneContent.playlist.length > 0
                const hasSrc = !!zoneContent.src
                const hasPlaylistId = !!(zoneContent.sourceType === 'playlist' && zoneContent.playlistId)
                return !hasPlaylist && !hasSrc && !hasPlaylistId
            }
        }

        const isEmptyTextZone = (z: any) => z.type === 'text' && isActuallyEmpty(z)
        const isEmptyMediaZone = (z: any) => z.type !== 'text' && isActuallyEmpty(z)


        // Identify the "Best QR Home" if a URL is provided. 
        // We will "protect" this zone from being consumed by content expansion.
        const qrHomeId = data?.qrCodeUrl ? (() => {
            const freeZones = zones.filter((z: any) => isActuallyEmpty(z));
            if (freeZones.length === 0) return null;
            
            // Prefer Top-Right or Bottom-Right for QR
            const trZone = freeZones.find((z: any) => z.x + z.width >= targetWidth - 10 && z.y <= 10);
            if (trZone) return trZone.id;
            const brZone = freeZones.find((z: any) => z.x + z.width >= targetWidth - 10 && z.y + z.height >= targetHeight - 10);
            if (brZone) return brZone.id;
            
            // Fallback: Largest free zone
            return freeZones.sort((a: any, b: any) => (b.width * b.height) - (a.width * a.height))[0].id;
        })() : null;

        zones.forEach((z: any) => {
            if (isEmptyTextZone(z)) return
            if (z.x < THRESHOLD) { z.width += z.x; z.x = 0; }
            if (z.y < THRESHOLD) { z.height += z.y; z.y = 0; }
            if (Math.abs(targetWidth - (z.x + z.width)) < THRESHOLD) z.width = targetWidth - z.x
            if (Math.abs(targetHeight - (z.y + z.height)) < THRESHOLD) z.height = targetHeight - z.y
        })

        zones.forEach((z1: any) => {
            if (isActuallyEmpty(z1)) return
            zones.forEach((z2: any) => {
                if (z1 === z2) return
                const yOverlap = Math.min(z1.y + z1.height, z2.y + z2.height) - Math.max(z1.y, z2.y)
                if (yOverlap > 10) {
                    const isEmpty = isActuallyEmpty(z2)
                    if (isEmpty && z2.id === qrHomeId) return; // PROTECT QR HOME
                    
                    const limit = isEmpty ? EMPTY_FILLING_THRESHOLD : THRESHOLD
                    const gapRight = z2.x - (z1.x + z1.width)
                    if (gapRight >= 0 && gapRight < limit) z1.width += gapRight + (isEmpty ? z2.width : 0)
                    const gapLeft = z1.x - (z2.x + z2.width)
                    if (gapLeft >= 0 && gapLeft < limit) { z1.x -= (gapLeft + (isEmpty ? z2.width : 0)); z1.width += (gapLeft + (isEmpty ? z2.width : 0)); }
                }
                const xOverlap = Math.min(z1.x + z1.width, z2.x + z2.width) - Math.max(z1.x, z2.x)
                if (xOverlap > 10) {
                    const isEmpty = isEmptyTextZone(z2) || isEmptyMediaZone(z2)
                    if (isEmpty && z2.id === qrHomeId) return; // PROTECT QR HOME

                    const limit = isEmpty ? EMPTY_FILLING_THRESHOLD : THRESHOLD
                    const gapBelow = z2.y - (z1.y + z1.height)
                    if (gapBelow >= 0 && gapBelow < limit) z1.height += gapBelow + (isEmpty ? z2.height : 0)
                    const gapAbove = z1.y - (z2.y + z2.height)
                    if (gapAbove >= 0 && gapAbove < limit) { z1.y -= (gapAbove + (isEmpty ? z2.height : 0)); z1.height += (gapAbove + (isEmpty ? z2.height : 0)); }
                }
            })
        })

        const zonesWithContent = zones.filter((z: any) => !isActuallyEmpty(z))
        
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

        if (zonesWithContent.length === 1 && !qrHomeId) {
            const soloZone = zonesWithContent[0]
            soloZone.x = 0; soloZone.y = 0; soloZone.width = targetWidth; soloZone.height = targetHeight;
        }

        const result: any = zonesWithContent;
        result.qrHomeId = qrHomeId;
        return result;
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
                {/* QR Code Overlay (dynamic free space) - INSIDE scaled container for coordinate symmetry */}
                {data?.qrCodeUrl && (
                    <QRCodeOverlay 
                        url={data.qrCodeUrl} 
                        zones={optimizedZones} 
                        targetWidth={targetWidth} 
                        targetHeight={targetHeight}
                        qrHomeId={optimizedZones.qrHomeId}
                    />
                )}

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
function QRCodeOverlay({ url, zones, targetWidth, targetHeight, qrHomeId }: { url: string, zones: any[], targetWidth: number, targetHeight: number, qrHomeId?: string | null }) {
    const [position, setPosition] = useState<{ top?: number, right?: number, bottom?: number, left?: number }>({ top: -1000, left: -1000 })

    useEffect(() => {
        const qrSize = 180;
        const padding = 40; // Increased padding for safer margins
        
        const gridX = 24; // Much higher density grid for better precision
        const gridY = 24;
        const cellW = targetWidth / gridX;
        const cellH = targetHeight / gridY;

        let bestPos = { top: -1000, left: -1000, maxDist: 0 };

        // --- NEW: Direct Target Fallback ---
        // If we have a reserved QR home zone, find its center to use as a primary target
        if (qrHomeId) {
            // we need to find the zone with this ID in the player's context or pass its data.
            // Since optimizedZones in the parent only includes content zones, 
            // we'll rely on the grid search but boost the score of zones near where the QR Home should be.
        }

        for (let ix = 0; ix < gridX; ix++) {
            for (let iy = 0; iy < gridY; iy++) {
                const cx = ix * cellW + cellW/2;
                const cy = iy * cellH + cellH/2;
                
                // Avoid Top-Left (Clock area)
                if (cx < 300 && cy < 150) continue;

                const qx = cx - qrSize/2;
                const qy = cy - qrSize/2;

                // Stay in bounds
                if (qx < padding || qx + qrSize > targetWidth - padding) continue;
                if (qy < padding || qy + qrSize > targetHeight - padding) continue;

                // STRICT COLLISION CHECK
                // Does this 180x180 square overlap ANY zone?
                const buffer = 20; // Extra space around zones
                const hasCollision = zones.some(z => {
                    return (
                        qx < z.x + z.width + buffer &&
                        qx + qrSize > z.x - buffer &&
                        qy < z.y + z.height + buffer &&
                        qy + qrSize > z.y - buffer
                    );
                });

                if (hasCollision) continue;

                // --- Premium Scoring System ---
                // 1. We want to be away from zones (minZoneDist)
                // 2. We want to be somewhat away from edges (edgeDist)
                // 3. Balancing these two naturally finds the "center" of an empty area
                let minZoneDist = 5000;
                zones.forEach(z => {
                    const zcx = z.x + z.width/2;
                    const zcy = z.y + z.height/2;
                    const d = Math.sqrt(Math.pow(cx - zcx, 2) + Math.pow(cy - zcy, 2));
                    if (d < minZoneDist) minZoneDist = d;
                });

                const distToLeft = cx;
                const distToRight = targetWidth - cx;
                const distToTop = cy;
                const distToBottom = targetHeight - cy;
                const edgeDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

                // Combined score: high minZoneDist + reasonable edgeDist = Centered in the free gap
                const score = minZoneDist + (edgeDist * 0.5);

                if (score > (bestPos as any).maxScore || !bestPos.maxDist) {
                    (bestPos as any).maxScore = score;
                    bestPos = { top: qy, left: qx, maxDist: minZoneDist } as any;
                }
            }
        }

        // PRIORITY: If we have ANY spot that doesn't collide, show it.
        // Even a low maxDist (like 20) is better than no QR code if the user added a URL.
        if (bestPos.maxDist > 20) {
            setPosition({ top: bestPos.top, left: bestPos.left });
        } else {
            // Total fail: hide it
            setPosition({ top: -1000, left: -1000 });
        }
    }, [url, zones, targetWidth, targetHeight, qrHomeId])

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

        // Reliable Cursor Hiding: Inject CSS to hide mouse while recording
        const style = document.createElement('style')
        style.id = 'hide-cursor-recording'
        style.innerHTML = '* { cursor: none !important; }'
        document.head.appendChild(style)

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

                // Restore Cursor: Remove the CSS rule
                const style = document.getElementById('hide-cursor-recording')
                if (style) style.remove()
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

