import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiService } from '@/api'
import Loader from '@/components/loader'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { toast } from '@/components/ui/use-toast'
import { io } from 'socket.io-client'
import CameraCapture from '@/components/camera-capture'

export default function ScreenPlayer() {
    const { screenId } = useParams()
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [currentAudience, setCurrentAudience] = useState<any>(null)
    const [currentTriggers, setCurrentTriggers] = useState<any>(null)

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

                // Fetch screen
                const screen = await apiService.get<any>(`/v1/screens/${screenId}`)
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
                    toast({
                        title: "Offline Mode",
                        description: "Running on cached content due to network issues.",
                        variant: "destructive"
                    });
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

        const socket = io(import.meta.env.VITE_APP_URL || 'http://localhost:3000')

        socket.on('connect', () => {
            console.log('Connected to socket server')
            socket.emit('join_screen', screenId)
        })

        socket.on('content_update', (data) => {
            console.log('Real-time content update received:', data)
            // Call the same fetch logic to refresh data
            const fetchPlaybackData = async () => {
                try {
                    const screen = await apiService.get<any>(`/v1/screens/${screenId}`)
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

        socket.on('trigger_update', (data) => {
            console.log('External trigger update received:', data)
            setCurrentTriggers(data)
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
        const { defaultContent, schedules, audienceRules, triggerRules } = data

        // 1. Audience-based rules (Priority 1)
        if (currentAudience && audienceRules && audienceRules.length > 0) {
            const match = audienceRules.find((rule: any) => {
                const ageMatch = !rule.ageRange || rule.ageRange === currentAudience.ageRange
                const genderMatch = !rule.gender || rule.gender === currentAudience.gender
                return ageMatch && genderMatch
            })
            if (match) return { content: match.content, source: 'audience', rule: match }
        }

        // 2. External Trigger rules (Priority 2)
        if (currentTriggers && triggerRules && triggerRules.length > 0) {
            const match = triggerRules.find((rule: any) => {
                const weatherMatch = !rule.condition || rule.condition === currentTriggers.weather?.condition
                return weatherMatch
            })
            if (match) return { content: match.content, source: 'trigger', rule: match }
        }

        // 3. Time-based schedules (Priority 3)
        if (schedules && schedules.length > 0) {
            const activeSchedule = schedules.find((s: any) => {
                return currentTime >= s.startTime && currentTime <= s.endTime
            })
            if (activeSchedule) return { content: activeSchedule.content, source: 'schedule', rule: activeSchedule }
        }

        return { content: defaultContent, source: 'default', rule: null }
    }

    const { templateId: template } = data
    const { content, source, rule } = determineActiveContent()
    const resolution = template?.resolution || '1920x1080'
    const [targetWidth, targetHeight] = resolution.split('x').map(Number)

    // Calculate scale to fit within viewport
    const scaleX = windowSize.width / targetWidth
    const scaleY = windowSize.height / targetHeight
    // const scale = Math.min(scaleX, scaleY) - Unused

    return (
        <div className='fixed inset-0 bg-black overflow-hidden'>
            <CameraCapture onDemographicsDetected={setCurrentAudience} />

            {/* Debug Overlay */}
            {showDebug && (
                <div className="absolute top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg border border-white/20 shadow-xl max-w-sm font-mono text-xs backdrop-blur-sm pointer-events-none select-none">
                    <h3 className="font-bold border-b border-white/20 pb-2 mb-2 text-sm text-green-400">⚡ Smart Logic Debugger</h3>

                    <div className="space-y-3">
                        {/* Active Source */}
                        <div className="flex justify-between items-center">
                            <span className="opacity-70">Playing Content From:</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${source === 'audience' ? 'bg-purple-500' :
                                source === 'trigger' ? 'bg-blue-500' :
                                    source === 'schedule' ? 'bg-orange-500' : 'bg-gray-600'
                                }`}>
                                {source.toUpperCase()}
                            </span>
                        </div>

                        {/* Audience Status */}
                        <div className={`p-2 rounded ${source === 'audience' ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-white/5'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="text-purple-300 font-bold">1. Audience (Cam)</span>
                                {source === 'audience' && <span className="text-purple-400">ACTIVE</span>}
                            </div>
                            <div className="pl-2 border-l-2 border-white/10">
                                <div>Detected: {currentAudience ? `${currentAudience.gender}, ${currentAudience.ageRange}` : 'Searching...'}</div>
                            </div>
                        </div>

                        {/* Trigger Status */}
                        <div className={`p-2 rounded ${source === 'trigger' ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-white/5'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="text-blue-300 font-bold">2. Triggers (Env)</span>
                                {source === 'trigger' && <span className="text-blue-400">ACTIVE</span>}
                            </div>
                            <div className="pl-2 border-l-2 border-white/10">
                                <div>Time: {currentTime}</div>
                                <div>Weather: {currentTriggers?.weather?.condition || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Schedule Status */}
                        <div className={`p-2 rounded ${source === 'schedule' ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-white/5'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="text-orange-300 font-bold">3. Schedule (Time)</span>
                                {source === 'schedule' && <span className="text-orange-400">ACTIVE</span>}
                            </div>
                            <div className="pl-2 border-l-2 border-white/10">
                                <div>Current Rule: {source === 'schedule' ? rule?.name : 'Inactive'}</div>
                            </div>
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
                    transform: `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`,
                    transformOrigin: 'center center'
                }}
            >
                {data.templateId.zones.map((zone: any) => {
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
                                currentAudience={currentAudience}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function ZoneRenderer({ zone, content, screenId, templateId, currentAudience }: { zone: any, content: any, screenId?: string, templateId?: string, currentAudience?: any }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [hasError, setHasError] = useState(false)

    // Reset error when item changes
    useEffect(() => {
        setHasError(false)
    }, [currentIndex, content])

    // Parse content into a unified playlist format
    const playlist = content?.playlist || (content?.src ? [{ url: content.src, type: zone.type, duration: 10 }] : [])

    useEffect(() => {
        if (!playlist || playlist.length <= 1) return

        const currentItem = playlist[currentIndex]
        const duration = (currentItem?.duration || 10) * 1000

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length)
        }, duration)

        return () => clearTimeout(timer)
    }, [currentIndex, playlist])

    // Proof of Play Logging - (Unchanged)
    useEffect(() => {
        if (!playlist || playlist.length === 0 || !screenId || !templateId) return

        const item = playlist[currentIndex]
        const startTime = new Date()

        const logPlayback = async (endTime: Date) => {
            try {
                const duration = (endTime.getTime() - startTime.getTime()) / 1000
                await apiService.post('/v1/playback-logs', {
                    screenId,
                    templateId,
                    zoneId: zone.id,
                    contentUrl: item.url,
                    contentType: item.type || zone.type,
                    startTime,
                    endTime,
                    duration,
                    demographics: currentAudience
                })
            } catch (err) {
                console.error('Failed to log proof-of-play:', err)
            }
        }

        return () => {
            logPlayback(new Date())
        }
    }, [currentIndex, playlist, screenId, templateId, zone.id, zone.type])

    if (!playlist || playlist.length === 0) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center bg-gray-900 border border-gray-700 p-4 text-center'>
                <IconAlertTriangle size={32} className='mb-2 text-gray-500' />
                <p className='text-xs text-gray-400 font-mono'>No Playlist</p>
                <p className='text-[10px] text-gray-600'>{zone.type}</p>
            </div>
        )
    }

    const item = playlist[currentIndex]

    if (hasError) {
        return (
            <div className='flex h-full w-full flex-col items-center justify-center bg-red-950/50 border border-red-900 p-4 text-center anim-pulse'>
                <IconAlertTriangle size={32} className='mb-2 text-red-500' />
                <p className='text-xs text-red-400 font-bold'>Failed to Load</p>
                <p className='text-[10px] text-red-300/50 truncate max-w-full px-2'>{item.url}</p>
            </div>
        )
    }

    // Handle text zones differently
    if (zone.type === 'text') {
        return (
            <div className='flex h-full w-full items-center justify-center bg-white p-6 text-black text-center'>
                <span className='text-4xl font-black uppercase'>{content?.value || 'Enter Text'}</span>
            </div>
        )
    }

    const mediaType = item.type || zone.type

    return (
        <div className='w-full h-full bg-black relative'>
            {mediaType === 'video' ? (
                <video
                    key={item.url} // Force re-render on url change
                    src={item.url}
                    autoPlay
                    muted
                    playsInline // Critical for mobile/iOS playback
                    loop={playlist.length === 1} // Loop if only one item
                    className='h-full w-full object-cover'
                    onError={(e) => {
                        console.error('Video playback error:', item.url, e)
                        setHasError(true)
                    }}
                    onLoadedData={() => console.log('Video loaded:', item.url)}
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
