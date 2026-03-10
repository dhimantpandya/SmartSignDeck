import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconSparkles } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'

export const GuideBuddy = () => {
    const [isVisible, setIsVisible] = useState(false)
    const [showBubble, setShowBubble] = useState(false)
    const [step, setStep] = useState(0)

    const tips = [
        {
            title: "Welcome to SmartSignDeck!",
            content: "I'm SyncBuddy, your AI guide. I'll help you build stunning signage in minutes.",
            action: "Next Tip"
        },
        {
            title: "Instant Zone Capture",
            content: "See a layout you like in the slider? Click 'Capture This Layout' to instantly create its zone structure for your own screen.",
            action: "Cool!"
        },
        {
            title: "Real-Time Collaboration",
            content: "Invite teammates to edit templates together. You'll see their movements and choices live on your screen.",
            action: "Got it"
        },
        {
            title: "Need help?",
            content: "Click me anytime if you feel lost! You're ready to start designing.",
            action: "Start Exploring"
        }
    ]

    useEffect(() => {
        // Auto-show after a short delay on the first visit of the session
        const timer = setTimeout(() => {
            setIsVisible(true)
            setTimeout(() => setShowBubble(true), 1000)
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {showBubble && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="pointer-events-auto relative bg-background/80 backdrop-blur-2xl border border-primary/20 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] p-6 max-w-[280px] overflow-hidden"
                    >
                        {/* Glowing Background Effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

                        <div className="relative space-y-3">
                            <div className="flex items-center gap-2">
                                <IconSparkles size={16} className="text-primary animate-pulse" />
                                <h4 className="font-black text-xs uppercase tracking-widest text-primary/80">SyncBuddy Tip</h4>
                            </div>
                            <h3 className="font-black text-lg leading-tight tracking-tight text-foreground">{tips[step].title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{tips[step].content}</p>

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] font-bold text-muted-foreground/40">{step + 1} / {tips.length}</span>
                                <Button
                                    size="sm"
                                    className="h-8 rounded-full px-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                    onClick={() => {
                                        if (step < tips.length - 1) {
                                            setStep(step + 1)
                                        } else {
                                            setShowBubble(false)
                                        }
                                    }}
                                >
                                    {tips[step].action}
                                </Button>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowBubble(false)}
                            className="absolute top-4 right-4 text-muted-foreground/30 hover:text-foreground transition-colors"
                        >
                            <IconX size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="pointer-events-auto cursor-pointer relative"
                onClick={() => setShowBubble(!showBubble)}
            >
                {/* Floating Shadow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/40 blur-md rounded-full animate-pulse" />

                {/* Character Body (Orb) */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary via-indigo-500 to-primary/80 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.4)] flex items-center justify-center group overflow-hidden border border-white/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent)]" />

                    {/* Animated Eye/Core */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                    >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                    </motion.div>

                    {/* Orbital Ring */}
                    <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-1 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                </div>

                {!showBubble && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-20 top-1/2 -translate-y-1/2 bg-foreground text-background text-[10px] font-black px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl uppercase tracking-widest border border-white/10"
                    >
                        Need help?
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
