import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconSparkles, IconSend, IconMessageCircle, IconRobot, IconActivity, IconListDetails, IconUsers } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

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
    const [currentTopic, setCurrentTopic] = useState<string | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()

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
            'To create a template together: Go to the Collaboration section, invite your teammate, and you both can edit the same canvas live! You\'ll see their colored name labels when they select zones.',
            'Click "Capture This Layout" in the slider to instantly copy a zone structure.',
            'To create a template manually: Go to the Templates page and click "Create Template". You can choose a resolution and then add Text, Media, or Mixed zones using the sidebar tools!',
            'Templates come in 4 types: My (Private), Shared (Collaboration), Groups (Org-wide), and Global (Public System-wide).'
        ],
        'screens': [
            'Screens represent your physical displays.',
            'You can assign a playlist or a specific template to a screen from the Screen Management page.',
            'Online status: Screens ping every 2 mins. If no ping for >2 mins, they show as "offline".',
            'To add a new screen, click "Add Screen" on the Screens page and follow the setup instructions.',
            'Global Screens are public presets; Private Screens are your own custom displays.'
        ],
        'collaboration': [
            'Collaboration allows you to work with teammates in real-time. You can share templates, chat live, and edit the same canvas together!',
            'How to send a request: Go to the Collaboration page, search for a teammate by email, and click "Invite". Once they accept, you can share templates!',
            'Real-time: You see others typing and moving zones instantly. Zones get locked with a colored label when someone is editing them.',
            'Colored labels: Each teammate has a unique color so you know who is working where.',
            'Manage requests in the "Connections" tab within the Collaboration hub.'
        ],
        'recycle bin': [
            'Deleted items stay here for 30 days before being purged forever.',
            'Strict Privacy: Only YOU can see your recycle bin. Even Admins cannot see what you\'ve deleted!',
            'You can restore templates or screens instantly. We even show a safety loader to make sure your workspace is synced before you continue!',
            'To purge an item permanently, select it and click "Purge".'
        ],
        'sync': [
            'Everything in SmartSignDeck is real-time.',
            'We use hyper-speed tech to ensure zone movements are 60fps.',
            'Wait for the "Syncing Workspace" message when restoring items to ensure data consistency.'
        ],
        'users': [
            'The Users section is for Team Management.',
            'Roles: User (Standard), Admin (Team Manager), Super Admin (System wide), Advertiser (Limited viewing).',
            'Wait, why can I see it? Even if you aren\'t an admin, you can see the team overview and your own profile settings. Organization admins use this section to manage roles and permissions.',
            'Admins can add, remove, or edit team members from this component.'
        ],
        'analytics': [
            'The Analytics dashboard shows your signage performance.',
            'Metrics: "Plays" = Total times content was shown; "Screen Time" = Live uptime percentage.',
            'You can check how many plays happened on specific days, unique viewer counts, and screen uptime.',
            'Use the date picker in Analytics to see exactly what happened last Monday or any other time!'
        ],
        'playlists': [
            'Playlists allow you to sequence multiple templates together.',
            'Scheduling: You can set specific start and end times for each playlist on your screens.',
            'Create or edit playlists in the "Playlists" section by dragging and dropping templates into the order you want.',
            'To add media: Simply drag templates into the playlist timeline.'
        ],
        'slider': [
            'The "Inspiration Slider" on the dashboard shows premium designs.',
            'How to use: Simply click "Capture This Layout" on any slide. It will instantly create a new template for you with that exact zone structure!',
            'It helps you visualize how zones (Text, Mixed, Media) work together.'
        ],
        'notifications': [
            'The Bell icon shows your alerts.',
            'You\'ll get notified about connection requests, template invites, and collaborative messages here.'
        ],
        'profile': [
            'Manage your identity in the Profile section.',
            'You can update your profile picture, change your display name, set your gender, and switch the system language.'
        ],
        'canvas': [
            'The Canvas Editor is where you build designs.',
            'How to drag & create: Drag existing zones to move them. Use the sidebar tools to add new Text, Mixed, or Media zones.',
            'Zone types: "Text" for messages; "Media" for videos/images; "Mixed" for both.',
            'Zones get locked live so collaborators don\'t overwrite your work.'
        ],
        'chat': [
            'The Chat Sidebar (in Collaboration) lets you message teammates live.',
            'Messaging is real-time; green dots show who is currently online and active in your team.'
        ],
        'connections': [
            'SmartSignDeck (Super Admin) is your default system friend to help you get started.',
            'Find people by email to expand your network. Once connected, you can see their online status and collaborate!'
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
            action: "Next Tip"
        },
        {
            title: "Analytics Dashboard",
            content: "Track screen performance, total plays, and unique viewers in real-time to measure your impact.",
            icon: <IconActivity size={18} className="text-primary" />,
            action: "Next Tip"
        },
        {
            title: "Playlist Sequencing",
            content: "Chain templates into playlists and schedule them to play at specific times on your screens.",
            icon: <IconListDetails size={18} className="text-primary" />,
            action: "Next Tip"
        },
        {
            title: "Team Management",
            content: "Use the 'Users' section to manage team roles. Invite buddies to your organization with just an email.",
            icon: <IconUsers size={18} className="text-primary" />,
            action: "Got it"
        },
        {
            title: "Need help?",
            content: "Click me anytime or use the 'Ask Question' tab to chat with me about system features!",
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
            let response = "I'm sorry, I'm only trained to help with SmartSignDeck system features. Please ask about Templates, Screens, Collaboration, Analytics, Playlists, or the Recycle Bin!"
            const lowerInput = inputValue.toLowerCase()
            const firstName = user?.first_name || 'Friend'

            // Handle Greetings
            if (lowerInput.match(/^(hi|hello|hey|good morning|good afternoon|good evening|yo)\b/)) {
                const greeting = lowerInput.startsWith('good morning') ? 'Good morning' :
                    lowerInput.startsWith('good afternoon') ? 'Good afternoon' :
                        lowerInput.startsWith('good evening') ? 'Good evening' : 'Hi'
                response = `${greeting} ${firstName}! How can I help you with SmartSignDeck today?`
            }
            else if (lowerInput.match(/^(really|oh|wow|cool|okay|ok|thanks|thank you|means)\b/) && !currentTopic) {
                response = `Absolutely! I'm here to make SmartSignDeck easy for you. What else can I explain?`
            }
            else if (lowerInput.includes('rate') || lowerInput.includes('think of this')) {
                response = "I think we're making great progress, Dhimant! I'm learning more about the system every second. My goal is to be the ultimate 10/10 expert for you."
            }
            else {
                // Feature Mapping with weighted search
                let matchedKey = null

                // 1. Action Override (Priority for specific intents)
                if (lowerInput.includes('restore') || lowerInput.includes('trash') || lowerInput.includes('recycle') || lowerInput.includes('deleted')) {
                    matchedKey = 'recycle bin'
                } else if (lowerInput.includes('manual') || (lowerInput.includes('create') && !lowerInput.includes('slider'))) {
                    matchedKey = 'templates'
                }

                // 2. Direct Keyword Match (if no action override)
                if (!matchedKey) {
                    for (const key of Object.keys(systemKnowledge)) {
                        if (lowerInput.includes(key)) {
                            matchedKey = key
                            break
                        }
                    }
                }

                // 3. Handle follow-ups like "means", "more", "tell me" using currentTopic
                if (!matchedKey && currentTopic && (lowerInput.includes('means') || lowerInput.includes('more') || lowerInput.includes('what') || lowerInput.includes('tell me') || lowerInput.includes('use') || lowerInput.includes('how'))) {
                    matchedKey = currentTopic
                }

                if (matchedKey) {
                    const facts = systemKnowledge[matchedKey]
                    // If it's templates and they asked about manual, try to find that specific fact
                    if (matchedKey === 'templates' && (lowerInput.includes('manual') || lowerInput.includes('manually'))) {
                        response = facts[4]
                    } else if (matchedKey === 'recycle bin' && lowerInput.includes('restore')) {
                        response = facts[2]
                    } else if (lowerInput.includes('what is') || lowerInput.includes('what are') || lowerInput.includes('tell me about')) {
                        response = facts[0] // Always give definition for "what is"
                    } else {
                        response = facts[Math.floor(Math.random() * facts.length)]
                    }
                    setCurrentTopic(matchedKey)
                } else {
                    // 4. System-wide fallback for common terms
                    if (lowerInput.includes('online') || lowerInput.includes('offline')) {
                        response = systemKnowledge['screens']?.[2] || "Screens check in every 2 minutes. If no ping is received, they show as offline."
                        setCurrentTopic('screens')
                    } else if (lowerInput.includes('how to find') || lowerInput.includes('buddy') || lowerInput.includes('friend')) {
                        response = systemKnowledge['connections']?.[0] || "SmartSignDeck (Super Admin) is your default system friend."
                        setCurrentTopic('connections')
                    } else if (lowerInput.includes('zone') || lowerInput.includes('drag')) {
                        response = systemKnowledge['canvas']?.[1] || "Drag zones to reposition them; you can add Text, Media, or Mixed zones from the sidebar."
                        setCurrentTopic('canvas')
                    } else if (lowerInput.includes('admin') || lowerInput.includes('role')) {
                        response = systemKnowledge['users']?.[2] || "Roles include User, Admin, Super Admin, and Advertiser."
                        setCurrentTopic('users')
                    }
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
                                    <div className="flex items-center gap-3">
                                        {tips[step].icon}
                                        <h3 className="font-black text-lg leading-tight tracking-tight text-foreground">{tips[step].title}</h3>
                                    </div>
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
