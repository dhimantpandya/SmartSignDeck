
export function AnimatedAuthBg() {
    return (
        <div className='fixed inset-0 z-[-1] overflow-hidden bg-background'>
            {/* Static Mesh Gradients - Removed JS animations to prevent massive GPU lag on low-end PCs */}
            <div className='absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-primary/20 blur-[120px]' />
            <div className='absolute bottom-[-10%] right-[-10%] h-[70%] w-[70%] rounded-full bg-blue-500/10 blur-[150px]' />
            <div className='absolute top-[20%] right-[10%] h-[40%] w-[40%] rounded-full bg-purple-500/10 blur-[100px]' />

            {/* Subtle Noise/Grain Overlay for texture */}
            <div className='absolute inset-0 opacity-[0.03] pointer-events-none bg-[url("https://grainy-gradients.vercel.app/noise.svg")]' />
        </div>
    )
}
