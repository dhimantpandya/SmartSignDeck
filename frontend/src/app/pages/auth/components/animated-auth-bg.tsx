import { motion } from 'framer-motion'

export function AnimatedAuthBg() {
    // 🚀 Performance: Disable complex mesh animations on mobile to ensure zero keyboard lag
    if (typeof window !== 'undefined' && window.innerWidth <= 768) return null;

    return (
        <div className='fixed inset-0 z-[-1] overflow-hidden bg-[#020817]'>
            {/* Mesh Gradients blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className='absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-primary/20 blur-[120px]'
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -80, 0],
                    y: [0, 100, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className='absolute bottom-[-10%] right-[-10%] h-[70%] w-[70%] rounded-full bg-blue-500/10 blur-[150px]'
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 360],
                }}
                transition={{
                    duration: 40,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className='absolute top-[20%] right-[10%] h-[40%] w-[40%] rounded-full bg-purple-500/10 blur-[100px]'
            />

            {/* Subtle Noise/Grain Overlay for texture */}
            <div className='absolute inset-0 opacity-[0.03] pointer-events-none bg-[url("https://grainy-gradients.vercel.app/noise.svg")]' />
        </div>
    )
}
