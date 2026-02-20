import { useRef, useState, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
    IconSquare,
    IconVideo,
    IconLetterT,
    IconDeviceTv,
    IconTrash,
    IconDeviceFloppy
} from '@tabler/icons-react'
import { toast } from '@/components/ui/use-toast'
import { templateService } from '@/api/template.service'
import { templateGroupService } from '@/api/template-group.service'
import { useQueryClient } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { Globe, Lock, Eye } from 'lucide-react'
import { PreviewModal } from '@/components/preview-modal'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GLOBAL_SCALE } from '@/utilities/fabric-utils'
import { useNotifications } from '@/components/nav-notification-provider'
import { CollaborateDialog } from './collaborate-dialog'
import { Users } from 'lucide-react'

interface Zone {
    id: string
    type: 'image' | 'video' | 'text' | 'mixed'
    name: string
    x: number
    y: number
    width: number
    height: number
    media?: any[]
    mediaType?: 'image' | 'video' | 'both'
    lockedMediaType?: 'image' | 'video' | 'both' | null
}

interface TemplateEditorProps {
    initialData?: any
    onCancel: () => void
}

export default function TemplateEditor({ initialData, onCancel }: TemplateEditorProps) {
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<fabric.Canvas | null>(null)
    const { socket } = useNotifications()

    // State
    const [zones, setZones] = useState<Zone[]>(initialData?.zones || [])
    const [templateName, setTemplateName] = useState(initialData?.name || 'New Template')
    const [isPublic, setIsPublic] = useState(initialData?.isPublic || false)
    const [collaborators, setCollaborators] = useState<any[]>(initialData?.collaborators || [])
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
    const [clipboard, setClipboard] = useState<Zone | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [resolution, setResolution] = useState(initialData?.resolution || '1920x1080')
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isCollaborateOpen, setIsCollaborateOpen] = useState(false)

    const queryClient = useQueryClient()

    // --- SOCKET SYNC ---
    useEffect(() => {
        const templateId = initialData?.id || initialData?._id
        if (!socket || !templateId) return

        console.log('[COLLAB] Joining template room:', templateId)
        socket.emit('join_template', templateId)

        const handleRemoteUpdate = (data: any) => {
            if (data.templateId !== templateId) return
            console.log('[COLLAB] Remote update received:', data)

            if (data.zones) {
                setZones(data.zones)
                if (canvasRef.current) {
                    const canvas = canvasRef.current
                    data.zones.forEach((remoteZone: Zone) => {
                        // Find the object (now a Group) by its custom id
                        const obj = canvas.getObjects().find((o: any) => o.id === remoteZone.id) as any
                        if (obj) {
                            // Update group instance directly
                            obj.set({
                                left: remoteZone.x * SCALE,
                                top: remoteZone.y * SCALE,
                                scaleX: (remoteZone.width * SCALE) / (obj.width * (obj.scaleX || 1) / (obj.scaleX || 1)), // preserve original base width logic if needed
                                scaleY: (remoteZone.height * SCALE) / (obj.height * (obj.scaleY || 1) / (obj.scaleY || 1)),
                            })

                            // For Groups, we just set the scale relative to their current size
                            // If it's a Group containing a Rect(width) and Text, the Group's width is the Rect's width
                            const baseWidth = obj.width || 100
                            const baseHeight = obj.height || 100

                            obj.set({
                                scaleX: (remoteZone.width * SCALE) / baseWidth,
                                scaleY: (remoteZone.height * SCALE) / baseHeight
                            })

                            obj.setCoords()
                        } else {
                            addZoneToCanvas(canvas, remoteZone)
                        }
                    })

                    const remoteIds = new Set(data.zones.map((z: any) => z.id))
                    canvas.getObjects().forEach((o: any) => {
                        if (o.id && !remoteIds.has(o.id)) {
                            canvas.remove(o)
                        }
                    })

                    canvas.requestRenderAll()
                }
            }

            if (data.name !== undefined) setTemplateName(data.name)
            if (data.isPublic !== undefined) setIsPublic(data.isPublic)
        }

        socket.on('template_updated', handleRemoteUpdate)

        return () => {
            socket.off('template_updated', handleRemoteUpdate)
        }
    }, [socket, initialData])

    const broadcastUpdate = (updates: any) => {
        const templateId = initialData?.id || initialData?._id
        if (!socket || !templateId) return

        socket.emit('template_edit', {
            templateId,
            ...updates
        })
    }

    // Constants & Derived Values
    const RESOLUTIONS = [
        { label: 'Landscape TV', value: '1920x1080', icon: '🖥️' },
        { label: 'Portrait TV / Vertical', value: '1080x1920', icon: '📱' },
        { label: '4K Landscape', value: '3840x2160', icon: '🌟' },
        { label: '4K Portrait', value: '2160x3840', icon: '🌟' },
        { label: 'Standard HD', value: '1280x720', icon: '📺' },
        { label: 'Square', value: '1080x1080', icon: '📐' },
    ]

    const [screenWidth, screenHeight] = resolution.split('x').map(Number)

    const SCALE = GLOBAL_SCALE
    const CANVAS_WIDTH = screenWidth * SCALE
    const CANVAS_HEIGHT = screenHeight * SCALE
    const GRID_SIZE = 20 * SCALE // Increased for better alignment

    const selectedZone = zones.find(z => z.id === selectedZoneId)


    const getZoneColor = (type: string, alpha: string = '40') => {
        const opacity = alpha === '40' ? 0.4 : 0.8
        switch (type) {
            case 'image': return `rgba(34, 197, 94, ${opacity})` // green
            case 'video': return `rgba(59, 130, 246, ${opacity})` // blue
            case 'text': return `rgba(168, 85, 247, ${opacity})` // purple
            case 'mixed': return `rgba(234, 179, 8, ${opacity})` // yellow
            default: return `rgba(100, 116, 139, ${opacity})`
        }
    }

    const addZoneToCanvas = (canvas: fabric.Canvas, zone: Zone) => {
        const color = getZoneColor(zone.type, '40')
        const borderColor = getZoneColor(zone.type, '80').replace('0.8', '1')

        const width = zone.width * SCALE
        const height = zone.height * SCALE

        const rect = new fabric.Rect({
            width: width,
            height: height,
            fill: color,
            stroke: borderColor,
            strokeWidth: 2,
            strokeUniform: true,
            originX: 'center',
            originY: 'center',
        })

        const labelText = (zone.type || 'mixed').toUpperCase() + ' ZONE'
        const text = new fabric.Text(labelText, {
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'bold',
            fill: 'rgba(255, 255, 255, 0.9)',
            originX: 'center',
            originY: 'center',
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.5)',
                blur: 4,
                offsetX: 1,
                offsetY: 1
            })
        })

        const group = new fabric.Group([rect, text], {
            left: zone.x * SCALE,
            top: zone.y * SCALE,
            originX: 'left',
            originY: 'top',
            // @ts-ignore
            id: zone.id,
            // @ts-ignore
            zoneType: zone.type,
            lockRotation: true,
            hasRotatingPoint: false,
            transparentCorners: false,
            cornerColor: '#ffffff',
            cornerStrokeColor: borderColor,
            cornerSize: 10,
            cornerStyle: 'circle',
            borderColor: borderColor,
        })

        // Enable all 8 resize handles
        group.setControlsVisibility({
            mt: true, mb: true, ml: true, mr: true,
            tl: true, tr: true, bl: true, br: true,
            mtr: false
        })

        canvas.add(group)
        // Set initial valid position
        // @ts-ignore
        group._lastValidLeft = group.left
        // @ts-ignore
        group._lastValidTop = group.top
        return group
    }

    const constrainObject = (obj: any) => {
        if (!obj || !canvasRef.current) return

        const cw = canvasRef.current.getWidth()
        const ch = canvasRef.current.getHeight()

        obj.setCoords()

        // 1. Minimum Size
        const MIN_SIZE = Math.max(50 * SCALE, 20)
        let sX = obj.scaleX
        let sY = obj.scaleY

        if (obj.getScaledWidth() < MIN_SIZE) {
            sX = MIN_SIZE / obj.width
        }
        if (obj.getScaledHeight() < MIN_SIZE) {
            sY = MIN_SIZE / obj.height
        }

        // 2. Scale clamping
        if (obj.width * sX > cw) sX = cw / obj.width
        if (obj.height * sY > ch) sY = ch / obj.height

        obj.set({ scaleX: sX, scaleY: sY })
        obj.setCoords()

        // 3. Position Clamping
        const finalBr = obj.getBoundingRect()
        let l = obj.left
        let t = obj.top

        if (finalBr.left < 0) {
            l = 0
        } else if (finalBr.left + finalBr.width > cw) {
            l = cw - finalBr.width
        }

        if (finalBr.top < 0) {
            t = 0
        } else if (finalBr.top + finalBr.height > ch) {
            t = ch - finalBr.height
        }

        obj.set({ left: l, top: t })
        obj.setCoords()

        // 3. Overlap Check (Disabled)
        // checkOverlaps(obj)
    }



    const handleRealtimeUpdate = (obj: any) => {
        if (!obj || !canvasRef.current) return
        constrainObject(obj)
        canvasRef.current.requestRenderAll()
    }

    const syncToState = (obj: any) => {
        if (!obj) return
        const id = obj.id
        setZones(prev => prev.map(z => {
            if (z.id !== id) return z
            return {
                ...z,
                x: Math.round(obj.left / SCALE),
                y: Math.round(obj.top / SCALE),
                width: Math.round(obj.getScaledWidth() / SCALE),
                height: Math.round(obj.getScaledHeight() / SCALE),
            }
        }))
    }

    const handleObjectModified = (obj: any) => {
        if (!obj) return

        // 1. Snap to grid
        let left = Math.round(obj.left / GRID_SIZE) * GRID_SIZE
        let top = Math.round(obj.top / GRID_SIZE) * GRID_SIZE
        obj.set({ left, top })

        // 2. Then constrain strictly (boundaries)
        constrainObject(obj)

        // 3. Last valid position tracking (optional now, but good for other bounds)
        obj._lastValidLeft = obj.left
        obj._lastValidTop = obj.top

        if (canvasRef.current) canvasRef.current.requestRenderAll()
        syncToState(obj)

        // Broadcast collab update
        const id = obj.id
        const newZones = zones.map(z => {
            if (z.id !== id) return z
            return {
                ...z,
                x: Math.round(obj.left / SCALE),
                y: Math.round(obj.top / SCALE),
                width: Math.round(obj.getScaledWidth() / SCALE),
                height: Math.round(obj.getScaledHeight() / SCALE),
            }
        })
        broadcastUpdate({ zones: newZones })
    }

    // ================= ACTIONS =================
    const addZone = (type: 'image' | 'video' | 'text' | 'mixed') => {
        const zoneWidth = 400
        const zoneHeight = 300

        // Ensure initial position is safe
        const newZone: Zone = {
            id: `zone-${Date.now()}`,
            name: `${type} region`,
            type,
            x: (screenWidth - zoneWidth) / 2, // Center horizontally
            y: (screenHeight - zoneHeight) / 2, // Center vertically
            width: zoneWidth,
            height: zoneHeight,
            media: [],
            mediaType: 'both',
            lockedMediaType: null
        }

        const nextZones = [...zones, newZone]
        setZones(nextZones)
        broadcastUpdate({ zones: nextZones })

        if (canvasRef.current) {
            const rect = addZoneToCanvas(canvasRef.current, newZone)
                ; (rect as any).bringToFront()
            canvasRef.current.setActiveObject(rect)
            setSelectedZoneId(newZone.id)
            canvasRef.current.requestRenderAll()
        }
    }

    const pasteZone = (template: Zone) => {
        const offset = 20
        const newZone: Zone = {
            ...template,
            id: `zone-${Date.now()}`,
            name: `${template.name} (Copy)`,
            x: Math.min(CANVAS_WIDTH / SCALE - template.width - offset, Math.max(0, template.x + offset)),
            y: Math.min(CANVAS_HEIGHT / SCALE - template.height - offset, Math.max(0, template.y + offset)),
        }

        setZones(prev => [...prev, newZone])
        if (canvasRef.current) {
            const rect = addZoneToCanvas(canvasRef.current, newZone)
                ; (rect as any).bringToFront()
            canvasRef.current.setActiveObject(rect)
            setSelectedZoneId(newZone.id)
            canvasRef.current.requestRenderAll()
            toast({ title: 'Zone pasted' })
        }
    }

    const deleteSelected = useCallback(() => {
        if (!canvasRef.current) return

        // Support multi-delete
        const activeObjects = canvasRef.current.getActiveObjects()
        if (activeObjects.length > 0) {
            const idsToDelete = new Set(activeObjects.map((o: any) => o.id))

            canvasRef.current.discardActiveObject()
            canvasRef.current.remove(...activeObjects)
            canvasRef.current.requestRenderAll()

            setZones(prev => {
                const nextZones = prev.filter(z => !idsToDelete.has(z.id))
                broadcastUpdate({ zones: nextZones })
                return nextZones
            })
            setSelectedZoneId(null)
            toast({ title: `${activeObjects.length} zone(s) removed` })
        }
    }, [socket, initialData, zones])

    const saveTemplate = async () => {
        if (zones.length === 0) {
            toast({ title: 'Add at least one zone', variant: 'destructive' })
            return
        }
        if (!templateName.trim() || templateName === 'New Template') {
            toast({ title: 'Please provide a unique, descriptive name for your template', variant: 'destructive' })
            return
        }

        setIsSaving(true)
        try {
            // Sync order from canvas to preserve stacking (z-index)
            let orderedZones = zones
            if (canvasRef.current) {
                const objects = canvasRef.current.getObjects()
                orderedZones = objects
                    .map((obj: any) => zones.find(z => z.id === obj.id))
                    .filter(Boolean) as Zone[]
            }

            const payload = {
                name: templateName,
                resolution,
                zones: orderedZones,
                isPublic,
            }

            if (initialData?.id || initialData?._id) {
                await templateService.updateTemplate(initialData.id || initialData._id, payload)
            } else {
                const newTemplate = await templateService.createTemplate(payload)
                // Auto-assign to group if requested
                if (initialData?.autoAssignGroupId && newTemplate?.id) {
                    await templateGroupService.addTemplatesToGroup(initialData.autoAssignGroupId, [newTemplate.id])
                    queryClient.invalidateQueries({ queryKey: ['template-groups'] })
                }
            }

            queryClient.invalidateQueries({ queryKey: ['templates'] })
            toast({ title: initialData?.id ? 'Template updated!' : 'Template saved!' })
            onCancel()
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }
    // ================= INITIALIZE FABRIC =================
    useEffect(() => {
        if (!canvasContainerRef.current) return

        let canvas: fabric.Canvas

        try {
            // 🧹 Clean up previous canvas to prevent "ghost" canvases
            canvasContainerRef.current.innerHTML = ''
            const el = document.createElement('canvas')
            canvasContainerRef.current.appendChild(el)

            canvas = new fabric.Canvas(el, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: 'transparent',
                preserveObjectStacking: true,
                selection: true,
            })


            canvasRef.current = canvas

            // Load initial zones & Enforce boundaries for current resolution
            zones.forEach(zone => {
                const rect = addZoneToCanvas(canvas, zone)
                constrainObject(rect) // Snap to current resolution bounds
                syncToState(rect)
            })

            // Event Listeners
            canvas.on('object:moving', (e) => handleRealtimeUpdate(e.target))
            canvas.on('object:scaling', (e) => handleRealtimeUpdate(e.target))
            canvas.on('object:modified', (e) => handleObjectModified(e.target))

            canvas.on('mouse:down', (options) => {
                if (options.target) {
                    const obj = options.target as any
                    obj.setCoords()
                    canvas.renderAll()
                }
            })

            canvas.on('selection:created', (e) => {
                const obj = e.selected?.[0] as any
                if (obj) {
                    obj._lastValidLeft = obj.left
                    obj._lastValidTop = obj.top
                    // @ts-ignore
                    obj.bringToFront()
                    constrainObject(obj)
                    obj.setCoords()
                    canvas.renderAll()
                    if (obj.id) setSelectedZoneId(obj.id)
                }
            })
            canvas.on('selection:updated', (e) => {
                const obj = e.selected?.[0] as any
                if (obj) {
                    obj._lastValidLeft = obj.left
                    obj._lastValidTop = obj.top
                    // @ts-ignore
                    obj.bringToFront()
                    constrainObject(obj)
                    obj.setCoords()
                    canvas.renderAll()
                    if (obj.id) setSelectedZoneId(obj.id)
                }
            })
            canvas.on('selection:cleared', () => setSelectedZoneId(null))

        } catch (error) {
            console.error('Fabric init error:', error)
            toast({ title: 'Editor Error', description: 'Failed to initialize canvas', variant: 'destructive' })
        }

        return () => {
            if (canvas) {
                canvas.dispose()
            }
            canvasRef.current = null
        }
    }, [resolution]) // Re-init on resolution change

    // ================= KEYBOARD SHORTCUTS =================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

            if (!canvasRef.current) return

            // DELETE / BACKSPACE
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                deleteSelected()
                return
            }

            // COPY (Ctrl+C)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                // If user has selected text on the page, don't intercept standard copy
                if (window.getSelection()?.toString()) return

                const active = canvasRef.current.getActiveObject()
                // Only support single copy for now for simplicity, or finding first zone
                if (active) {
                    // @ts-ignore
                    const id = active.id || (active._objects?.[0]?.id)
                    const zone = zones.find(z => z.id === id)
                    if (zone) {
                        setClipboard(zone)
                        toast({ title: 'Zone copied' })
                    }
                }
                return
            }

            // PASTE (Ctrl+V)
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (clipboard) {
                    pasteZone(clipboard)
                }
                return
            }

            // ARROW KEYS (Nudge)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
                const active = canvasRef.current.getActiveObject()
                if (!active) return

                const STEP = e.shiftKey ? 10 : 1 // Shift for larger jumps
                if (e.key === 'ArrowUp') active.top! -= STEP
                if (e.key === 'ArrowDown') active.top! += STEP
                if (e.key === 'ArrowLeft') active.left! -= STEP
                if (e.key === 'ArrowRight') active.left! += STEP

                active.setCoords()
                constrainObject(active) // Ensure nudge respects bounds
                canvasRef.current.requestRenderAll()
                syncToState(active)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [zones, clipboard, deleteSelected]) // Access latest zones/clipboard


    // Customize your own resolution support
    const checkPreset = (res: string) => {
        const found = RESOLUTIONS.find(r => r.value === res)
        return found ? res : 'custom'
    }

    const [selectedPreset, setSelectedPreset] = useState<string>(checkPreset(initialData?.resolution || '1920x1080'))

    // Sync external resolution changes if needed, but mainly we drive it.

    const handlePresetChange = (val: string) => {
        setSelectedPreset(val)
        if (val !== 'custom') {
            setResolution(val)
        }
    }

    const handleCustomDimensionChange = (dim: 'w' | 'h', val: string) => {
        const num = parseInt(val) || 0
        if (dim === 'w') {
            setResolution(`${num}x${screenHeight}`)
        } else {
            setResolution(`${screenWidth}x${num}`)
        }
    }

    // Zoom State
    const [zoomLevel, setZoomLevel] = useState(1)

    const handleZoom = (delta: number) => {
        setZoomLevel(prev => Math.min(Math.max(0.1, prev + delta), 5))
    }

    const resetZoom = () => setZoomLevel(1)

    return (
        <div className='flex h-[calc(100vh-40px)] gap-6 overflow-hidden'>
            <Card className='flex w-72 flex-col p-4 shadow-lg h-full overflow-hidden flex-shrink-0'>
                {/* ... Sidebar content remains ... */}
                <div className='flex flex-1 flex-col overflow-y-auto pr-2 custom-scrollbar'>
                    <h3 className='mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground'>Resolution Preset</h3>
                    <div className='mb-6 space-y-3'>
                        <Select value={selectedPreset} onValueChange={handlePresetChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                {RESOLUTIONS.map((res) => (
                                    <SelectItem key={res.value} value={res.value}>
                                        <div className="flex items-center gap-2">
                                            <span>{res.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">{res.label}</span>
                                                <span className="text-[10px] opacity-60">{res.value}</span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom">
                                    <div className="flex items-center gap-2">
                                        <span>✏️</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Custom</span>
                                            <span className="text-[10px] opacity-60">Define your own</span>
                                        </div>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {selectedPreset === 'custom' && (
                            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground">Width (px)</Label>
                                    <Input
                                        type="number"
                                        value={screenWidth}
                                        onChange={(e) => handleCustomDimensionChange('w', e.target.value)}
                                        className="h-8 text-xs"
                                        min={100}
                                        max={7680}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground">Height (px)</Label>
                                    <Input
                                        type="number"
                                        value={screenHeight}
                                        onChange={(e) => handleCustomDimensionChange('h', e.target.value)}
                                        className="h-8 text-xs"
                                        min={100}
                                        max={7680}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <h3 className='mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground'>Toolbox</h3>
                    <div className='flex flex-col gap-2'>
                        <Button variant='outline' className='justify-start' onClick={() => addZone('image')}>
                            <IconSquare className='mr-2' size={18} />
                            Image Zone
                        </Button>
                        <Button variant='outline' className='justify-start' onClick={() => addZone('video')}>
                            <IconVideo className='mr-2' size={18} />
                            Video Zone
                        </Button>
                        <Button variant='outline' className='justify-start' onClick={() => addZone('text')}>
                            <IconLetterT className='mr-2' size={18} />
                            Text Zone
                        </Button>
                        <Button variant='outline' className='justify-start' onClick={() => addZone('mixed')}>
                            <IconDeviceTv className='mr-2' size={18} />
                            Mixed Zone
                        </Button>
                    </div>

                    <div className='mt-6 flex flex-col gap-2 border-t pt-4'>
                        <h4 className='text-sm font-bold uppercase text-muted-foreground mb-2'>Zones</h4>
                        <div className='flex flex-col gap-1'>
                            {zones.map(zone => (
                                <div
                                    key={zone.id}
                                    className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer ${selectedZoneId === zone.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted font-medium'}`}
                                    onClick={() => {
                                        const canvas = canvasRef.current
                                        if (!canvas) return
                                        const obj = canvas.getObjects().find((o: any) => o.id === zone.id)
                                        if (obj) {
                                            canvas.setActiveObject(obj)
                                            // @ts-ignore
                                            obj.bringToFront()
                                            obj.setCoords()
                                            canvas.renderAll()
                                            setSelectedZoneId(zone.id)
                                        }
                                    }}
                                >
                                    <div className='flex items-center gap-2 truncate flex-1'>
                                        <div
                                            className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-sm"
                                            style={{ backgroundColor: getZoneColor(zone.type, '80').replace('0.8', '1') }}
                                        />
                                        <span className='truncate font-bold'>{zone.name || (zone.type.charAt(0).toUpperCase() + zone.type.slice(1) + ' Zone')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedZone && (
                        <div className='mt-8 flex flex-col gap-4 border-t pt-4'>
                            <h4 className='text-sm font-bold uppercase text-muted-foreground'>Properties</h4>
                            <div>
                                <Label>Type</Label>
                                <div className='text-sm font-semibold capitalize'>{selectedZone.type}</div>
                            </div>
                            <div>
                                <Label>Position</Label>
                                <div className='text-xs text-muted-foreground uppercase'>X: {selectedZone.x} Y: {selectedZone.y}</div>
                            </div>

                            <div>
                                <Label>Size</Label>
                                <div className='text-xs text-muted-foreground uppercase'>W: {selectedZone.width} H: {selectedZone.height}</div>
                            </div>

                            {selectedZone.type === 'mixed' && (
                                <div>
                                    <Label>Media Type</Label>
                                    <div className="mt-1">
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            value={selectedZone.lockedMediaType || selectedZone.mediaType || 'both'}
                                            onChange={(e) => {
                                                const val = e.target.value as any
                                                setZones(prev => prev.map(z => z.id === selectedZoneId ? {
                                                    ...z,
                                                    mediaType: val,
                                                    lockedMediaType: val === 'both' ? 'both' : (z.lockedMediaType ? val : null)
                                                } : z))
                                            }}
                                        >
                                            <option value="both">Both (Image & Video)</option>
                                            <option value="image">Image Only</option>
                                            <option value="video">Video Only</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <Button variant='destructive' size='sm' onClick={deleteSelected} className="mt-2">
                                <IconTrash className='mr-2' size={16} />
                                Delete Zone
                            </Button>
                        </div>
                    )}
                </div>

                <div className='mt-auto flex flex-col gap-2 border-t pt-4'>
                    <Button variant='ghost' size="sm" onClick={onCancel}>Cancel</Button>
                    <Button loading={isSaving} size="sm" onClick={saveTemplate}>
                        <IconDeviceFloppy className='mr-2' size={18} />
                        Save Layout
                    </Button>
                </div>
            </Card>

            <div className='relative flex-1 flex flex-col overflow-hidden rounded-lg bg-muted/20 p-2 lg:p-4'>
                <div className='mb-2 flex flex-col gap-2 bg-background/50 p-3 rounded-xl border border-primary/10 shadow-sm'>
                    {/* Top Row: Title ONLY */}
                    <div className='flex items-center gap-4 w-full'>
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <IconDeviceTv className="text-primary" size={20} />
                        </div>
                        <Input
                            value={templateName}
                            onChange={(e) => {
                                setTemplateName(e.target.value)
                                broadcastUpdate({ name: e.target.value })
                            }}
                            className='max-w-lg text-lg font-bold bg-background border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 p-0 text-foreground'
                            placeholder="Template Name"
                        />
                    </div>

                    {/* Bottom Row: All Controls */}
                    <div className='flex flex-wrap items-center justify-between gap-4 w-full border-t border-primary/5 pt-2'>

                        {/* Left Group: Public Toggle */}
                        <div className='flex items-center gap-3 bg-background px-4 py-2 rounded-full border border-primary/20 shadow-sm hover:border-primary/40'>
                            {isPublic ? <Globe size={14} className="text-primary animate-pulse" /> : <Lock size={14} className="text-muted-foreground" />}
                            <Label htmlFor='is-public' className='text-[10px] font-black uppercase tracking-tighter cursor-pointer whitespace-nowrap text-primary/80'>
                                {isPublic ? 'Public' : 'Private'}
                            </Label>
                            <Switch
                                id='is-public'
                                checked={isPublic}
                                onCheckedChange={(val) => {
                                    setIsPublic(val)
                                    broadcastUpdate({ isPublic: val })
                                }}
                                className='data-[state=checked]:bg-primary h-4 w-8'
                            />
                        </div>

                        {/* Right Group: Zoom, Collaborate & Preview */}
                        <div className="flex items-center gap-4">
                            {/* ZOOM CONTROLS */}
                            <div className="flex items-center gap-1 bg-background border rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom(-0.1)}>
                                    -
                                </Button>
                                <span className="text-xs w-12 text-center font-mono">{(zoomLevel * 100).toFixed(0)}%</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom(0.1)}>
                                    +
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-xs" onClick={resetZoom} title="Reset Zoom">
                                    ↺
                                </Button>
                            </div>

                            {(initialData?.id || initialData?._id) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2 bg-background border-primary/20 hover:bg-primary/5 shadow-sm px-4 font-bold text-xs"
                                    onClick={() => setIsCollaborateOpen(true)}
                                >
                                    <Users size={16} className="text-primary" /> Collaborate
                                    {collaborators.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 px-1 h-4 min-w-4 flex items-center justify-center text-[10px]">
                                            {collaborators.length}
                                        </Badge>
                                    )}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 bg-background border-primary/20 hover:bg-primary/5 shadow-sm px-4 font-bold text-xs"
                                onClick={() => setIsPreviewOpen(true)}
                            >
                                <Eye size={16} className="text-primary" /> Preview
                            </Button>
                            <Badge variant="outline" className='flex items-center gap-1.5 h-9 bg-background border-primary/10 px-4'>
                                <span className="font-mono text-xs font-black text-muted-foreground">{resolution}</span>
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* SCROLLABLE CANVAS CONTAINER */}

                <CollaborateDialog
                    isOpen={isCollaborateOpen}
                    onClose={async () => {
                        setIsCollaborateOpen(false)
                        // Refresh collaborators if needed
                        const templateId = initialData?.id || initialData?._id
                        if (templateId) {
                            const updated = await templateService.getTemplate(templateId)
                            if (updated.collaborators) setCollaborators(updated.collaborators)
                        }
                    }}
                    templateId={initialData?.id || initialData?._id}
                    currentCollaborators={collaborators}
                />

                {/* SCROLLABLE CANVAS CONTAINER */}
                <div className='flex-1 overflow-auto bg-zinc-950 relative rounded-xl border border-white/5 shadow-2xl p-4'>
                    <div className="flex items-center justify-center min-w-full min-h-full">
                        {/* Visual Border Container - Screen Mockup */}
                        <div
                            className="p-1 px-[2px] bg-zinc-800 rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/10 relative transition-all duration-200"
                            style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'center top'
                            }}
                        >
                            {/* Dot Grid Background Overlay - Now BEHIND the canvas */}
                            <div
                                className="absolute inset-0 opacity-20 pointer-events-none z-0"
                                style={{
                                    backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
                                    backgroundSize: '15px 15px'
                                }}
                            />

                            <div
                                className='relative border border-white/5 transition-all z-10'
                                style={{
                                    width: CANVAS_WIDTH,
                                    height: CANVAS_HEIGHT,
                                    minWidth: CANVAS_WIDTH,
                                    minHeight: CANVAS_HEIGHT
                                }}
                                ref={canvasContainerRef}
                            >
                                {/* Fabric Canvas injected here */}
                            </div>
                        </div>
                    </div>
                </div>

                <PreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    template={{
                        name: templateName,
                        resolution,
                        zones
                    }}
                />

                <p className='mt-4 text-center text-sm text-muted-foreground italic'>
                    Shortcuts: ⌫ Delete | ^C Copy | ^V Paste | Arrow Keys to Nudge
                </p>
            </div>
        </div>
    )
}
