import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
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
    IconDeviceFloppy,
    IconMenu2,
    IconX,
    IconAlertTriangle
} from '@tabler/icons-react'
import { toast } from '@/components/ui/use-toast'
import { templateService } from '@/api/template.service'
import { templateGroupService } from '@/api/template-group.service'
import { useQueryClient } from '@tanstack/react-query'
import { Switch } from '@/components/ui/switch'
import { Globe, Lock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { useAuth } from '@/hooks/use-auth'
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
    const { user } = useAuth()

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
    const [showSidebar, setShowSidebar] = useState(false) // For mobile
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(initialData?.id || initialData?._id || null)
    const [remoteSelections, setRemoteSelections] = useState<Record<string, { userId: string, userName: string, color: string, avatar?: string }>>({})

    const checkIsOwner = (template: any) => {
        if (!template || !user) return false;
        let createdById = null;
        if (typeof template.createdBy === 'string') {
            createdById = template.createdBy;
        } else if (template.createdBy && typeof template.createdBy === 'object') {
            createdById = template.createdBy.id || template.createdBy._id;
        }
        const currentUserId = user.id || (user as any)._id;
        if (!createdById || !currentUserId) return false;
        return createdById.toString() === currentUserId.toString();
    }

    const isOwner = checkIsOwner(initialData)

    const zonesRef = useRef<Zone[]>(zones)
    const socketRef = useRef(socket)
    const currentTemplateIdRef = useRef(currentTemplateId)
    const remoteSelectionsRef = useRef(remoteSelections)
    const lastBroadcastRef = useRef<number>(0)
    const transformingIdRef = useRef<string | null>(null)
    const THROTTLE_MS = 16 // ~60fps sync for hyper-smooth movement

    const queryClient = useQueryClient()

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
                    if (typeof (latest as any).isPublic !== 'undefined') setIsPublic((latest as any).isPublic)
                    if ((latest as any).collaborators) setCollaborators((latest as any).collaborators)

                    // 2. CRITICAL: Update the canvas objects directly
                    //    The canvas was initialized from stale initialData.
                    //    We must sync it to the real server state.
                    const canvas = canvasRef.current
                    if (canvas) {
                        freshZones.forEach((latestZone: Zone) => {
                            const obj = canvas.getObjects().find((o: any) => o.id === latestZone.id) as any
                            if (obj) {
                                // Zone exists on canvas — update position and scale
                                obj.set({
                                    left: latestZone.x * GLOBAL_SCALE,
                                    top: latestZone.y * GLOBAL_SCALE,
                                    scaleX: (latestZone.width * GLOBAL_SCALE) / obj.width,
                                    scaleY: (latestZone.height * GLOBAL_SCALE) / obj.height,
                                })
                                obj.setCoords()
                            } else {
                                // Zone doesn't exist on canvas — add it
                                addZoneToCanvas(canvas, latestZone)
                            }
                        })

                        // Remove zones from canvas that are no longer in the latest save
                        const freshIds = new Set(freshZones.map((z: Zone) => z.id))
                        canvas.getObjects().forEach((o: any) => {
                            if (o.id && !freshIds.has(o.id)) {
                                canvas.remove(o)
                            }
                        })

                        canvas.requestRenderAll()
                        console.log('[COLLAB] Canvas synced to latest server state without delay.')
                    } else {
                        // Very rare case: canvas isn't mounted yet. Retry once after tiny delay.
                        setTimeout(() => {
                            if (canvasRef.current) fetchLatest()
                        }, 50)
                    }
                }
            } catch (err) {
                console.error('[COLLAB] Failed to fetch latest template data:', err)
            }
        }

        fetchLatest()
    }, []) // Only on mount

    // --- SOCKET SYNC ---
    useEffect(() => {
        const templateId = currentTemplateId?.toString().trim().toLowerCase()
        if (!socket || !templateId) return

        console.log('[COLLAB] Joining template room:', templateId)
        socket.emit('join_template', templateId)

        const handleRemoteUpdate = (data: any) => {
            const incomingId = data.templateId?.toString().trim().toLowerCase()
            if (incomingId !== templateId) return
            console.log('[COLLAB] Remote update received:', data)

            if (data.zones) {
                // Determine if we should update React state
                // Only update zones that are NOT currently being TRANSFORMED locally
                const canvas = canvasRef.current
                const activeTransformId = transformingIdRef.current

                setZones(prev => {
                    const nextZones = [...prev]
                    data.zones.forEach((remoteZone: Zone) => {
                        const index = nextZones.findIndex(z => z.id === remoteZone.id)
                        if (index !== -1) {
                            // Only update state if this isn't the one we are actively dragging/scaling
                            if (remoteZone.id !== activeTransformId) {
                                nextZones[index] = remoteZone
                            }
                        } else {
                            nextZones.push(remoteZone)
                        }
                    })

                    // Handle removals
                    const remoteIds = new Set(data.zones.map((z: any) => z.id))
                    return nextZones.filter(z => remoteIds.has(z.id) || z.id === activeTransformId)
                })

                if (canvas) {
                    data.zones.forEach((remoteZone: Zone) => {
                        // Skip if this object is currently being transformed locally
                        if (remoteZone.id === activeTransformId) return

                        const obj = canvas.getObjects().find((o: any) => o.id === remoteZone.id) as any
                        if (obj) {
                            // Smoothly animate to new position for fluid real-time movement
                            const targetLeft = remoteZone.x * SCALE
                            const targetTop = remoteZone.y * SCALE
                            const targetScaleX = (remoteZone.width * SCALE) / obj.width
                            const targetScaleY = (remoteZone.height * SCALE) / obj.height

                            // Use direct set for small deltas (instant) or animate for larger moves
                            const dx = Math.abs(obj.left - targetLeft)
                            const dy = Math.abs(obj.top - targetTop)
                            if (dx + dy > 2) {
                                obj.animate(
                                    { left: targetLeft, top: targetTop, scaleX: targetScaleX, scaleY: targetScaleY },
                                    {
                                        duration: 80,
                                        onChange: () => {
                                            // Also keep label tag in sync during animation
                                            const tag = canvas.getObjects().find((o: any) => o._forZoneId === obj.id && o._isRemoteTag) as any
                                            if (tag) {
                                                tag.set({ left: obj.left, top: obj.top - 30 })
                                                tag.setCoords()
                                            }
                                            canvas.requestRenderAll()
                                        },
                                        easing: (t: number, b: number, c: number, d: number) => c * t / d + b, // linear
                                    }
                                )
                            } else {
                                obj.set({ left: targetLeft, top: targetTop, scaleX: targetScaleX, scaleY: targetScaleY })
                                obj.setCoords()
                            }

                            // Also sync remote tag position if present and not mid-animation
                            const tag = canvas.getObjects().find((o: any) => o._forZoneId === obj.id && o._isRemoteTag)
                            if (tag) {
                                (tag as any).set({
                                    left: obj.left,
                                    top: obj.top - 30
                                }); (tag as any).setCoords()
                            }
                        } else {
                            addZoneToCanvas(canvas, remoteZone)
                        }
                    })

                    // Remove objects that were deleted remotely (but never remove presence tags)
                    const remoteIds = new Set(data.zones.map((z: any) => z.id))
                    canvas.getObjects().forEach((o: any) => {
                        if (o._isRemoteTag) return // never auto-remove presence tags; managed by remoteSelections
                        if (o.id && !remoteIds.has(o.id) && o.id !== activeTransformId) {
                            canvas.remove(o)
                        }
                    })

                    canvas.requestRenderAll()
                }
            }

            if (data.name !== undefined) setTemplateName(data.name)
            if (data.isPublic !== undefined) setIsPublic(data.isPublic)
        }

        const handleCollabUpdate = async () => {
            console.log('[COLLAB] Refreshing collaborators due to acceptance')
            try {
                const updated = await templateService.getTemplate(templateId)
                if (updated && updated.collaborators) {
                    setCollaborators(updated.collaborators)
                }
            } catch (err) {
                console.error('Failed to refresh collaborators:', err)
            }
        }

        const handleZoneLocked = (data: any) => {
            if (data.userId === (user?.id || (user as any)?._id)) return

            // Force drop if we happen to have it selected (lost the race)
            const canvas = canvasRef.current
            if (canvas) {
                const active = canvas.getActiveObject() as any
                if (active && active.id === data.zoneId) {
                    canvas.discardActiveObject()
                    canvas.requestRenderAll()
                    setSelectedZoneId(null)
                    transformingIdRef.current = null
                    toast({
                        title: "Race condition resolved",
                        description: `${data.userName} got the lock micro-seconds before you!`,
                        variant: 'default'
                    })
                }
            }

            setRemoteSelections(prev => ({
                ...prev,
                [data.zoneId]: {
                    userId: data.userId,
                    userName: data.userName,
                    color: data.color || '#4f46e5'
                }
            }))

            // CRITICAL: If we were the one trying to select it, the handler above (handleZoneLocked)
            // will handle the race. But we also want to ensure the object is no longer selectable locally.
            if (canvas) {
                const obj = canvas.getObjects().find((o: any) => o.id === data.zoneId) as any
                if (obj) {
                    obj.set({
                        selectable: false,
                        evented: false
                    })
                    canvas.requestRenderAll()
                }
            }
        }

        const handleLockRejected = (data: any) => {
            // The server explicitly rejected our lock request (someone else has it)
            const canvas = canvasRef.current
            if (canvas) {
                const active = canvas.getActiveObject() as any
                // Even if not active, we should un-select internally just in case
                if (active && active.id === data.zoneId) {
                    canvas.discardActiveObject()
                    canvas.requestRenderAll()
                }

                // SECURE: Disable the object locally immediately
                const obj = canvas.getObjects().find((o: any) => o.id === data.zoneId) as any
                if (obj) {
                    obj.set({
                        selectable: false,
                        evented: false,
                        hasControls: false
                    })
                    canvas.requestRenderAll()
                }
            }
            setSelectedZoneId(null)
            transformingIdRef.current = null
            toast({
                title: "Lock Rejected",
                description: "Someone else is actively editing this zone.",
                variant: 'destructive'
            })
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
        socket.on('lock_rejected', handleLockRejected)
        socket.on('zone_unlocked', handleZoneUnlocked)

        return () => {
            if (transformingIdRef.current) {
                emitUnlock(transformingIdRef.current)
            } else if (selectedZoneId) {
                // If we have a selected id but not transforming, unlock it
                const templateId = currentTemplateId?.toString().trim().toLowerCase()
                if (socket && templateId) {
                    socket.emit('unlock_zone', { templateId, zoneId: selectedZoneId })
                }
            }
            socket.off('template_updated', handleRemoteUpdate)
            socket.off('collaboration_accepted', handleCollabUpdate)
            socket.off('zone_locked', handleZoneLocked)
            socket.off('lock_rejected', handleLockRejected)
            socket.off('zone_unlocked', handleZoneUnlocked)
        }
    }, [socket, currentTemplateId, selectedZoneId])

    // --- VISUAL PRESENCE (REMOTE SELECTIONS) ---
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.getObjects().forEach((obj: any) => {
            if (!obj.id) return

            const remote = remoteSelections[obj.id]
            if (remote) {
                // 1. Disable local selection
                obj.set({
                    selectable: false,
                    evented: false, // Prevent even hover/click
                    borderColor: remote.color,
                    borderScaleFactor: 2,
                    hasControls: false,
                })

                // 2. Add visual presence tag if missing
                let tag = canvas.getObjects().find((o: any) => o._forZoneId === obj.id && o._isRemoteTag) as any
                if (!tag) {
                    const FONT_SIZE = 11
                    const PAD_H = 10
                    const PAD_V = 4

                    // Create text first to measure it
                    const labelText = new fabric.Text(remote.userName, {
                        fontSize: FONT_SIZE,
                        fill: '#ffffff',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 'bold',
                        left: PAD_H,
                        top: PAD_V,
                    })

                    const textW = labelText.width ?? 60
                    const textH = labelText.height ?? FONT_SIZE
                    const rectW = textW + (PAD_H * 2)
                    const rectH = textH + (PAD_V * 2)

                    const bgRect = new fabric.Rect({
                        width: rectW,
                        height: rectH,
                        fill: remote.color,
                        rx: 4,
                        ry: 4,
                        left: 0,
                        top: 0
                    })

                    // Center the text perfectly within the rect inside the group
                    tag = new fabric.Group([bgRect, labelText], {
                        selectable: false,
                        evented: false,
                        // @ts-ignore
                        _forZoneId: obj.id,
                        _isRemoteTag: true,
                        originX: 'left',
                        originY: 'bottom' // keep origin bottom so we can easily stick it above the zone
                    })

                    canvas.add(tag)
                }

                // Position the label snugly above the zone's top-left corner
                tag.set({
                    left: obj.left,
                    top: obj.top - 2,
                    visible: true
                })
                tag.setCoords()
                canvas.bringObjectToFront(tag)
            } else {
                // Restore if was previously locked
                if (obj.borderColor !== obj.cornerStrokeColor) { // Check if it was remote colored
                    obj.set({
                        selectable: true,
                        evented: true,
                        borderColor: obj.cornerStrokeColor,
                        borderScaleFactor: 1,
                        hasControls: true
                    })
                }

                const tag = canvas.getObjects().find((o: any) => o._forZoneId === obj.id && o._isRemoteTag)
                if (tag) canvas.remove(tag)
            }
        })

        canvas.requestRenderAll()
    }, [remoteSelections])

    const broadcastUpdate = (updates: any) => {
        const templateId = currentTemplateIdRef.current?.toString().trim().toLowerCase()
        if (!socketRef.current || !templateId) return

        socketRef.current.emit('template_edit', {
            templateId,
            ...updates
        })
    }

    const emitLock = (zoneId: string) => {
        const templateId = currentTemplateId?.toString().trim().toLowerCase()
        if (!socket || !templateId || !user) return

        const userId = user.id || (user as any)._id || ''
        // Generate a deterministic color from userId so each collaborator has a consistent color
        const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
        const colorIndex = userId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % PALETTE.length
        const userColor = PALETTE[colorIndex]

        socket.emit('lock_zone', {
            templateId,
            zoneId,
            userId,
            userName: `${(user as any).first_name || ''} ${(user as any).last_name || ''}`.trim() || 'Collaborator',
            color: userColor
        })
    }

    const emitUnlock = (zoneId: string) => {
        const templateId = currentTemplateId?.toString().trim().toLowerCase()
        if (!socket || !templateId) return

        socket.emit('unlock_zone', {
            templateId,
            zoneId
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

    const hasOverlaps = useMemo(() => {
        if (!zones || zones.length < 2) return false
        for (let i = 0; i < zones.length; i++) {
            for (let j = i + 1; j < zones.length; j++) {
                const z1 = zones[i]
                const z2 = zones[j]
                if (
                    z1.x < z2.x + z2.width &&
                    z1.x + z1.width > z2.x &&
                    z1.y < z2.y + z2.height &&
                    z1.y + z1.height > z2.y
                ) return true
            }
        }
        return false
    }, [zones])


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
            objectCaching: false, // Performance: Disable caching for smooth real-time transformation
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
            objectCaching: false, // Performance: Disable caching for the group to prevent blurry/laggy scaling
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
        if (!obj || !canvasRef.current || !obj.id) return
        transformingIdRef.current = obj.id // Track active transform
        constrainObject(obj)
        canvasRef.current.requestRenderAll()

        const now = Date.now()
        if (now - lastBroadcastRef.current > THROTTLE_MS) {
            lastBroadcastRef.current = now
            const updatedZones = zonesRef.current.map(z => {
                if (z.id !== obj.id) return z
                return {
                    ...z,
                    x: Math.round(obj.left / SCALE),
                    y: Math.round(obj.top / SCALE),
                    width: Math.round(obj.getScaledWidth() / SCALE),
                    height: Math.round(obj.getScaledHeight() / SCALE),
                }
            })
            broadcastUpdate({ zones: updatedZones })
        }
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
        transformingIdRef.current = null // Clear transform on modified (end of drag/scale)

        // 1. Snap to grid
        let left = Math.round(obj.left / GRID_SIZE) * GRID_SIZE
        let top = Math.round(obj.top / GRID_SIZE) * GRID_SIZE
        obj.set({ left, top })

        // 2. Then constrain strictly (boundaries)
        constrainObject(obj)

        // 3. Last valid position tracking
        obj._lastValidLeft = obj.left
        obj._lastValidTop = obj.top

        if (canvasRef.current) canvasRef.current.requestRenderAll()

        // Update state and broadcast final position
        setZones(currentZones => {
            const nextZones = currentZones.map(z => {
                if (z.id !== obj.id) return z
                return {
                    ...z,
                    x: Math.round(obj.left / SCALE),
                    y: Math.round(obj.top / SCALE),
                    width: Math.round(obj.getScaledWidth() / SCALE),
                    height: Math.round(obj.getScaledHeight() / SCALE),
                }
            })
            broadcastUpdate({ zones: nextZones })
            return nextZones
        })
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
            canvasRef.current.bringObjectToFront(rect)
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
            canvasRef.current.bringObjectToFront(rect)
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
    }, [socket, currentTemplateId, zones])

    const saveTemplate = async (isCollaborationAutoSave = false) => {
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

            console.log('[SAVE] Starting save for template:', templateName)

            // OPTIMISTIC UI: For new templates, we want it to show up in the list IMMEDIATELY
            if (!currentTemplateId) {
                const tempId = `temp-${Date.now()}`
                const optimisticTemplate = {
                    ...payload,
                    _id: tempId,
                    id: tempId,
                    createdBy: user,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }

                queryClient.setQueryData(['templates'], (old: any) => {
                    if (!old || !old.docs) return old
                    return {
                        ...old,
                        docs: [optimisticTemplate, ...old.docs],
                        totalDocs: (old.totalDocs || 0) + 1
                    }
                })
            }

            if (currentTemplateId) {
                await templateService.updateTemplate(currentTemplateId, payload)
            } else {
                const newTemplate = await templateService.createTemplate(payload)
                if (newTemplate?.id || newTemplate?._id) {
                    const newId = (newTemplate.id || newTemplate._id) as string
                    setCurrentTemplateId(newId)

                    // Auto-assign to group if requested
                    if (initialData?.autoAssignGroupId) {
                        await templateGroupService.addTemplatesToGroup(initialData.autoAssignGroupId, [newId])
                        queryClient.invalidateQueries({ queryKey: ['template-groups'] })
                    }

                    // Return the new ID so the caller can use it immediately
                    if (isCollaborationAutoSave) {
                        setIsSaving(false)
                        queryClient.invalidateQueries({ queryKey: ['templates'] })
                        return newId
                    }
                }
            }

            // Final sync after real server response
            await queryClient.invalidateQueries({ queryKey: ['templates'] })
            toast({ title: currentTemplateId ? 'Template updated!' : 'Template saved!' })

            if (!isCollaborationAutoSave) {
                onCancel()
            }
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

                    // PROACTIVE LOCKING: Request lock as soon as mouse goes down
                    if (obj.id) {
                        const remote = remoteSelectionsRef.current[obj.id]
                        if (remote) {
                            // SECURE: Hard-stop selection if we know it's locked
                            canvas.discardActiveObject()
                            obj.set({ selectable: false, evented: false })
                            canvas.requestRenderAll()
                        } else {
                            emitLock(obj.id)
                        }
                    }
                    canvas.renderAll()
                }
            })

            // Fix for double-click bypass
            canvas.on('mouse:dblclick', (options) => {
                if (options.target) {
                    const obj = options.target as any
                    if (obj.id) {
                        const remote = remoteSelectionsRef.current[obj.id]
                        if (remote) {
                            canvas.discardActiveObject()
                            obj.set({ selectable: false, evented: false })
                            canvas.requestRenderAll()
                            toast({ title: "Zone is locked", description: `${remote.userName} is currently editing this zone.` })
                        }
                    }
                }
            })

            canvas.on('selection:created', (e) => {
                const obj = e.selected?.[0] as any
                if (obj) {
                    // STRICT CONCURRENCY CHECK
                    const remote = remoteSelectionsRef.current[obj.id]
                    if (obj.id && remote) {
                        canvas.discardActiveObject()
                        obj.set({ selectable: false, evented: false }) // Reinforce
                        canvas.requestRenderAll()
                        toast({ title: "Zone is locked", description: `${remote.userName} is currently editing this zone.` })
                        return
                    }

                    obj._lastValidLeft = obj.left
                    obj._lastValidTop = obj.top
                    // @ts-ignore
                    canvas.bringObjectToFront(obj)
                    constrainObject(obj)
                    obj.setCoords()
                    canvas.renderAll()
                    if (obj.id) {
                        setSelectedZoneId(obj.id)
                        emitLock(obj.id)
                    }
                }
            })
            canvas.on('selection:updated', (e) => {
                const obj = e.selected?.[0] as any
                if (obj) {
                    // STRICT CONCURRENCY CHECK
                    const remote = remoteSelectionsRef.current[obj.id]
                    if (obj.id && remote) {
                        canvas.discardActiveObject()
                        obj.set({ selectable: false, evented: false }) // Reinforce
                        canvas.requestRenderAll()
                        toast({ title: "Zone is locked", description: `${remote.userName} is currently editing this zone.` })
                        return
                    }

                    obj._lastValidLeft = obj.left
                    obj._lastValidTop = obj.top
                    // @ts-ignore
                    canvas.bringObjectToFront(obj)
                    constrainObject(obj)
                    obj.setCoords()
                    canvas.renderAll()
                    if (obj.id) {
                        setSelectedZoneId(obj.id)
                        emitLock(obj.id)
                    }
                }
            })
            canvas.on('selection:cleared', (e) => {
                const deselected = (e as any).deselected?.[0]
                if (deselected?.id) {
                    // Only unlock if it's NOT remote locked (prevents us from unlocking others' zones by accident)
                    const remote = remoteSelectionsRef.current[deselected.id]
                    if (!remote) {
                        emitUnlock(deselected.id)
                    }
                }
                setSelectedZoneId(null)
                transformingIdRef.current = null
            })

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
        <div className='flex flex-col lg:flex-row h-[calc(100vh-40px)] gap-4 lg:gap-6 overflow-hidden relative'>
            <Card className={cn(
                'flex w-full lg:w-72 flex-col p-4 shadow-lg h-full overflow-hidden flex-shrink-0 transition-all duration-300 z-50',
                'absolute inset-y-0 left-0 lg:relative lg:translate-x-0 bg-background',
                !showSidebar && '-translate-x-full lg:translate-x-0'
            )}>
                <div className="flex items-center justify-between lg:hidden mb-4 border-b pb-2">
                    <h2 className="font-bold">Editor Controls</h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(false)}>
                        <IconX size={20} />
                    </Button>
                </div>
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
                                            canvas.bringObjectToFront(obj)
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
                    <Button loading={isSaving} size="sm" onClick={() => saveTemplate()}>
                        <IconDeviceFloppy className='mr-2' size={18} />
                        Save Layout
                    </Button>
                </div>
            </Card>

            <div className='relative flex-1 flex flex-col overflow-hidden rounded-lg bg-muted/20 p-2 lg:p-4'>
                <div className='mb-2 flex flex-col gap-2 bg-background/50 p-3 rounded-xl border border-primary/10 shadow-sm'>
                    <div className='flex items-center gap-2 lg:gap-4 w-full'>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden shrink-0"
                            onClick={() => setShowSidebar(true)}
                        >
                            <IconMenu2 size={24} />
                        </Button>
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0 hidden sm:block">
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
                        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                            {/* ZOOM CONTROLS */}
                            <div className="flex items-center gap-1 bg-background border rounded-md shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleZoom(-0.1)}>
                                    -
                                </Button>
                                <span className="text-[10px] sm:text-xs w-8 sm:w-12 text-center font-mono">{(zoomLevel * 100).toFixed(0)}%</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleZoom(0.1)}>
                                    +
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-[10px] sm:text-xs" onClick={resetZoom} title="Reset Zoom">
                                    ↺
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 bg-background border-primary/20 hover:bg-primary/5 shadow-sm px-4 font-bold text-xs"
                                onClick={async () => {
                                    let templateId = currentTemplateId;
                                    if (!templateId) {
                                        // Auto-save as draft first to get an ID
                                        const result = await saveTemplate(true);
                                        templateId = result || null;
                                    }
                                    if (templateId) {
                                        setIsCollaborateOpen(true);
                                    }
                                }}
                            >
                                <Users size={16} className="text-primary" /> Collaborate
                                {collaborators.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 px-1 h-4 min-w-4 flex items-center justify-center text-[10px]">
                                        {collaborators.length}
                                    </Badge>
                                )}
                            </Button>

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

                {hasOverlaps && (
                    <div className="mb-4 flex items-center gap-3 bg-yellow-500/10 border-y lg:border border-yellow-500/30 p-3 lg:rounded-xl text-yellow-600 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-yellow-500 text-white p-1.5 rounded-lg">
                            <IconAlertTriangle size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-tight text-yellow-700">Zones Overlapping</span>
                            <span className="text-[10px] opacity-80 leading-tight">Some zones are placed on top of each other. The player will try to auto-fix this.</span>
                        </div>
                    </div>
                )}

                <CollaborateDialog
                    isOpen={isCollaborateOpen}
                    onClose={async () => {
                        setIsCollaborateOpen(false)
                        // Refresh collaborators if needed
                        const templateId = currentTemplateId
                        if (templateId) {
                            try {
                                const updated = await templateService.getTemplate(templateId)
                                if (updated && updated.collaborators) setCollaborators(updated.collaborators)
                            } catch (error) {
                                console.error('[COLLAB] Failed to refresh collaborators:', error)
                            }
                        }
                    }}
                    templateId={currentTemplateId as string}
                    currentCollaborators={collaborators}
                    isOwner={isOwner}
                    creator={initialData?.createdBy} // Pass creator explicitly
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
