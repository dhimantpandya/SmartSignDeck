import { useEffect, useRef } from 'react'

interface VisualMapProps {
    template: {
        resolution: string
        zones: any[]
    }
    content?: Record<string, any>
    width?: number
    className?: string
}

export function VisualMap({ template, content = {}, width = 800, className = '' }: VisualMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mediaCache = useRef<Record<string, HTMLImageElement | HTMLVideoElement>>({})

    useEffect(() => {
        if (!template || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Resolution & Scale setup
        const resolution = template.resolution || '1920x1080'
        const [targetWidth, targetHeight] = resolution.split('x').map(Number)

        // Calculate scale to fit the requested width
        const SCALE = width / targetWidth

        canvas.width = width
        canvas.height = targetHeight * SCALE

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Background
            ctx.fillStyle = '#111'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            template.zones.forEach((zone: any) => {
                const scaledX = zone.x * SCALE
                const scaledY = zone.y * SCALE
                const scaledW = zone.width * SCALE
                const scaledH = zone.height * SCALE

                const zoneContent = content?.[zone.id]

                // Draw Text Zone
                if (zone.type === 'text') {
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

                        // Simple Multi-line Handling
                        const lines = String(zoneContent.text).split('\n')
                        const lineHeight = fontSize * (style.lineHeight || 1.2)
                        const totalTextHeight = lines.length * lineHeight
                        let yPos = scaledY + (scaledH - totalTextHeight) / 2 + (lineHeight / 2)

                        lines.forEach((line: string) => {
                            ctx.fillText(line, xPos, yPos)
                            // Stroke
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
                    const playlist = zoneContent?.playlist || []
                    const currentItem = playlist[0] // Just show first item for static preview

                    let drawPlaceholder = true

                    if (currentItem && currentItem.url) {
                        const cachedMedia = mediaCache.current[currentItem.url]

                        if (currentItem.type === 'video') {
                            let video = cachedMedia as HTMLVideoElement
                            if (!video || video.tagName !== 'VIDEO') {
                                video = document.createElement('video')
                                video.src = currentItem.url
                                video.muted = true
                                video.currentTime = 1 // Seek a bit to show frame
                                video.onloadeddata = () => { if (canvasRef.current) draw() } // Redraw when loaded
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
                                img.onload = () => { if (canvasRef.current) draw() } // Redraw when loaded
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

                // Border
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'
                ctx.lineWidth = 1
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

        // Initial Draw
        draw()

        // Ensure fonts load
        document.fonts.ready.then(draw)

    }, [template, content, width])

    return (
        <canvas
            ref={canvasRef}
            className={`cursor-default max-w-full h-auto rounded border border-white/10 shadow-2xl bg-zinc-950 ${className}`}
        />
    )
}
