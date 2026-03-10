import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconSparkles, IconSend, IconMessageCircle, IconRobot } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export const GuideBuddy = () => {
    const isVisible = true
    const [showBubble, setShowBubble] = useState(false)
    const [isChatMode, setIsChatMode] = useState(false)
    const [step, setStep] = useState(0)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const chatEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isChatMode) scrollToBottom()
    }, [messages, isChatMode])

    const systemKnowledge: Record<string, string[]> = {
        'templates': [
            'Templates are reusable designs for your signage.',
            'Global templates are public, while My Templates are private.',
            'You can clone any global template to make it your own.',
            'Click "Capture This Layout" in the slider to instantly copy a zone structure.'
        ],
        'screens': [
            'Screens represent your physical displays.',
            'You can assign a playlist or a specific template to a screen.',
            'Online status tells you if the screen is currently connected and playing.',
            'You can add a new screen from the Dashboard or Screen Management page.'
        ],
        'collaboration': [
            'Multiple users can edit the same template in real-time.',
            'Zones get locked when someone selects them to prevent conflicts.',
            'Collaborators have colored labels with their names on the canvas.',
            'You can invite teammates by clicking "Invite" in the Collaboration section.'
        ],
        'recycle bin': [
            'Deleted templates and screens go to the Recycle Bin.',
            'Items are permanently purged after 30 days.',
            'You can restore items instantly to their original location.'
        ],
        'sync': [
            'Our system uses real-time sync for all changes.',
            'Zone movements are optimized to 60fps for a smooth experience.',
            'Toasts and UI updates are optimistic, meaning they happen instantly!'
        ]
    }

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

    const handleSendMessage = () => {
        if (!inputValue.trim()) return

        const userMsg: Message = {
            id: Math.random().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInputValue('')

        // AI Response Logic
        setTimeout(() => {
            let response = "I'm sorry, I'm only trained to help with SmartSignDeck system features. Please ask about Templates, Screens, Collaboration, or the Recycle Bin!"
            const lowerInput = inputValue.toLowerCase()

            for (const [key, facts] of Object.entries(systemKnowledge)) {
                if (lowerInput.includes(key)) {
                    response = facts[Math.floor(Math.random() * facts.length)]
                    break
                }
            }

            const aiMsg: Message = {
                id: Math.random().toString(),
                text: response,
                sender: 'ai',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMsg])
        }, 600)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {showBubble && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="pointer-events-auto relative bg-background/90 backdrop-blur-2xl border border-primary/20 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] p-6 w-[320px] max-h-[450px] overflow-hidden flex flex-col"
                    >
                        {/* Glowing Background Effect */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

                        <div className="relative flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <IconSparkles size={16} className="text-primary animate-pulse" />
                                    <h4 className="font-black text-xs uppercase tracking-widest text-primary/80">
                                        {isChatMode ? 'SyncBuddy AI' : 'SyncBuddy Tip'}
                                    </h4>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary"
                                    onClick={() => setIsChatMode(!isChatMode)}
                                >
                                    {isChatMode ? 'Show Tips' : 'Ask Question'}
                                </Button>
                            </div>

                            {!isChatMode ? (
                                <div className="space-y-3">
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
                            ) : (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-primary/10">
                                        {messages.length === 0 && (
                                            <div className="text-center py-8">
                                                <IconRobot className="h-8 w-8 text-primary/20 mx-auto mb-2" />
                                                <p className="text-xs text-muted-foreground">Ask me anything about SmartSignDeck!</p>
                                            </div>
                                        )}
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={cn(
                                                "flex flex-col max-w-[85%]",
                                                msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                            )}>
                                                <div className={cn(
                                                    "px-3 py-2 rounded-2xl text-xs font-medium",
                                                    msg.sender === 'user'
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none border border-border/50"
                                                )}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ask about templates..."
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="h-9 rounded-xl text-xs bg-background/50 border-primary/20"
                                        />
                                        <Button size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={handleSendMessage}>
                                            <IconSend size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setShowBubble(false)
                                // If they close the bubble multiple times, maybe we hide the buddy?
                                // For now, just close bubble. Setter is used in useEffect auto-show.
                            }}
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
                onClick={() => {
                    setShowBubble(!showBubble)
                    if (!showBubble && messages.length === 0) {
                        setIsChatMode(false) // Start with tips
                    }
                }}
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
                        {isChatMode ? <IconMessageCircle size={10} className="text-primary" /> : <div className="w-2 h-2 bg-primary rounded-full" />}
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
                        {isChatMode ? 'Chat Active' : 'Need help?'}
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
