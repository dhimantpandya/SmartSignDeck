import { useEffect, useRef, useState } from 'react'
import { apiService } from '@/api'

interface CameraCaptureProps {
    onDemographicsDetected: (demographics: any) => void
    intervalMs?: number
}

export default function CameraCapture({ onDemographicsDetected, intervalMs = 10000 }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setHasPermission(true)
                }
            } catch (err) {
                console.error('Camera permission denied:', err)
                setHasPermission(false)
            }
        }

        startCamera()

        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
                tracks.forEach(track => track.stop())
            }
        }
    }, [])

    useEffect(() => {
        if (!hasPermission) return

        const captureSnapshot = async () => {
            if (!videoRef.current || !canvasRef.current) return

            const video = videoRef.current
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')

            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0, canvas.width, canvas.height)

                const imageData = canvas.toDataURL('image/jpeg', 0.7)

                try {
                    const demographics = await apiService.post<any>('/v1/audience/detect', { image: imageData })
                    onDemographicsDetected(demographics)
                } catch (err) {
                    console.error('Detection failed:', err)
                }
            }
        }

        const interval = setInterval(captureSnapshot, intervalMs)
        return () => clearInterval(interval)
    }, [hasPermission, intervalMs, onDemographicsDetected])

    return (
        <div className="hidden">
            <video ref={videoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} />
        </div>
    )
}
