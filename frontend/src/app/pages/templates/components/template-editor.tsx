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

    // State
    const [zones, setZones] = useState<Zone[]>(initialData?.zones || [])
    const [templateName, setTemplateName] = useState(initialData?.name || 'New Template')
    const [isPublic, setIsPublic] = useState(initialData?.isPublic || false)
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
    const [clipboard, setClipboard] = useState<Zone | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [resolution, setResolution] = useState(initialData?.resolution || '1920x1080')
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    const queryClient = useQueryClient()

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

    // Adaptive SCALE_FACTOR: 4K needs a smaller scale to fit the screen without squashing
    const isHighRes = screenWidth > 2000 || screenHeight > 2000
    const isPortrait = screenHeight > screenWidth

    const SCALE_FACTOR = isHighRes
        ? (isPortrait ? 0.15 : 0.2) // 4K: smaller scale
        : (isPortrait ? 0.35 : 0.4) // HD/Standard: larger scale

    const CANVAS_WIDTH = screenWidth * SCALE_FACTOR
    const CANVAS_HEIGHT = screenHeight * SCALE_FACTOR
    const GRID_SIZE = 10 * SCALE_FACTOR

    const selectedZone = zones.find(z => z.id === selectedZoneId)


    // ================= HELPERS =================
    const getZoneColor = (type: string, alpha = 'ff') => {
        let color = '#f59e0b'
        if (type === 'video') color = '#3b82f6'
        if (type === 'image') color = '#10b981'
        if (type === 'mixed') color = '#8b5cf6'
        return color + (alpha === 'ff' ? '' : alpha)
    }

    const addZoneToCanvas = (canvas: fabric.Canvas, zone: Zone) => {
        const rect = new fabric.Rect({
            left: zone.x * SCALE_FACTOR,
            top: zone.y * SCALE_FACTOR,
            width: zone.width * SCALE_FACTOR,
            height: zone.height * SCALE_FACTOR,
            fill: getZoneColor(zone.type, '88'), // Higher opacity for better visibility
            stroke: '#ffffff', // White stroke for high contrast on black
            strokeWidth: 2,
            strokeUniform: true,
            cornerColor: '#3b82f6',
            cornerSize: 8,
            cornerStyle: 'circle', // Modern look
            transparentCorners: false,
            originX: 'left',
            originY: 'top',
            // @ts-ignore
            id: zone.id,
            // @ts-ignore
            zoneType: zone.type,
            lockRotation: true,
            hasRotatingPoint: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.5)',
                blur: 10,
                offsetX: 0,
                offsetY: 2
            })
        })

        // Enable all 8 resize handles
        rect.setControlsVisibility({
            mt: true, mb: true, ml: true, mr: true,
            tl: true, tr: true, bl: true, br: true,
            mtr: false
        })

        canvas.add(rect)
        return rect
    }

    const constrainObject = (obj: any) => {
        if (!obj || !canvasRef.current) return

        const cw = canvasRef.current.getWidth()
        const ch = canvasRef.current.getHeight()
        const sw = obj.strokeWidth || 2

        obj.setCoords()

        // 1. Force scale to fit (Visual size must be <= Canvas size - 4px safety)
        const MARGIN = 4
        const maxAllowedW = cw - MARGIN
        const maxAllowedH = ch - MARGIN

        if (obj.getScaledWidth() + sw > maxAllowedW) {
            obj.set({ scaleX: (maxAllowedW - sw) / obj.width })
        }
        if (obj.getScaledHeight() + sw > maxAllowedH) {
            obj.set({ scaleY: (maxAllowedH - sw) / obj.height })
        }

        obj.setCoords()

        // 2. Force position to fit (Strict absolute clamping)
        let l = obj.left
        let t = obj.top

        // Visual Left = l - sw/2. Must be >= 0.
        // Visual Right = l + scaledW + sw/2. Must be <= cw.
        const halfStroke = sw / 2
        const curW = obj.getScaledWidth()
        const curH = obj.getScaledHeight()

        if (l - halfStroke < 0) {
            l = halfStroke
        }
        else if (l + curW + halfStroke > cw) {
            l = cw - curW - halfStroke
        }

        if (t - halfStroke < 0) {
            t = halfStroke
        }
        else if (t + curH + halfStroke > ch) {
            t = ch - curH - halfStroke
        }

        obj.set({ left: l, top: t })
        obj.setCoords()
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
                x: Math.round(obj.left / SCALE_FACTOR),
                y: Math.round(obj.top / SCALE_FACTOR),
                width: Math.round(obj.getScaledWidth() / SCALE_FACTOR),
                height: Math.round(obj.getScaledHeight() / SCALE_FACTOR),
            }
        }))
    }

    const handleObjectModified = (obj: any) => {
        if (!obj) return

        // Snap to grid
        let left = Math.round(obj.left / GRID_SIZE) * GRID_SIZE
        let top = Math.round(obj.top / GRID_SIZE) * GRID_SIZE
        obj.set({ left, top })

        // Then constrain strictly
        constrainObject(obj)

        if (canvasRef.current) canvasRef.current.requestRenderAll()
        syncToState(obj)
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

        setZones([...zones, newZone])
        if (canvasRef.current) {
            const rect = addZoneToCanvas(canvasRef.current, newZone)
            canvasRef.current.setActiveObject(rect)
            setSelectedZoneId(newZone.id)
        }
    }

    const pasteZone = (template: Zone) => {
        const offset = 20
        const newZone: Zone = {
            ...template,
            id: `zone-${Date.now()}`,
            name: `${template.name} (Copy)`,
            x: Math.min(CANVAS_WIDTH / SCALE_FACTOR - template.width - offset, Math.max(0, template.x + offset)),
            y: Math.min(CANVAS_HEIGHT / SCALE_FACTOR - template.height - offset, Math.max(0, template.y + offset)),
        }

        setZones(prev => [...prev, newZone])
        if (canvasRef.current) {
            const rect = addZoneToCanvas(canvasRef.current, newZone)
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

            setZones(prev => prev.filter(z => !idsToDelete.has(z.id)))
            setSelectedZoneId(null)
            toast({ title: `${activeObjects.length} zone(s) removed` })
        }
    }, [])

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
            const payload = {
                name: templateName,
                resolution,
                zones,
                isPublic,
            }

            if (initialData?.id || initialData?._id) {
                await templateService.updateTemplate(initialData.id || initialData._id, payload)
            } else {
                await templateService.createTemplate(payload)
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
                backgroundColor: '#000',
                preserveObjectStacking: true,
                selection: true,
            })

            // Visual containment failsafe
            canvas.clipPath = new fabric.Rect({
                left: 0,
                top: 0,
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                absolutePositioned: true
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
            canvas.on('selection:created', (e) => {
                const obj = e.selected?.[0] as any
                if (obj) {
                    constrainObject(obj)
                    canvas.requestRenderAll()
                    if (obj.id) setSelectedZoneId(obj.id)
                }
            })
            canvas.on('selection:updated', (e) => {
                const obj = e.selected?.[0] as any
                if (obj) {
                    constrainObject(obj)
                    canvas.requestRenderAll()
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


    return (
        <div className='flex h-[calc(100vh-200px)] gap-6'>
            <Card className='flex w-72 flex-col p-4 shadow-lg h-full overflow-hidden'>
                <div className='flex flex-1 flex-col overflow-y-auto pr-2 custom-scrollbar'>
                    <h3 className='mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground'>Resolution Preset</h3>
                    <div className='mb-6'>
                        <Select value={resolution} onValueChange={setResolution}>
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
                            </SelectContent>
                        </Select>
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
                                        const obj = canvasRef.current?.getObjects().find((o: any) => o.id === zone.id)
                                        if (obj && canvasRef.current) {
                                            canvasRef.current.setActiveObject(obj)
                                            canvasRef.current.renderAll()
                                        }
                                    }}
                                >
                                    <span className='truncate flex-1'>{zone.name || zone.type}</span>
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

            <div className='relative flex-1 overflow-auto rounded-lg bg-muted/30 p-8'>
                <div className='mb-4 flex items-center gap-4'>
                    <div className='flex-1'>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className='max-w-xs text-lg font-bold'
                        />
                        <div className='flex items-center gap-2 ml-4 bg-background px-3 py-1 rounded-full border border-primary/20 shadow-sm'>
                            {isPublic ? <Globe size={14} className="text-primary" /> : <Lock size={14} className="text-muted-foreground" />}
                            <Label htmlFor='is-public' className='text-xs font-semibold cursor-pointer'>
                                {isPublic ? 'Public Layout' : 'Private'}
                            </Label>
                            <Switch
                                id='is-public'
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                                className='data-[state=checked]:bg-primary'
                            />
                        </div>
                    </div>
                    <div className='flex gap-2 text-xs text-muted-foreground'>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-2 border shadow-sm px-3"
                            onClick={() => setIsPreviewOpen(true)}
                        >
                            <Eye size={14} /> Live Preview
                        </Button>
                        <Badge variant="outline" className='flex items-center gap-1.5 h-8 bg-background'>
                            <IconDeviceTv size={14} className="text-primary" />
                            <span className="font-mono text-[11px] font-bold">{resolution}</span>
                        </Badge>
                    </div>
                </div>

                <div className='flex-1 flex items-center justify-center bg-zinc-950/20 rounded-xl border border-dashed border-primary/10 overflow-auto p-12'>
                    {/* Visual Border Container to prevent canvas overlap */}
                    <div className="p-[2px] bg-zinc-700 rounded-sm shadow-2xl">
                        <div
                            className='bg-black overflow-hidden relative transition-all duration-300 ease-in-out border border-white/20'
                            style={{
                                width: CANVAS_WIDTH,
                                height: CANVAS_HEIGHT,
                                minWidth: CANVAS_WIDTH, // CRITICAL: Stop the layout from squeezing the 4K canvas
                                minHeight: CANVAS_HEIGHT
                            }}
                            ref={canvasContainerRef}
                        >
                            {/* Fabric Canvas injected here */}
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
