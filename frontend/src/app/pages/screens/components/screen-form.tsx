import { useState, useEffect, useRef, useMemo } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { templateService, Template } from '@/api/template.service'
import { apiService } from '@/api'
import { toast } from '@/components/ui/use-toast'
import { playlistService, Playlist } from '@/api/playlist.service'
import { IconDeviceFloppy, IconArrowLeft, IconPlayerPlay, IconCloudUpload, IconPlaylist } from '@tabler/icons-react'
import { useAuth } from '@/hooks/use-auth'
import TextZoneEditor from './text-zone-editor'
import PlaylistEditor from './playlist-editor'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import ScheduleManager from './schedule-manager'

interface ScreenFormProps {
    initialData?: any
    onCancel: () => void
}

export default function ScreenForm({ initialData, onCancel }: ScreenFormProps) {
    const { user } = useAuth()
    // State
    // Safe ID extraction
    const getInitialTemplateId = () => {
        if (!initialData?.templateId) return ''
        if (typeof initialData.templateId === 'string') return initialData.templateId
        return initialData.templateId.id || initialData.templateId._id || ''
    }

    const [name, setName] = useState(initialData?.name || '')
    const [selectedTemplateId, setSelectedTemplateId] = useState(getInitialTemplateId())
    const [defaultContent, setDefaultContent] = useState<any>(initialData?.defaultContent || {})

    // Debug
    useEffect(() => {
        console.log('ScreenForm Debug:', {
            initialData,
            selectedTemplateId,
            typeOfId: typeof selectedTemplateId,
            secretKey: initialData?.secretKey,
            secretKeyLen: initialData?.secretKey?.length
        })
        if (initialData?.secretKey && initialData.secretKey.length > 32) {
            console.error('[ScreenForm] CORRUPTED KEY IN INITIAL DATA:', initialData.secretKey);
        }
    }, [initialData, selectedTemplateId])
    const [schedules, setSchedules] = useState<any[]>(initialData?.schedules || [])
    const [activeTab, setActiveTab] = useState('default')
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [playbackIndices, setPlaybackIndices] = useState<Record<string, number>>({})

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mediaSectionRef = useRef<HTMLDivElement>(null)
    const mediaCache = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({})

    const queryClient = useQueryClient()

    const { data: templatesData } = useQuery({
        queryKey: ['templates', user?.id],
        queryFn: () => templateService.getTemplates({ limit: 100, createdBy: user?.id }),
        enabled: !!user?.id
    })

    const { data: playlistsData } = useQuery({
        queryKey: ['playlists'],
        queryFn: () => playlistService.getPlaylists({ limit: 100 })
    })

    // Fetch specific template details to ensure we have the zones even if not in the list or if list is partial
    const { data: specificTemplateData } = useQuery({
        queryKey: ['template', selectedTemplateId],
        queryFn: () => templateService.getTemplate(selectedTemplateId),
        enabled: !!selectedTemplateId
    })

    const selectedTemplate = useMemo(() => {
        // Prioritize specific fetch, fallback to list search
        if (specificTemplateData) return specificTemplateData
        return templatesData?.results?.find((t: Template) => t.id === selectedTemplateId || t._id === selectedTemplateId)
    }, [specificTemplateData, templatesData, selectedTemplateId])

    const latestTemplateId = useMemo(() => {
        if (!templatesData?.results?.length) return null
        return [...templatesData.results].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]?.id
    }, [templatesData])

    const activeContent = useMemo(() => {
        if (activeTab === 'default') return defaultContent
        const scheduleIndex = parseInt(activeTab.split('-')[1])
        if (!schedules[scheduleIndex]) return {}
        return schedules[scheduleIndex].content || {}
    }, [activeTab, defaultContent, schedules])

    // Initialize content object when template changes
    useEffect(() => {
        if (selectedTemplate) {
            const newContent: any = { ...defaultContent }
            selectedTemplate.zones.forEach((zone: any) => {
                if (!newContent[zone.id]) {
                    if (zone.type === 'text') {
                        // Initialize text zone structure
                        newContent[zone.id] = { type: 'text', text: '', style: {} }
                    } else {
                        // Media init
                        if (initialData?.defaultContent?.[zone.id]?.src) {
                            newContent[zone.id] = {
                                type: zone.type,
                                playlist: [{
                                    url: initialData.defaultContent[zone.id].src,
                                    type: zone.type === 'video' ? 'video' : 'image',
                                    duration: 10
                                }]
                            }
                        } else {
                            newContent[zone.id] = {
                                type: zone.type,
                                sourceType: initialData?.defaultContent?.[zone.id]?.sourceType || 'local',
                                playlistId: initialData?.defaultContent?.[zone.id]?.playlistId || '',
                                playlist: []
                            }
                        }
                    }
                }
            })
            // Only update if there are changes to avoid loop, but checking deeply is hard.
            // For now, simpler: we only run this when templateId changes essentially.
            // But we must be careful not to overwrite user changes if they switch templates back and forth?
            // Usually user selects template once.
            if (activeTab === 'default' && Object.keys(newContent).length > Object.keys(defaultContent).length) {
                setDefaultContent(newContent)
            }
        }
    }, [selectedTemplateId, templatesData]) // Depend on ID, not text/styles

    // Playback Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaybackIndices(prev => {
                const next = { ...prev }
                if (!selectedTemplate) return prev

                let changed = false
                selectedTemplate.zones.forEach((zone: any) => {
                    if (zone.type === 'text') return
                    const content = activeContent?.[zone.id]
                    if (content?.playlist?.length > 1) {
                        const currentIndex = prev[zone.id] || 0
                        // Simple logic: assume 5s preview or use item duration
                        // Real player uses detailed timing, here we just cycle every 3s for preview?
                        // Or we can rely on checks. 
                        // Let's just increment every 3 seconds for now to make it alive.
                        const nextIndex = (currentIndex + 1) % content.playlist.length
                        next[zone.id] = nextIndex
                        changed = true
                    }
                })
                return changed ? next : prev
            })
        }, 3000)
        return () => clearInterval(interval)
    }, [selectedTemplate, activeContent])

    // Draw Visual Map
    useEffect(() => {
        if (!selectedTemplate || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Resolution & Scale setup
        const resolution = selectedTemplate.resolution || '1920x1080'
        const [targetWidth, targetHeight] = resolution.split('x').map(Number)
        const SCALE = 0.25
        canvas.width = targetWidth * SCALE
        canvas.height = targetHeight * SCALE

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Background
            ctx.fillStyle = '#111'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            selectedTemplate.zones.forEach((zone: any) => {
                const scaledX = zone.x * SCALE
                const scaledY = zone.y * SCALE
                const scaledW = zone.width * SCALE
                const scaledH = zone.height * SCALE

                const zoneContent = activeContent?.[zone.id]

                // Draw Text Zone
                if (zone.type === 'text') {
                    // Background & Box
                    const style = zoneContent?.style || {}

                    // Draw box background
                    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = style.backgroundColor
                        ctx.fillRect(scaledX, scaledY, scaledW, scaledH)
                    } else {
                        // Placeholder bg for empty text zones
                        ctx.fillStyle = '#f59e0b22' // Amber low opacity
                        ctx.fillRect(scaledX, scaledY, scaledW, scaledH)
                    }

                    // Render Text
                    if (zoneContent?.text) {
                        ctx.save()
                        // Clip to zone
                        ctx.beginPath()
                        ctx.rect(scaledX, scaledY, scaledW, scaledH)
                        ctx.clip()

                        // Apply Styles
                        const fontSize = (style.fontSize || 48) * SCALE
                        ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || 'sans-serif'}`
                        ctx.fillStyle = style.color || '#ffffff'
                        ctx.textAlign = style.textAlign || 'center'
                        ctx.textBaseline = 'middle'

                        // Shadow
                        if (style.shadowColor && style.shadowColor !== 'transparent') {
                            ctx.shadowColor = style.shadowColor
                            ctx.shadowBlur = (style.shadowBlur || 0) * SCALE
                            ctx.shadowOffsetX = (style.shadowOffsetX || 0) * SCALE
                            ctx.shadowOffsetY = (style.shadowOffsetY || 0) * SCALE
                        }

                        // Padding adjustment
                        const padding = (style.padding || 20) * SCALE
                        let xPos = scaledX + scaledW / 2
                        if (style.textAlign === 'left' || style.textAlign === 'start') xPos = scaledX + padding
                        if (style.textAlign === 'right' || style.textAlign === 'end') xPos = scaledX + scaledW - padding

                        // Simple Multi-line Handling (Split by newline)
                        const lines = String(zoneContent.text).split('\n')
                        const lineHeight = fontSize * (style.lineHeight || 1.2)
                        const totalTextHeight = lines.length * lineHeight
                        let yPos = scaledY + (scaledH - totalTextHeight) / 2 + (lineHeight / 2) // Vertically center block

                        lines.forEach((line: string) => {
                            ctx.fillText(line, xPos, yPos)

                            // Stroke (Outline)
                            if (style.strokeWidth > 0 && style.strokeColor !== 'transparent') {
                                ctx.strokeStyle = style.strokeColor
                                ctx.lineWidth = style.strokeWidth * SCALE
                                ctx.strokeText(line, xPos, yPos)
                            }

                            yPos += lineHeight
                        })

                        ctx.restore()
                    } else {
                        // Empty State Label
                        ctx.font = 'italic 10px Inter, sans-serif'
                        ctx.fillStyle = 'rgba(255,255,255,0.4)'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        ctx.fillText('Empty Text Zone', scaledX + scaledW / 2, scaledY + scaledH / 2)
                    }

                } else {
                    // Media Rendering (Video/Image) logic
                    let playlist = zoneContent?.playlist || []

                    // NEW: If source is a linked playlist, try to find it in playlistsData for preview
                    if (zoneContent?.sourceType === 'playlist' && zoneContent?.playlistId) {
                        const linkedPlaylist = playlistsData?.results?.find((p: any) => (p.id || p._id) === zoneContent.playlistId)
                        if (linkedPlaylist && linkedPlaylist.items) {
                            playlist = linkedPlaylist.items
                        }
                    }

                    // NEW: Apply strict type filtering for canvas preview
                    if (zone.type === 'image') {
                        playlist = playlist.filter((item: any) => item.type === 'image')
                    } else if (zone.type === 'video') {
                        playlist = playlist.filter((item: any) => item.type === 'video')
                    }

                    const currentIndex = playbackIndices[zone.id] || 0
                    const currentItem = playlist[currentIndex]

                    let drawPlaceholder = true

                    if (currentItem && currentItem.url) {
                        const cachedMedia = mediaCache.current[currentItem.url]

                        // Check type and drawImage
                        if (currentItem.type === 'video') {
                            let video = cachedMedia as HTMLVideoElement
                            if (!video || video.tagName !== 'VIDEO') {
                                video = document.createElement('video')
                                video.src = currentItem.url
                                video.muted = true
                                video.loop = true
                                video.play().catch(() => { })
                                mediaCache.current[currentItem.url] = video
                            }
                            if (video.readyState >= 2) {
                                ctx.drawImage(video, scaledX, scaledY, scaledW, scaledH)
                                drawPlaceholder = false
                            }
                        } else if (currentItem.type === 'image') {
                            let img = cachedMedia as HTMLImageElement
                            if (!img || img.tagName !== 'IMG') {
                                img = new Image()
                                img.src = currentItem.url
                                mediaCache.current[currentItem.url] = img
                            }
                            if (img.complete) {
                                ctx.drawImage(img, scaledX, scaledY, scaledW, scaledH)
                                drawPlaceholder = false
                            }
                        }
                    }

                    if (drawPlaceholder) {
                        let color = '#f59e0b'
                        if (zone.type === 'video') color = '#3b82f6'
                        if (zone.type === 'image') color = '#10b981'
                        if (zone.type === 'mixed') color = '#8b5cf6'

                        ctx.fillStyle = color + '44'
                        ctx.fillRect(scaledX, scaledY, scaledW, scaledH)

                        if (currentItem?.type === 'video') {
                            ctx.font = 'bold 8px Inter, sans-serif'
                            ctx.fillStyle = 'rgba(255,255,255,0.7)'
                            ctx.fillText('LOADING VIDEO...', scaledX + 4, scaledY + scaledH - 6)
                        }
                    }

                    // Playlist count badge
                    if (playlist.length > 0) {
                        ctx.fillStyle = 'rgba(0,0,0,0.6)'
                        ctx.fillRect(scaledX + scaledW - 16, scaledY + 2, 14, 12)
                        ctx.font = 'bold 9px Inter, sans-serif'
                        ctx.fillStyle = '#fff'
                        ctx.fillText(`${playlist.length}`, scaledX + scaledW - 14, scaledY + 11)
                    }
                }

                // Selection Highlights
                ctx.strokeStyle = selectedZoneId === zone.id ? '#fff' : 'rgba(255,255,255,0.2)'
                ctx.lineWidth = selectedZoneId === zone.id ? 3 : 1
                ctx.strokeRect(scaledX, scaledY, scaledW, scaledH)

                // Label
                ctx.font = 'bold 10px Inter, sans-serif'
                ctx.shadowColor = 'rgba(0,0,0,0.8)'
                ctx.shadowBlur = 4
                ctx.fillStyle = '#fff'
                ctx.fillText(zone.type.toUpperCase(), scaledX + 4, scaledY + 12)
                ctx.shadowBlur = 0
            })
        }

        let animationFrameId: number
        const render = () => {
            draw()
            animationFrameId = requestAnimationFrame(render)
        }
        render()
        return () => cancelAnimationFrame(animationFrameId)

    }, [selectedTemplate, selectedZoneId, activeContent, playbackIndices])

    // Handlers
    const handleZoneContentChange = (zoneId: string, newContentData: any, tabId: string = activeTab) => {
        if (tabId === 'default') {
            setDefaultContent((prev: any) => ({
                ...prev,
                [zoneId]: { ...prev[zoneId], ...newContentData }
            }))
        } else if (tabId.startsWith('schedule-')) {
            const index = parseInt(tabId.split('-')[1])
            const newSchedules = [...schedules]
            const currentZoneContent = newSchedules[index].content[zoneId] || { type: 'text' }
            newSchedules[index].content = {
                ...newSchedules[index].content,
                [zoneId]: { ...currentZoneContent, ...newContentData }
            }
            setSchedules(newSchedules)
        }
    }

    const saveScreen = async () => {
        if (!name) return toast({ title: 'Name required', variant: 'destructive' })
        if (!selectedTemplateId) return toast({ title: 'Template required', variant: 'destructive' })

        setIsSaving(true)
        try {
            const payload = {
                name,
                templateId: selectedTemplateId,
                defaultContent,
                schedules,
            }

            if (initialData?.id || initialData?._id) {
                await apiService.patch(`/v1/screens/${initialData.id || initialData._id}`, payload)
                toast({ title: 'Screen updated' })
            } else {
                await apiService.post('/v1/screens', payload)
                toast({ title: 'Screen created' })
            }
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            onCancel()
        } catch (error: any) {
            console.error(error)
            toast({ title: 'Failed to save', description: error.message, variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    const addSchedule = () => {
        setSchedules(prev => [...prev, {
            name: 'New Slot',
            startTime: '09:00',
            endTime: '17:00',
            daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri default
            priority: 1,
            content: {}
        }])
        setTimeout(() => setActiveTab(`schedule-${schedules.length}`), 0)
    }

    const removeSchedule = (index: number) => {
        setSchedules(prev => prev.filter((_, i) => i !== index))
        setActiveTab('default')
    }

    const updateSchedule = (index: number, field: string, value: any) => {
        setSchedules(prev => {
            const newS = [...prev]
            newS[index] = { ...newS[index], [field]: value }
            return newS
        })
    }

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !selectedTemplate) return
        const rect = canvasRef.current.getBoundingClientRect()
        // Determine scale if resized
        const scaleX = canvasRef.current.width / rect.width
        const scaleY = canvasRef.current.height / rect.height

        // internal coords
        const x = (e.clientX - rect.left) * scaleX
        const y = (e.clientY - rect.top) * scaleY

        const SCALE = 0.25

        const clickedZone = selectedTemplate.zones.find((z: any) => {
            const zx = z.x * SCALE
            const zy = z.y * SCALE
            const zw = z.width * SCALE
            const zh = z.height * SCALE
            // Check collision
            return x >= zx && x <= zx + zw && y >= zy && y <= zy + zh
        })

        if (clickedZone) {
            setSelectedZoneId(clickedZone.id)
        } else {
            setSelectedZoneId(null)
        }
    }

    const handleOpenCloudinaryWidget = async (zoneId: string) => {
        try {
            // @ts-ignore
            if (!window.cloudinary || !window.cloudinary.createMediaLibrary) {
                throw new Error("Cloudinary SDK not loaded. Please refresh the page.")
            }

            const { signature, timestamp, cloud_name, api_key } = await apiService.get<any>('/v1/cloudinary/signature', {
                params: { timestamp: Math.round(new Date().getTime() / 1000) }
            })

            // @ts-ignore
            const widget = window.cloudinary.createMediaLibrary({
                cloud_name, api_key, timestamp, signature,
                button_class: 'hidden', multiple: true, max_files: 15, z_index: 9999
            }, {
                insertHandler: (data: any) => {
                    if (data && data.assets) {
                        const newPlaylistItems = data.assets.map((asset: any) => ({
                            url: asset.secure_url,
                            type: asset.resource_type === 'video' || asset.secure_url.match(/\.(mp4|mov)$/i) ? 'video' : 'image',
                            duration: 10
                        }))

                        // Merge with existing
                        const currentPlaylist = activeContent[zoneId]?.playlist || []
                        handleZoneContentChange(zoneId, { playlist: [...currentPlaylist, ...newPlaylistItems] })
                        toast({ title: `Added ${newPlaylistItems.length} items` })
                    }
                }
            })
            widget.show()
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    }

    const renderMediaSection = () => (
        <div ref={mediaSectionRef} className={`flex flex-col gap-4 border-t pt-8 ${selectedZoneId ? 'border-none pt-0 pb-8 border-b' : ''}`}>
            <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>Media Content per Zone</h3>
            <div className='flex flex-col gap-2'>
                <Label className='text-xs opacity-70'>Manage content below:</Label>
                <div className='flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-2 border rounded-md p-2 bg-muted/5'>
                    {!selectedTemplate || selectedTemplate.zones.length === 0 ? (
                        <p className='text-xs text-muted-foreground italic p-2'>No zones in this template</p>
                    ) : (
                        selectedTemplate.zones.map((zone: any) => {
                            const zoneContent = activeContent?.[zone.id]
                            const hasContent = zone.type === 'text'
                                ? !!(zoneContent?.text)
                                : (zoneContent?.playlist && zoneContent.playlist.length > 0)

                            const isSelected = selectedZoneId === zone.id || (selectedZoneId && selectedZoneId.toLowerCase() === zone.id.toLowerCase())

                            return (
                                <div
                                    key={zone.id}
                                    className={`flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors cursor-pointer border ${isSelected
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-background hover:bg-muted border-transparent'
                                        }`}
                                    onClick={() => setSelectedZoneId(zone.id)}
                                >
                                    <div className='flex items-center gap-2 overflow-hidden flex-1 min-w-0'>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${zone.type === 'video' ? 'bg-blue-500' :
                                            zone.type === 'image' ? 'bg-green-500' :
                                                zone.type === 'text' ? 'bg-orange-500' : 'bg-purple-500'
                                            }`} />
                                        <span className='truncate font-medium text-xs'>{zone.name || zone.id}</span>
                                        <span className='text-[9px] opacity-60 uppercase flex-shrink-0'>({zone.type})</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                        {hasContent && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-primary-foreground/20 text-white' : 'bg-primary/10 text-primary'
                                                }`}>
                                                {zone.type === 'text' ? 'TXT' : zoneContent?.playlist?.length || 0}
                                            </span>
                                        )}
                                        {zone.type !== 'text' && (
                                            <>
                                                {zoneContent?.sourceType === 'playlist' ? (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500`}>
                                                        LINKED
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant={isSelected ? "secondary" : "outline"}
                                                        className={`h-6 w-auto px-2 gap-1 text-[10px] ${isSelected ? 'bg-white/20 hover:bg-white/30 text-white border-transparent' : 'text-muted-foreground hover:text-foreground'}`}
                                                        onClick={(e) => { e.stopPropagation(); handleOpenCloudinaryWidget(zone.id); }}
                                                        title="Quickly add media from Cloudinary"
                                                    >
                                                        <IconCloudUpload size={12} />
                                                        <span className="hidden sm:inline">Add Media</span>
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Active Zone Editor */}
            <div className='mt-2'>
                {selectedZoneId ? (
                    <div className='animate-in fade-in slide-in-from-bottom-2 border border-primary/20 rounded-xl p-0 overflow-hidden bg-primary/5 shadow-inner'>
                        <div className='flex items-center justify-between px-4 py-2 border-b border-primary/10 bg-primary/10'>
                            <div className='flex items-center gap-2'>
                                <div className='w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' />
                                <h4 className='text-xs font-bold uppercase tracking-widest text-primary'>
                                    {selectedTemplate?.zones.find((z: any) => z.id === selectedZoneId || z.id.toLowerCase() === selectedZoneId.toLowerCase())?.name || selectedZoneId}
                                </h4>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-primary/20 rounded-full" onClick={() => setSelectedZoneId(null)}>×</Button>
                        </div>
                        <div className='p-4'>
                            {activeContent && activeContent[selectedZoneId] && (
                                <>
                                    {selectedTemplate?.zones.find((z: any) => z.id === selectedZoneId || z.id.toLowerCase() === selectedZoneId.toLowerCase())?.type === 'text' ? (
                                        <TextZoneEditor
                                            key={selectedZoneId}
                                            zone={selectedTemplate?.zones.find((z: any) => z.id === selectedZoneId || z.id.toLowerCase() === selectedZoneId.toLowerCase())}
                                            content={activeContent[selectedZoneId]}
                                            onChange={(newContent) => handleZoneContentChange(selectedZoneId, newContent)}
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            {/* Guided Media Type Message */}
                                            {(() => {
                                                const zone = selectedTemplate?.zones.find((z: any) => (z.id || z._id) === selectedZoneId || (z.id || z._id)?.toLowerCase() === selectedZoneId?.toLowerCase())
                                                if (zone?.type === 'image') {
                                                    return (
                                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                            <p className="text-xs font-medium text-green-600">
                                                                <span className="font-bold uppercase mr-1">Photo only zone:</span>
                                                                Only images from your playlist will be displayed here.
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                if (zone?.type === 'video') {
                                                    return (
                                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                            <p className="text-xs font-medium text-blue-600">
                                                                <span className="font-bold uppercase mr-1">Video only zone:</span>
                                                                Only videos from your playlist will be played here.
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            })()}

                                            {/* Source Toggle */}
                                            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                                                <button
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeContent[selectedZoneId].sourceType !== 'playlist'
                                                        ? 'bg-background shadow text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    onClick={() => handleZoneContentChange(selectedZoneId, { sourceType: 'local' })}
                                                >
                                                    Custom Content
                                                </button>
                                                <button
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeContent[selectedZoneId].sourceType === 'playlist'
                                                        ? 'bg-background shadow text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    onClick={() => handleZoneContentChange(selectedZoneId, { sourceType: 'playlist' })}
                                                >
                                                    Shared Playlist
                                                </button>
                                            </div>

                                            {activeContent[selectedZoneId].sourceType === 'playlist' ? (
                                                <div className="space-y-4 p-4 border rounded-lg bg-card">
                                                    <div className="flex items-center gap-2 text-indigo-500 mb-2">
                                                        <IconPlaylist size={20} />
                                                        <h4 className="font-semibold text-sm">Linked Playlist</h4>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Select a shared playlist to display in this zone. Content updates to the shared playlist will automatically appear here.
                                                    </p>
                                                    <div className="grid gap-2">
                                                        <Label>Select Playlist</Label>
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                            value={activeContent[selectedZoneId].playlistId || ''}
                                                            onChange={(e) => handleZoneContentChange(selectedZoneId, { playlistId: e.target.value })}
                                                        >
                                                            <option value="">-- Choose a Playlist --</option>
                                                            {playlistsData?.results?.map((p: Playlist) => (
                                                                <option key={p.id} value={p.id}>{p.name} ({p.items.length} items)</option>
                                                            ))}
                                                        </select>
                                                        {activeContent[selectedZoneId].playlistId && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Authentication: {playlistsData?.results?.find((p: Playlist) => p.id === activeContent[selectedZoneId].playlistId)?.items.length || 0} items will be played.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <PlaylistEditor
                                                    key={selectedZoneId}
                                                    zone={selectedTemplate?.zones.find((z: any) => z.id === selectedZoneId || z.id.toLowerCase() === selectedZoneId.toLowerCase())}
                                                    items={activeContent[selectedZoneId].playlist || []}
                                                    onChange={(items) => handleZoneContentChange(selectedZoneId, { playlist: items })}
                                                />
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5'>
                        <p className='text-sm'>No zone selected</p>
                        <p className='text-xs opacity-60'>Select a zone from the list above to manage content</p>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className='flex flex-col gap-6 lg:flex-row h-[calc(100vh-140px)]'>
            {/* Left: Configuration & Playlist */}
            <div className='flex flex-1 flex-col gap-6 overflow-hidden'>
                <Card className='flex flex-col p-6 shadow-md h-full overflow-hidden'>
                    <div className='mb-6 flex items-center gap-4 flex-shrink-0'>
                        <Button variant="ghost" size="icon" onClick={onCancel}><IconArrowLeft size={18} /></Button>
                        <h3 className='text-lg font-semibold'>{initialData ? 'Edit Screen' : 'New Screen'}</h3>
                        <div className='ml-auto flex gap-2'>
                            {(initialData?.id || initialData?._id) && (
                                <Button variant="outline" onClick={() => {
                                    let key = initialData.secretKey || '';
                                    if (key.length > 32 && key.includes('673f')) key = key.replace('673f', '');
                                    window.open(`/player/${initialData.id || initialData._id}${key ? `?key=${key}` : ''}`, '_blank')
                                }}>
                                    <IconPlayerPlay className='mr-2' size={18} />
                                    Preview
                                </Button>
                            )}
                            <Button loading={isSaving} onClick={saveScreen}>
                                <IconDeviceFloppy className='mr-2' size={18} />
                                Save
                            </Button>
                        </div>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-3 flex-shrink-0 mb-6'>
                        <div className='grid gap-2'>
                            <Label htmlFor='name'>Screen Name</Label>
                            <Input id='name' placeholder='Lobby Display 1' value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className='grid gap-2'>
                            <Label>Template</Label>
                            <Select
                                value={selectedTemplateId}
                                onValueChange={setSelectedTemplateId}
                                disabled={!!initialData?.id}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templatesData?.results?.filter((t: Template) => t.id).map((t: Template) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <span>{t.name} ({t.resolution})</span>
                                                {t.id === latestTemplateId && (
                                                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 border border-primary/20">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedTemplate && (
                        <div className='flex flex-col gap-4 h-full overflow-hidden'>

                            <div className='flex-shrink-0'>
                                <ScheduleManager
                                    schedules={schedules}
                                    activeTab={activeTab}
                                    onAddSchedule={addSchedule}
                                    onRemoveSchedule={removeSchedule}
                                    onUpdateSchedule={updateSchedule}
                                    onTabChange={setActiveTab}
                                />
                            </div>

                            <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar'>
                                {selectedTemplate && renderMediaSection()}
                            </div>
                        </div>
                    )}
                </Card>
            </div >

            {/* Right: Visual Map */}
            {
                selectedTemplate && (
                    <div className='w-full lg:w-[480px]'>
                        <Card className='p-4 sticky top-6 bg-muted/30'>
                            <h4 className='mb-3 font-semibold'>Visual Map</h4>
                            <div className='rounded-lg bg-black p-2 shadow-inner'>
                                <div className='relative w-full bg-slate-900 overflow-hidden rounded border border-gray-800 flex justify-center'>
                                    <canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-pointer max-w-full h-auto" />
                                </div>
                            </div>
                            <p className='mt-2 text-xs text-muted-foreground text-center italic'>
                                Click on a zone above to select it.
                            </p>
                        </Card>
                    </div>
                )
            }
        </div >
    )
}
