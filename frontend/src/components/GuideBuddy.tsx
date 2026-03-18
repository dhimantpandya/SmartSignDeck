import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconX, IconSparkles, IconSend, IconMessageCircle, IconRobot, IconActivity, IconListDetails, IconUsers } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from './nav-notification-provider'

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
    const { isChatOpen } = useNotifications()

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isChatMode) scrollToBottom()
    }, [messages, isChatMode])

    const systemKnowledge: Record<string, string[]> = {
        'templates': [
            'Templates are used to save hours of design time while keeping your branding 100% consistent across all screens.',
            'Why use them? Create a design once, and reuse it forever instead of building from scratch every time.',
            'To create together: Go to Collaboration -> Invite teammate. You both edit the same canvas live with colored labels showing who is moving what!',
            'To create manually: Go to Templates page -> Click "Create Template" -> Select resolution -> Add Text, Media, or Mixed zones from the sidebar.',
            'Templates come in 4 types: My (Private), Shared (Collaboration), Groups (Org-wide), and Global (Public System-wide).'
        ],
        'screens': [
            'Screens are the physical displays where your customers see your content.',
            'Why create them? To remotely manage what is playing on your TVs or monitors from anywhere in the world.',
            'How to create: Go to Screens page -> Click "Add Screen" -> Follow the Setup guide -> Link it to a Template or Playlist.',
            'Online status: Screens check in every 2 minutes. If no check-in for >2 mins, they show as "offline".',
            'Global Screens are public presets; Private Screens are your own custom displays.'
        ],
        'collaboration': [
            'Collaboration lets teams build signage 10x faster by working together in real-time.',
            'How to send friend request: Open Collaboration -> Go to "Find People" -> Search for their email -> Click "Add Friend". You will receive a notification when they accept!',
            'Real-time: You see others typing and moving zones instantly. Zones get locked with a colored label when someone is editing them.',
            'Manage requests: Track all your invites and connections in the "Connections" tab within the Collaboration hub.'
        ],
        'recycle bin': [
            'The Recycle Bin is your safety net; deleted items stay here for 30 days before being purged.',
            'Why use it? To easily undo accidental deletions without losing your hard work.',
            'How to restore: Go to the Recycle Bin -> Select the section (Templates or Screens) -> Click the "Restore" (clockwise arrow) icon on your item.',
            'Strict Privacy: Only YOU can see your recycle bin. Even Admins cannot see what you\'ve deleted!',
            'Restoring Groups: You can restore whole template groups the same way as individual templates!'
        ],
        'sync': [
            'Our hyper-speed sync technology ensures your workspace is always up-to-date across all collaborators.',
            'Wait for the "Syncing Workspace" message when restoring items to ensure data consistency.'
        ],
        'users': [
            'The Users section is for Team Management and Role Assignment.',
            'Total Roles (4): Super Admin (System control), Admin (Team Manager), User (Creator), and Advertiser (Analytics).',
            'Advertisers: Can view-only analytics and export detailed PDF reports for clients.',
            'Wait, why can I see it? Even if you aren\'t an admin, you can see the team overview and your own profile settings. Organization admins use this section to manage roles and permissions.'
        ],
        'analytics': [
            'Analytics helps you measure the impact of your signage with real data.',
            'Why use it? To see which content gets the most "Plays" and ensure your screens have 100% uptime.',
            'Monday Plays: Use the date picker to see exactly how many plays happened last Monday or any other specific day!'
        ],
        'playlists': [
            'Playlists allow you to sequence multiple designs to play automatically throughout the day.',
            'Why create one? To automate your content schedule so you don\'t have to manually change templates.',
            'How to create: Go to Playlists -> Click "Create" -> Drag and drop templates into the timeline -> Set the play duration for each.'
        ],
        'groups': [
            'Groups (Collections) allow you to organize your templates by project, like "Summer Sale" or "Menu Boards".',
            'Why use them? To keep your workspace clean and find related designs instantly instead of searching through a long list.',
            'How to create: Go to Templates -> Click "Create Group" -> Enter name -> Click the "Folder" icon on any template card to add it to your collection.',
            'Group Edit: You can now Preview, Edit, and Delete templates directly from within your group view!'
        ],
        'slider': [
            'The Inspiration Slider shows you premium "Best-in-Class" designs.',
            'Why use it? To jumpstart your creativity! If you like a layout, just click "Capture This Layout" to copy it instantly.'
        ],
        'canvas': [
            'The Canvas Editor is where your designs come to life.',
            'How to build: Drag existing zones to move them. Use the sidebar tools to add new Text, Media, or Mixed zones.'
        ],
        'chat': [
            'Live Chat lets you message teammates instantly while you collaborate.',
            'Messaging is real-time; green dots show who is currently online and active in your team.'
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
            else if (lowerInput.match(/\b(really|oh|wow|cool|okay|ok|thanks|thank you)\b/)) {
                response = `Absolutely! I'm here to make SmartSignDeck easy for you. What else can I explain?`
            }
            else if (lowerInput.match(/\brate\b/)) {
                response = "I think we're making great progress, Dhimant! I'm learning more about the system every second. My goal is to be the ultimate 10/10 expert for you."
            }
            else if (lowerInput.match(/\b(new|help|start|can i do|what to do|use|features|website|how to)\b/)) {
                response = "Welcome! Here's how you can get started: **Basics** (Create Templates, Groups, Screens, Playlists) and **Top Features** (Real-time Collaboration, Slider-Capture, and Deep Analytics). Which would you like to learn about first?"
                setCurrentTopic(null)
            }
            else {
                // Feature Mapping with weighted search
                let matchedKey = null

                // 1. Singular/Plural Expansion Mapping
                const keyMap: Record<string, string> = {
                    'template': 'templates',
                    'screen': 'screens',
                    'playlist': 'playlists',
                    'group': 'groups',
                    'collection': 'groups',
                    'slidebar': 'slider',
                    'collaborate': 'collaboration',
                    'friend': 'collaboration',
                    'people': 'collaboration',
                    'request': 'collaboration',
                    'role': 'users',
                    'admin': 'users',
                    'advertiser': 'users',
                    'trash': 'recycle bin'
                }

                // Apply mapping
                for (const [s, p] of Object.entries(keyMap)) {
                    if (lowerInput.includes(s)) {
                        matchedKey = p
                        break
                    }
                }

                // 2. Action Override (Priority for specific intents)
                if (lowerInput.includes('restore') || lowerInput.includes('deleted')) {
                    matchedKey = 'recycle bin'
                } else if (lowerInput.includes('manual') || (lowerInput.includes('create') && !lowerInput.includes('slider') && !lowerInput.includes('slidebar'))) {
                    // Try to find the specific category they want to create
                    if (lowerInput.includes('group')) matchedKey = 'groups'
                    else if (lowerInput.includes('screen')) matchedKey = 'screens'
                    else if (lowerInput.includes('playlist')) matchedKey = 'playlists'
                    else matchedKey = 'templates'
                }

                // 3. Direct Keyword Match (if no mapping or action override)
                if (!matchedKey) {
                    for (const key of Object.keys(systemKnowledge)) {
                        if (lowerInput.includes(key)) {
                            matchedKey = key
                            break
                        }
                    }
                }

                // 4. Topic Hijacking Prevention (Only follow up if no new keyword detected)
                if (!matchedKey && currentTopic && (lowerInput.match(/\b(means|more|elaborate|use|tell me)\b/))) {
                    matchedKey = currentTopic
                }

                if (matchedKey) {
                    const facts = systemKnowledge[matchedKey]
                    // Precision Indexing
                    if (lowerInput.includes('how') || lowerInput.includes('manual') || lowerInput.includes('steps') || lowerInput.includes('send')) {
                        // All "How" procedural facts are at index 2 or 3 usually
                        if (matchedKey === 'templates') response = facts[3]
                        else if (matchedKey === 'screens') response = facts[2]
                        else if (matchedKey === 'collaboration') response = facts[1]
                        else if (matchedKey === 'recycle bin') response = facts[2]
                        else if (matchedKey === 'playlists') response = facts[2]
                        else if (matchedKey === 'groups') response = facts[2]
                        else response = facts[Math.floor(Math.random() * facts.length)]
                    } else if (lowerInput.includes('why') || lowerInput.includes('purpose') || lowerInput.includes('use of')) {
                        response = facts[1] // Fact 1 is now "Why" for most keys
                    } else if (lowerInput.includes('what is') || lowerInput.includes('what are') || lowerInput.includes('tell me about')) {
                        response = facts[0] // Always give definition for "what is"
                    } else if (matchedKey === 'users' && (lowerInput.includes('role') || lowerInput.includes('admin') || lowerInput.includes('advertiser'))) {
                        if (lowerInput.includes('advertiser')) response = facts[2]
                        else response = facts[1] // The roles list
                    } else {
                        response = facts[Math.floor(Math.random() * facts.length)]
                    }
                    setCurrentTopic(matchedKey)
                } else {
                    // 5. System-wide fallback for common terms
                    if (lowerInput.includes('online') || lowerInput.includes('offline')) {
                        response = systemKnowledge['screens']?.[3] || "Screens check in every 2 minutes. If no ping is received, they show as offline."
                        setCurrentTopic('screens')
                    } else if (lowerInput.includes('zone') || lowerInput.includes('drag')) {
                        response = systemKnowledge['canvas']?.[1] || "Drag zones to reposition them; you can add Text, Media, or Mixed zones from the sidebar."
                        setCurrentTopic('canvas')
                    } else {
                        response = "I'm only trained to help with SmartSignDeck system features. Please ask about Templates, Screens, Collaboration, Analytics, Playlists, Roles, or the Recycle Bin!"
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
        <div className={cn(
            "fixed bottom-8 right-8 flex flex-col items-end gap-4 pointer-events-none transition-all",
            isChatOpen ? "z-[40]" : "z-[100]" // Lower z-index so it sits behind the ChatSidebar (which is z-50+)
        )}>
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
