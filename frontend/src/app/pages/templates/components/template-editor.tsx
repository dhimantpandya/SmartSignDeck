import { useRef, useState, useEffect, useCallback } from 'react'
import * as fabric from 'fabric'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { PreviewModal } from '@/components/preview-modal'
import { toast } from '@/components/ui/use-toast'
import { templateService } from '@/api/template.service'
import { useQueryClient } from '@tanstack/react-query'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { GLOBAL_SCALE } from '@/utilities/fabric-utils'
import { useNotifications } from '@/components/nav-notification-provider'
import { useAuth } from '@/hooks/use-auth'

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
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // State
    const [zones, setZones] = useState<Zone[]>(initialData?.zones || [])
    const [templateName, setTemplateName] = useState(initialData?.name || 'New Template')
    const [visibility, setVisibility] = useState<'private' | 'company' | 'public'>(initialData?.visibility || 'private')
    const [isSaving, setIsSaving] = useState(false)
    const [resolution, setResolution] = useState(initialData?.resolution || '1920x1080')
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(initialData?.id || initialData?._id || null)
    const [remoteSelections, setRemoteSelections] = useState<Record<string, { userId: string, userName: string, color: string, avatar?: string }>>({})



    const zonesRef = useRef<Zone[]>(zones)
    const socketRef = useRef(socket)
    const currentTemplateIdRef = useRef(currentTemplateId)
    const remoteSelectionsRef = useRef(remoteSelections)
    const lastBroadcastRef = useRef<number>(0)
    const transformingIdRef = useRef<string | null>(null)
    const THROTTLE_MS = 16 // ~60fps sync for hyper-smooth movement

    useEffect(() => {
        zonesRef.current = zones
    }, [zones])

    useEffect(() => {
        socketRef.current = socket
    }, [socket])

    useEffect(() => {
        currentTemplateIdRef.current = currentTemplateId
    }, [currentTemplateId])

    useEffect(() => {
        remoteSelectionsRef.current = remoteSelections
    }, [remoteSelections])

    // --- ABSOLUTE PERSISTENCE (FETCH ON MOUNT) ---
    useEffect(() => {
        const templateId = currentTemplateId?.toString().trim().toLowerCase()
        if (!templateId) return

        const fetchLatest = async () => {
            try {
                const latest = await templateService.getTemplate(templateId)
                if (latest && latest.zones) {
                    const freshZones = latest.zones as any as Zone[]
                    console.log('[COLLAB] Persistent fetch successful:', freshZones.length, 'zones')

                    // 1. Update React state
                    setZones(freshZones)
                    setTemplateName(latest.name)
                    if ((latest as any).resolution) setResolution((latest as any).resolution)
                    if (latest.visibility) setVisibility(latest.visibility)

                    // 2. CRITICAL: Update the canvas objects directly
                    const canvas = canvasRef.current
                    if (canvas) {
                        freshZones.forEach((latestZone: Zone) => {
                            const obj = canvas.getObjects().find((o: any) => o.id === latestZone.id) as any
                            if (obj) {
                                obj.set({
                                    left: latestZone.x * GLOBAL_SCALE,
                                    top: latestZone.y * GLOBAL_SCALE,
                                    scaleX: (latestZone.width * GLOBAL_SCALE) / obj.width,
                                    scaleY: (latestZone.height * GLOBAL_SCALE) / obj.height,
                                })
                                obj.setCoords()
                            } else {
                                addZoneToCanvas(canvas, latestZone)
                            }
                        })

                        const freshIds = new Set(freshZones.map((z: Zone) => z.id))
                        canvas.getObjects().forEach((o: any) => {
                            if (o.id && !freshIds.has(o.id)) {
                                canvas.remove(o)
                            }
                        })

                        canvas.requestRenderAll()
                    }
                }
            } catch (err) {
                console.error('[COLLAB] Failed to fetch latest template data:', err)
            }
        }

        fetchLatest()
    }, [])

    // --- SOCKET SYNC ---
    useEffect(() => {
        const templateId = currentTemplateId?.toString().trim().toLowerCase()
        if (!socket || !templateId) return

        socket.emit('join_template', templateId)

        const handleRemoteUpdate = (data: any) => {
            const incomingId = data.templateId?.toString().trim().toLowerCase()
            if (incomingId !== templateId) return

            if (data.zones) {
                const activeTransformId = transformingIdRef.current
                setZones(prev => {
                    const nextZones = [...prev]
                    data.zones.forEach((remoteZone: Zone) => {
                        const index = nextZones.findIndex(z => z.id === remoteZone.id)
                        if (index !== -1) {
                            if (remoteZone.id !== activeTransformId) {
                                nextZones[index] = remoteZone
                            }
                        } else {
                            nextZones.push(remoteZone)
                        }
                    })
                    const remoteIds = new Set(data.zones.map((z: any) => z.id))
                    return nextZones.filter(z => remoteIds.has(z.id) || z.id === activeTransformId)
                })

                if (canvasRef.current) {
                    const canvas = canvasRef.current
                    data.zones.forEach((remoteZone: Zone) => {
                        if (remoteZone.id === activeTransformId) return
                        const obj = canvas.getObjects().find((o: any) => o.id === remoteZone.id) as any
                        if (obj) {
                            const targetLeft = remoteZone.x * GLOBAL_SCALE
                            const targetTop = remoteZone.y * GLOBAL_SCALE
                            const targetScaleX = (remoteZone.width * GLOBAL_SCALE) / obj.width
                            const targetScaleY = (remoteZone.height * GLOBAL_SCALE) / obj.height

                            obj.set({ left: targetLeft, top: targetTop, scaleX: targetScaleX, scaleY: targetScaleY })
                            obj.setCoords()

                            const tag = canvas.getObjects().find((o: any) => o._forZoneId === obj.id && o._isRemoteTag)
                            if (tag) {
                                (tag as any).set({ left: obj.left, top: obj.top - 30 })
                                (tag as any).setCoords()
                            }
                        } else {
                            addZoneToCanvas(canvas, remoteZone)
                        }
                    })

                    const remoteIds = new Set(data.zones.map((z: any) => z.id))
                    canvas.getObjects().forEach((o: any) => {
                        if (o._isRemoteTag) return
                        if (o.id && !remoteIds.has(o.id) && o.id !== activeTransformId) {
                            canvas.remove(o)
                        }
                    })
                    canvas.requestRenderAll()
                }
            }
            if (data.name !== undefined) setTemplateName(data.name)
        }

        const handleCollabUpdate = async () => {
            const tid = currentTemplateId?.toString().trim().toLowerCase()
            if (!tid) return
            try {
                const updated = await templateService.getTemplate(tid)
                if (!updated) return
            } catch (err) {
                console.error('Failed to refresh collaborators:', err)
            }
        }

        const handleZoneLocked = (data: any) => {
            setRemoteSelections(prev => ({
                ...prev,
                [data.zoneId]: { userId: data.userId, userName: data.userName, color: data.color || '#4f46e5' }
            }))
        }

        const handleZoneUnlocked = (data: any) => {
            setRemoteSelections(prev => {
                const next = { ...prev }
                delete next[data.zoneId]
                return next
            })
        }

        socket.on('template_updated', handleRemoteUpdate)
        socket.on('collaboration_accepted', handleCollabUpdate)
        socket.on('zone_locked', handleZoneLocked)
        socket.on('zone_unlocked', handleZoneUnlocked)

        return () => {
            socket.off('template_updated', handleRemoteUpdate)
            socket.off('collaboration_accepted', handleCollabUpdate)
            socket.off('zone_locked', handleZoneLocked)
            socket.off('zone_unlocked', handleZoneUnlocked)
        }
    }, [socket, currentTemplateId])

    const broadcastUpdate = (updates: any) => {
        const tid = currentTemplateIdRef.current?.toString().trim().toLowerCase()
        if (!socketRef.current || !tid) return
        socketRef.current.emit('template_edit', { templateId: tid, ...updates })
    }

    const emitLock = (zoneId: string) => {
        const tid = currentTemplateId?.toString().trim().toLowerCase()
        if (!socket || !tid || !user) return
        const userId = user.id || (user as any)._id || ''
        const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
        const colorIndex = userId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % PALETTE.length
        socket.emit('lock_zone', {
            templateId: tid,
            zoneId,
            userId,
            userName: `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim() || 'Collaborator',
            color: PALETTE[colorIndex]
        })
    }

    const emitUnlock = (zoneId: string) => {
        const tid = currentTemplateId?.toString().trim().toLowerCase()
        if (!socket || !tid) return
        socket.emit('unlock_zone', { templateId: tid, zoneId })
    }

    const RESOLUTIONS = [
        { label: 'Landscape TV', value: '1920x1080', icon: '🖥️' },
        { label: 'Portrait TV / Vertical', value: '1080x1920', icon: '📱' },
        { label: '4K Landscape', value: '3840x2160', icon: '🌟' },
        { label: '4K Portrait', value: '2160x3840', icon: '🌟' },
        { label: 'Standard HD', value: '1280x720', icon: '📺' },
        { label: 'Square', value: '1080x1080', icon: '📐' },
        { label: 'Custom...', value: 'custom', icon: '✏️' },
    ]

    // Custom resolution state
    const [isCustomResolution, setIsCustomResolution] = useState(false)
    const [customWidth, setCustomWidth] = useState(1920)
    const [customHeight, setCustomHeight] = useState(1080)

    const [screenWidth, screenHeight] = (isCustomResolution ? `${customWidth}x${customHeight}` : resolution).split('x').map(Number)
    const CANVAS_WIDTH = screenWidth * GLOBAL_SCALE
    const CANVAS_HEIGHT = screenHeight * GLOBAL_SCALE
    const GRID_SIZE = 20 * GLOBAL_SCALE

    // --- OVERLAP DETECTION ---
    const checkOverlap = useCallback((activeObj: fabric.Object) => {
        const canvas = canvasRef.current
        if (!canvas) return false
        const activeBr = activeObj.getBoundingRect()
        let hasOverlap = false

        canvas.forEachObject((obj) => {
            if (obj === activeObj || (obj as any)._isRemoteTag || !(obj as any).id) return
            const otherBr = obj.getBoundingRect()
            if (
                activeBr.left < otherBr.left + otherBr.width &&
                activeBr.left + activeBr.width > otherBr.left &&
                activeBr.top < otherBr.top + otherBr.height &&
                activeBr.top + activeBr.height > otherBr.top
            ) {
                hasOverlap = true
            }
        })

        // Apply yellow warning if overlapping
        if (hasOverlap) {
            activeObj.set({ stroke: '#facc15', strokeWidth: 3 })
        } else {
            const zone = zonesRef.current.find(z => z.id === (activeObj as any).id)
            const defaultBorder = getZoneColor(zone?.type || 'mixed', '80').replace('0.8', '1')
            activeObj.set({ stroke: defaultBorder, strokeWidth: 2 })
        }
        return hasOverlap
    }, [])


    const getZoneColor = (type: string, alpha: string = '40') => {
        const opacity = alpha === '40' ? 0.4 : 0.8
        switch (type) {
            case 'image': return `rgba(34, 197, 94, ${opacity})`
            case 'video': return `rgba(59, 130, 246, ${opacity})`
            case 'text': return `rgba(168, 85, 247, ${opacity})`
            case 'mixed': return `rgba(234, 179, 8, ${opacity})`
            default: return `rgba(100, 116, 139, ${opacity})`
        }
    }

    const addZoneToCanvas = (canvas: fabric.Canvas, zone: Zone) => {
        const color = getZoneColor(zone.type, '40')
        const borderColor = getZoneColor(zone.type, '80').replace('0.8', '1')
        const width = zone.width * GLOBAL_SCALE
        const height = zone.height * GLOBAL_SCALE

        const rect = new fabric.Rect({
            width, height, fill: color, stroke: borderColor, strokeWidth: 2,
            strokeUniform: true, originX: 'center', originY: 'center', objectCaching: false
        })

        const text = new fabric.Text((zone.type || 'mixed').toUpperCase() + ' ZONE', {
            fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 'bold',
            fill: 'rgba(255, 255, 255, 0.9)', originX: 'center', originY: 'center'
        })

        const group = new fabric.Group([rect, text], {
            left: zone.x * GLOBAL_SCALE, top: zone.y * GLOBAL_SCALE,
            originX: 'left', originY: 'top', lockRotation: true,
            transparentCorners: false, cornerColor: '#ffffff',
            cornerStrokeColor: borderColor, cornerSize: 10, cornerStyle: 'circle',
            borderColor, objectCaching: false,
            subTargetCheck: true, // Allow interaction with sub-elements if needed
        })
        
        // Ensure text doesn't scale when group scales
        // Note: Fabric groups scale children. We can also use "lockScalingX/Y" on children 
        // but better to set individual objects and not groups if absolute text size is needed.
        // For now, we'll listen to scaling and reset text scale.
        group.on('scaling', () => {
            const sX = group.scaleX || 1
            const sY = group.scaleY || 1
            text.set({
                scaleX: 1 / sX,
                scaleY: 1 / sY
            })
        })

        // @ts-ignore
        group.id = zone.id

        group.setControlsVisibility({ mt: true, mb: true, ml: true, mr: true, tl: true, tr: true, bl: true, br: true, mtr: false })
        canvas.add(group)
        return group
    }

    const constrainObject = (obj: any) => {
        if (!obj || !canvasRef.current) return
        const cw = canvasRef.current.getWidth()
        const ch = canvasRef.current.getHeight()
        obj.setCoords()
        const MIN_SIZE = Math.max(50 * GLOBAL_SCALE, 20)
        let sX = obj.scaleX, sY = obj.scaleY
        if (obj.getScaledWidth() < MIN_SIZE) sX = MIN_SIZE / obj.width
        if (obj.getScaledHeight() < MIN_SIZE) sY = MIN_SIZE / obj.height
        if (obj.width * sX > cw) sX = cw / obj.width
        if (obj.height * sY > ch) sY = ch / obj.height
        obj.set({ scaleX: sX, scaleY: sY })
        obj.setCoords()
        const finalBr = obj.getBoundingRect()
        let l = obj.left, t = obj.top
        if (finalBr.left < 0) l = 0; else if (finalBr.left + finalBr.width > cw) l = cw - finalBr.width
        if (finalBr.top < 0) t = 0; else if (finalBr.top + finalBr.height > ch) t = ch - finalBr.height
        obj.set({ left: l, top: t })
        obj.setCoords()
    }

    const handleRealtimeUpdate = (obj: any) => {
        if (!obj || !canvasRef.current || !obj.id) return
        transformingIdRef.current = obj.id
        constrainObject(obj)
        canvasRef.current.requestRenderAll()
        const now = Date.now()
        if (now - lastBroadcastRef.current > THROTTLE_MS) {
            lastBroadcastRef.current = now
            const updatedZones = zonesRef.current.map(z => z.id === obj.id ? {
                ...z, x: Math.round(obj.left / GLOBAL_SCALE), y: Math.round(obj.top / GLOBAL_SCALE),
                width: Math.round(obj.getScaledWidth() / GLOBAL_SCALE), height: Math.round(obj.getScaledHeight() / GLOBAL_SCALE)
            } : z)
            broadcastUpdate({ zones: updatedZones })
        }
        checkOverlap(obj)
    }

    const handleObjectModified = (obj: any) => {
        if (!obj) return
        transformingIdRef.current = null
        let left = Math.round(obj.left / GRID_SIZE) * GRID_SIZE
        let top = Math.round(obj.top / GRID_SIZE) * GRID_SIZE
        obj.set({ left, top })
        constrainObject(obj)
        if (canvasRef.current) canvasRef.current.requestRenderAll()
        setZones(prev => {
            const next = prev.map(z => z.id === obj.id ? {
                ...z, x: Math.round(obj.left / GLOBAL_SCALE), y: Math.round(obj.top / GLOBAL_SCALE),
                width: Math.round(obj.getScaledWidth() / GLOBAL_SCALE), height: Math.round(obj.getScaledHeight() / GLOBAL_SCALE)
            } : z)
            pushHistory(next)
            broadcastUpdate({ zones: next })
            return next
        })
    }

    const addZone = (type: 'image' | 'video' | 'text' | 'mixed') => {
        const w = 400, h = 300
        const newZone: Zone = {
            id: `zone-${Date.now()}`, name: `${type} region`, type,
            x: (screenWidth - w) / 2, y: (screenHeight - h) / 2, width: w, height: h,
            media: [], mediaType: 'both', lockedMediaType: null
        }
        const next = [...zones, newZone]
        setZones(next)
        pushHistory(next)
        broadcastUpdate({ zones: next })
        if (canvasRef.current) {
            const rect = addZoneToCanvas(canvasRef.current, newZone)
            canvasRef.current.setActiveObject(rect)
            canvasRef.current.requestRenderAll()
        }
    }


    const saveTemplate = async (isCollabAuto = false) => {
        if (zones.length === 0) return toast({ title: 'Add a zone' })
        if (!templateName.trim()) return toast({ title: 'Name required' })

        setIsSaving(true)
        try {
            const thumb = canvasRef.current?.toDataURL({ format: 'jpeg', quality: 0.4, multiplier: 0.15 })
            const effectiveResolution = isCustomResolution ? `${customWidth}x${customHeight}` : resolution
            const payload = { name: templateName, resolution: effectiveResolution, zones, visibility, previewUrl: thumb, previewType: 'image' }
            if (currentTemplateId) {
                await templateService.updateTemplate(currentTemplateId, payload)
            } else {
                const res = await templateService.createTemplate(payload)
                if (res?.id) setCurrentTemplateId(res.id)
            }
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            toast({ title: 'Saved!' })
            if (!isCollabAuto) onCancel()
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        if (!canvasContainerRef.current) return
        canvasContainerRef.current.innerHTML = ''
        const el = document.createElement('canvas')
        canvasContainerRef.current.appendChild(el)
        const canvas = new fabric.Canvas(el, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, preserveObjectStacking: true })
        canvasRef.current = canvas
        zones.forEach(z => {
            const r = addZoneToCanvas(canvas, z)
            constrainObject(r)
        })
        canvas.on('object:moving', (e) => handleRealtimeUpdate(e.target))
        canvas.on('object:scaling', (e) => handleRealtimeUpdate(e.target))
        canvas.on('object:modified', (e) => handleObjectModified(e.target))
        canvas.on('selection:created', (e) => {
            const obj = e.selected?.[0] as any
            if (obj?.id) { emitLock(obj.id) }
        })
        canvas.on('selection:cleared', (e) => {
            const d = (e as any).deselected?.[0]
            if (d?.id) emitUnlock(d.id)
            transformingIdRef.current = null
        })
        return () => { canvas.dispose(); canvasRef.current = null }
    }, [resolution])

    const [zoom, setZoom] = useState(1)

    // --- HISTORY (UNDO/REDO) ---
    const historyRef = useRef<Zone[][]>([])
    const historyIndexRef = useRef(-1)
    const clipboardRef = useRef<Zone | null>(null)

    const pushHistory = useCallback((zoneSnapshot: Zone[]) => {
        // Truncate forward history on new action
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
        historyRef.current.push(JSON.parse(JSON.stringify(zoneSnapshot)))
        // Keep max 50 entries
        if (historyRef.current.length > 50) {
            historyRef.current.shift()
            historyIndexRef.current--
        }
        historyIndexRef.current = historyRef.current.length - 1
    }, [])

    // Initialize history with starting state
    useEffect(() => {
        if (zones.length > 0 && historyRef.current.length === 0) {
            historyRef.current = [JSON.parse(JSON.stringify(zones))]
            historyIndexRef.current = 0
        }
    }, [])

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return
        historyIndexRef.current--
        const prev = historyRef.current[historyIndexRef.current]
        setZones(prev)
        broadcastUpdate({ zones: prev })
        // Sync canvas
        const canvas = canvasRef.current
        if (canvas) {
            // Remove objects not in current state
            const ids = new Set(prev.map(z => z.id))
            canvas.getObjects().forEach((o: any) => { if (o.id && !ids.has(o.id) && !o._isRemoteTag) canvas.remove(o) })
            
            prev.forEach(z => {
                const obj = canvas.getObjects().find((o: any) => o.id === z.id) as any
                if (obj) {
                    obj.set({ 
                        left: z.x * GLOBAL_SCALE, 
                        top: z.y * GLOBAL_SCALE, 
                        scaleX: (z.width * GLOBAL_SCALE) / obj.width, 
                        scaleY: (z.height * GLOBAL_SCALE) / obj.height 
                    })
                    obj.setCoords()
                } else {
                    addZoneToCanvas(canvas, z)
                }
            })
            canvas.requestRenderAll()
            toast({ title: 'Undo', description: 'Reverted last change.' })
        }
    }, [])

    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return
        historyIndexRef.current++
        const next = historyRef.current[historyIndexRef.current]
        setZones(next)
        broadcastUpdate({ zones: next })
        const canvas = canvasRef.current
        if (canvas) {
            const ids = new Set(next.map(z => z.id))
            canvas.getObjects().forEach((o: any) => { if (o.id && !ids.has(o.id) && !o._isRemoteTag) canvas.remove(o) })
            next.forEach(z => {
                const obj = canvas.getObjects().find((o: any) => o.id === z.id) as any
                if (obj) {
                    obj.set({ left: z.x * GLOBAL_SCALE, top: z.y * GLOBAL_SCALE, scaleX: (z.width * GLOBAL_SCALE) / obj.width, scaleY: (z.height * GLOBAL_SCALE) / obj.height })
                    obj.setCoords()
                } else {
                    addZoneToCanvas(canvas, z)
                }
            })
            canvas.requestRenderAll()
            toast({ title: 'Redo', description: 'Restored undone change.' })
        }
    }, [])

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // Don't intercept when user is typing in an input
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return

            const canvas = canvasRef.current
            if (!canvas) return

            const ctrl = e.ctrlKey || e.metaKey

            // DELETE / BACKSPACE → remove selected zone
            if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrl) {
                const active = canvas.getActiveObject() as any
                if (!active?.id) return
                e.preventDefault()
                canvas.remove(active)
                canvas.requestRenderAll()
                setZones(prev => {
                    const next = prev.filter(z => z.id !== active.id)
                    pushHistory(next)
                    broadcastUpdate({ zones: next })
                    return next
                })
                return
            }

            // CTRL+C → copy selected zone
            if (ctrl && e.key === 'c') {
                const active = canvas.getActiveObject() as any
                if (!active?.id) return
                e.preventDefault()
                const zone = zonesRef.current.find(z => z.id === active.id)
                if (zone) {
                    clipboardRef.current = JSON.parse(JSON.stringify(zone))
                    toast({ title: 'Zone Copied', description: `Region "${zone.name}" copied to clipboard.` })
                }
                return
            }

            // CTRL+V → paste copied zone
            if (ctrl && e.key === 'v') {
                const copied = clipboardRef.current
                if (!copied) return
                e.preventDefault()
                const pastedZone: Zone = {
                    ...copied,
                    id: `zone-${Date.now()}`,
                    name: `${copied.name} copy`,
                    x: copied.x + 20,
                    y: copied.y + 20,
                }
                const next = [...zonesRef.current, pastedZone]
                setZones(next)
                pushHistory(next)
                broadcastUpdate({ zones: next })
                addZoneToCanvas(canvas, pastedZone)
                canvas.requestRenderAll()
                toast({ title: 'Zone Pasted', description: 'New region added to canvas.' })
                return
            }

            // CTRL+Z → undo
            if (ctrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                undo()
                return
            }

            // CTRL+Y or CTRL+SHIFT+Z → redo
            if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                redo()
                return
            }
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [undo, redo, pushHistory])

    return (
        <div className='flex flex-col lg:flex-row h-[calc(100vh-40px)] gap-4 overflow-hidden bg-background'>
            <Card className='w-full lg:w-72 p-4 flex flex-col gap-4 border-none shadow-none bg-muted/30'>
                <div className="space-y-4">
                    <Label className="text-xs font-black uppercase">Settings</Label>
                    <Input value={templateName} onChange={(e) => { setTemplateName(e.target.value); broadcastUpdate({ name: e.target.value }) }} placeholder="Name" />
                    <Select
                        value={isCustomResolution ? 'custom' : resolution}
                        onValueChange={(v) => {
                            if (v === 'custom') {
                                setIsCustomResolution(true)
                            } else {
                                setIsCustomResolution(false)
                                setResolution(v)
                            }
                        }}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{RESOLUTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {isCustomResolution && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customWidth}
                                        onChange={e => setCustomWidth(Math.max(100, parseInt(e.target.value) || 1920))}
                                        placeholder="Width"
                                        className="h-8 text-xs pr-6"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">px</span>
                                </div>
                                <span className="text-muted-foreground text-xs font-bold">×</span>
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        min={100}
                                        max={7680}
                                        value={customHeight}
                                        onChange={e => setCustomHeight(Math.max(100, parseInt(e.target.value) || 1080))}
                                        placeholder="Height"
                                        className="h-8 text-xs pr-6"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">px</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                * Resolution in Pixels (px). CMS automatically scales for 16:9 displays.
                            </p>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase">Add Zones</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => addZone('image')}>Image</Button>
                        <Button variant="outline" size="sm" onClick={() => addZone('video')}>Video</Button>
                        <Button variant="outline" size="sm" onClick={() => addZone('text')}>Text</Button>
                        <Button variant="outline" size="sm" onClick={() => addZone('mixed')}>Mixed</Button>
                    </div>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button onClick={() => saveTemplate()} loading={isSaving}>Save Template</Button>
                </div>
            </Card>

            <div className='flex-1 flex flex-col overflow-hidden bg-muted/10 p-4'>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>-</Button>
                        <span className="text-xs font-mono">{Math.round(zoom * 100)}%</span>
                        <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={visibility} onValueChange={(v: any) => { setVisibility(v); broadcastUpdate({ visibility: v }) }}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="public">Global</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>Preview</Button>
                    </div>
                </div>

                <div className='flex-1 overflow-auto bg-zinc-900 border-2 border-zinc-800 rounded-2xl flex items-center justify-center p-8'>
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }} className="shadow-2xl ring-1 ring-white/10">
                        <div ref={canvasContainerRef} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: '#000' }} />
                    </div>
                </div>
            </div>

            <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} template={{ name: templateName, resolution, zones }} />
        </div>
    )
}
