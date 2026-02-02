import * as fabric from 'fabric'

/**
 * Initialize the Fabric Canvas with default settings
 */
export const initFabricCanvas = (
    canvasElement: HTMLCanvasElement,
    width: number,
    height: number,
    backgroundColor = '#111111'
) => {
    const canvas = new fabric.Canvas(canvasElement, {
        width,
        height,
        backgroundColor,
        selection: true,
        preserveObjectStacking: true, // Selected object stays in place (doesn't jump to top)
    })

    return canvas
}

/**
 * Create a Fabric Rect representing a Zone
 */
export const createFabricZone = (
    zone: {
        id: string
        type: string
        name: string
        x: number
        y: number
        width: number
        height: number
    },
    scaleFactor = 1
) => {
    let fillColor = '#f59e0b'
    if (zone.type === 'video') fillColor = '#3b82f6'
    if (zone.type === 'image') fillColor = '#10b981'
    if (zone.type === 'mixed') fillColor = '#8b5cf6'

    const rect = new fabric.Rect({
        left: zone.x * scaleFactor,
        top: zone.y * scaleFactor,
        width: zone.width * scaleFactor,
        height: zone.height * scaleFactor,
        fill: fillColor + '44', // 25% opacity
        stroke: fillColor,
        strokeWidth: 1,
        strokeUniform: true,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#ffffff',
        transparentCorners: false,
        cornerSize: 8,
        data: { ...zone }, // Custom data property to store metadata
    } as any)

    // Add a text label to the group
    // Note: Grouping text with rect makes resizing complex in Fabric. 
    // For V1, we'll just use the Rect and maybe overlay text if needed, 
    // or use a simple visual cue.
    // Alternatively, we can subclass fabric.Rect to draw text.

    return rect
}

/**
 * Snap object to grid
 */
export const snapToGrid = (
    target: fabric.Object,
    gridSize: number,
    canvasWidth: number,
    canvasHeight: number
) => {
    if (!target) return

    const left = Math.round(target.left! / gridSize) * gridSize
    const top = Math.round(target.top! / gridSize) * gridSize

    // Snap position
    target.set({
        left,
        top
    })

    // Snap scaling (if resizing)
    if (target.scaleX !== 1 || target.scaleY !== 1) {
        const width = target.getScaledWidth()
        const height = target.getScaledHeight()

        const snappedWidth = Math.round(width / gridSize) * gridSize
        const snappedHeight = Math.round(height / gridSize) * gridSize

        target.set({
            scaleX: 1,
            scaleY: 1,
            width: snappedWidth,
            height: snappedHeight
        })
    }

    // Boundary checks (basic)
    if (target.left! < 0) target.left = 0
    if (target.top! < 0) target.top = 0
    if ((target.left! + target.getScaledWidth()) > canvasWidth) {
        target.left = canvasWidth - target.getScaledWidth()
    }
    if ((target.top! + target.getScaledHeight()) > canvasHeight) {
        target.top = canvasHeight - target.getScaledHeight()
    }
}

/**
 * Restrict object movement within canvas boundaries
 */
export const restrictToBoundary = (
    target: fabric.Object,
    canvasWidth: number,
    canvasHeight: number
) => {
    if (!target) return

    const objWidth = target.getScaledWidth()
    const objHeight = target.getScaledHeight()

    // Left Boundary
    if (target.left! < 0) {
        target.left = 0
    }

    // Top Boundary
    if (target.top! < 0) {
        target.top = 0
    }

    // Right Boundary
    if (target.left! + objWidth > canvasWidth) {
        target.left = canvasWidth - objWidth
    }

    // Bottom Boundary
    if (target.top! + objHeight > canvasHeight) {
        target.top = canvasHeight - objHeight
    }
}
