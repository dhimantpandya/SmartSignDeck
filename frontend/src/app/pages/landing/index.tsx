import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import {
    IconDeviceTv,
    IconSparkles,
    IconChartBar,
    IconLayout,
    IconArrowRight,
    IconUsers,
    IconWorld
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

export default function LandingPage() {
    const navigate = useNavigate()
    const [isScrolled, setIsScrolled] = useState(false)
    const { scrollYProgress } = useScroll()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    const BrandLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
    )

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const industries = [
        { name: 'Retail', icon: <IconLayout size={24} /> },
        { name: 'Corporate', icon: <IconUsers size={24} /> },
        { name: 'Education', icon: <IconWorld size={24} /> },
        { name: 'Healthcare', icon: <IconSparkles size={24} /> },
        { name: 'Hospitality', icon: <IconDeviceTv size={24} /> },
        { name: 'Manufacturing', icon: <IconChartBar size={24} /> },
    ]

    const features = [
        {
            title: 'Intuitive Flow, Effortless Scale',
            description: 'Design stunning layouts in seconds with our high-performance drag-and-drop orchestration.',
            icon: <IconSparkles className="text-primary" />
        },
        {
            title: 'Unified Broadcast Command',
            description: 'Collaborate with your team instantly. Changes reflect on screens across the globe in milliseconds.',
            icon: <IconWorld className="text-primary" />
        },
        {
            title: 'Absolute Command, Total Control',
            description: 'Experience robust enterprise governance with deep insights and real-time screen management.',
            icon: <IconChartBar className="text-primary" />
        },
        {
            title: 'Built for Tomorrow: Scalable Architecture',
            description: 'Scale from one screen to thousands globally with a system designed for infinite growth.',
            icon: <IconDeviceTv className="text-primary" />
        }
    ]

    const heroVideos = [
        "https://videos.pexels.com/video-files/3205619/3205619-hd_1920_1080_25fps.mp4",
        "/videos/presentation.mp4"
    ]

    const dynamicMessages = useMemo(() => [
        { line1: "Master the Screen,", line2: "Dominate the Message." },
        { line1: "Captivate Hearts,", line2: "Inspire the Crowd." },
        { line1: "Amplify Reach,", line2: "Multiply Impact." },
        { line1: "Command Space,", line2: "Total Presence." },
        { line1: "Empower Vision,", line2: "Drive Growth." }
    ], [])

    const [activeVideo, setActiveVideo] = useState(0)
    const [activeMessage, setActiveMessage] = useState(0)

    useEffect(() => {
        const videoTimer = setInterval(() => {
            setActiveVideo((prev) => (prev + 1) % heroVideos.length)
        }, 6000)

        const messageTimer = setInterval(() => {
            setActiveMessage((prev) => (prev + 1) % dynamicMessages.length)
        }, 6000)

        return () => {
            clearInterval(videoTimer)
            clearInterval(messageTimer)
        }
    }, [dynamicMessages, heroVideos.length])

    // Scroll-linked transforms for Hero
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100])

    return (
        <div className='min-h-screen bg-background text-foreground selection:bg-[#020817] selection:text-white font-sans overflow-x-hidden'>
            <style dangerouslySetInnerHTML={{
                __html: `
                .selection-navy::selection { background-color: #020817; color: white; }
                .selection-navy *::selection { background-color: #020817; color: white; }
            ` }} />
            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-[#020817] z-[200] origin-left shadow-[0_0_10px_rgba(2,8,23,0.3)]"
                style={{ scaleX }}
            />

            {/* Navigation */}
            <nav className={cn(
                'fixed top-0 w-full z-[100] transition-all duration-500 border-b border-white/5',
                isScrolled ? 'bg-background/80 backdrop-blur-xl py-4 shadow-2xl' : 'bg-transparent py-6'
            )}>
                <div className='container mx-auto px-6 flex items-center justify-between'>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className='flex items-center gap-2 group cursor-pointer'
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className='bg-[#020817]/20 p-3 rounded-xl group-hover:scale-110 transition-transform'>
                            <BrandLogo className='text-[#020817] h-6 w-6' />
                        </div>
                        <span className='text-xl font-black tracking-tighter uppercase italic'>
                            SmartSign<span className='text-[#020817]'>Deck</span>
                        </span>
                    </motion.div>

                    <div className='hidden md:flex items-center gap-8'>
                        {['Features', 'Solutions', 'Contact'].map((item) => (
                            <motion.a
                                key={item}
                                href={item === 'Solutions' ? '#features' : `#${item.toLowerCase()}`}
                                whileHover={{ scale: 1.1, color: '#020817' }}
                                className='text-sm font-black uppercase tracking-widest text-primary hover:text-[#020817] transition-all duration-300'
                            >
                                {item}
                            </motion.a>
                        ))}
                    </div>

                    <div className='flex items-center gap-4'>
                        <Button variant='ghost' onClick={() => navigate(Routes.SIGN_IN)} className='font-bold uppercase tracking-widest text-xs h-10 px-6'>
                            Login
                        </Button>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button onClick={() => navigate(Routes.SIGN_UP)} className='font-bold uppercase tracking-widest text-xs h-10 px-6 shadow-[0_0_30px_-5px_hsl(var(--primary))] hover:shadow-[0_0_50px_-5px_hsl(var(--primary))] transition-all'>
                                Get Started
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <motion.section
                style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                className='relative h-screen flex items-center justify-center overflow-hidden'
            >
                {/* Brighter Video Background with Crossfade */}
                <div className='absolute inset-0 z-0 overflow-hidden'>
                    {heroVideos.map((video, idx) => (
                        <motion.video
                            key={video}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{
                                opacity: activeVideo === idx ? 0.9 : 0,
                                scale: activeVideo === idx ? 1 : 1.1
                            }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            src={video}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className='absolute inset-0 w-full h-full object-cover brightness-110 contrast-110'
                        />
                    ))}
                    {/* Lighter Gradient Overlay for brightness */}
                    <div className='absolute inset-0 bg-gradient-to-b from-background/5 via-background/20 to-background z-10' />
                </div>

                <div className='container mx-auto px-6 relative z-20 text-center space-y-8 max-w-5xl'>
                    <motion.h1
                        key={activeMessage}
                        initial={{ opacity: 0, y: 50, rotateX: 45 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, y: -50, rotateX: -45 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className='text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase italic perspective-1000 selection-navy'
                    >
                        <span className='text-[#020817]'>
                            {dynamicMessages[activeMessage].line1}
                        </span>
                        <br />
                        <span className='text-[#020817] drop-shadow-[0_0_20px_rgba(2,8,23,0.2)]'>
                            {dynamicMessages[activeMessage].line2}
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className='text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-bold leading-relaxed'
                    >
                        Experience absolute command over your digital presence. Robust enterprise governance meets intuitive flow with the industry's most scalable cloud infrastructure.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-10'
                    >
                        <Button size='lg' onClick={() => navigate(Routes.SIGN_UP)} className='h-16 px-10 rounded-2xl text-md font-black uppercase tracking-widest gap-3 w-full sm:w-auto shadow-2xl hover:bg-primary/90 transition-all'>
                            Try for Free <IconArrowRight size={20} />
                        </Button>
                        <Button
                            variant='outline'
                            size='lg'
                            className='h-16 px-10 rounded-2xl text-md font-black uppercase tracking-widest w-full sm:w-auto bg-background/50 backdrop-blur-xl border-white/10 hover:border-primary/50 transition-all'
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Explore Solutions
                        </Button>
                    </motion.div>
                </div>
            </motion.section>

            {/* Features Section - Sticky Scrollytelling */}
            <section id="features" className='relative min-h-screen py-32'>
                <div className='sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-0'>
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0.2 }}
                        animate={{ scale: 1, opacity: 0.3 }}
                        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                        src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000"
                        className='w-full h-full object-cover grayscale brightness-50'
                    />
                    <div className='absolute inset-0 bg-background/80 backdrop-blur-3xl' />
                </div>

                <div className='container mx-auto px-6 relative z-10 -mt-[100vh]'>
                    <div className='min-h-screen flex flex-col justify-center items-center'>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: false, amount: 0.5 }}
                            className='text-center space-y-4 mb-20'
                        >
                            <h2 className='text-4xl md:text-7xl font-black tracking-tighter uppercase italic'>Powerful Features</h2>
                            <div className='h-2 w-32 bg-[#020817] mx-auto rounded-full shadow-[0_0_20px_rgba(2,8,23,0.3)]' />
                            <p className='text-muted-foreground/80 max-w-xl mx-auto text-xl'>Experience the next generation of content management.</p>
                        </motion.div>

                        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 100 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    viewport={{ once: false, amount: 0.2 }}
                                    className='p-8 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 hover:bg-primary/5 hover:border-primary/20 transition-all duration-500 group shadow-2xl relative'
                                >
                                    <div className='bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-125 group-hover:rotate-6 transition-transform'>
                                        {f.icon}
                                    </div>
                                    <h3 className='text-2xl font-bold mb-4 uppercase tracking-tight text-foreground'>{f.title}</h3>
                                    <p className='text-muted-foreground/90 leading-relaxed font-medium'>{f.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* Solutions Section - Interactive Scroll */}
            <section id="solutions" className='relative py-32 overflow-hidden border-y border-white/5'>
                <div className='container mx-auto px-6 relative z-20'>
                    <div className='flex flex-col lg:flex-row items-center gap-20'>
                        <motion.div
                            initial={{ opacity: 0, x: -100 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: false, amount: 0.3 }}
                            className='lg:w-1/2 space-y-8'
                        >
                            <h2 className='text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-tight'>
                                Infinite Identity: <br /> Seamless <span className='text-primary drop-shadow-2xl'>Branding.</span>
                            </h2>
                            <p className='text-2xl text-muted-foreground/90 leading-relaxed font-medium'>
                                SmartSignDeck delivers robust enterprise governance perfectly tuned for elite environments.
                            </p>

                            <div className='grid grid-cols-2 gap-4'>
                                {industries.map((ind, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.05, border: '1px solid hsla(var(--primary), 0.5)' }}
                                        className='flex items-center gap-3 p-5 bg-background/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl transition-all group cursor-pointer'
                                    >
                                        <div className='text-primary group-hover:scale-125 transition-transform'>{ind.icon}</div>
                                        <span className='font-bold text-sm uppercase tracking-wider'>{ind.name}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <Button
                                variant='link'
                                onClick={() => navigate(Routes.INDUSTRIES)}
                                className='gap-2 text-primary font-bold p-0 text-xl uppercase tracking-tighter hover:gap-6 transition-all'
                            >
                                Explore all industries <IconArrowRight size={24} />
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, rotate: 10, scale: 0.8 }}
                            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                            transition={{ duration: 1, type: "spring" }}
                            viewport={{ once: false, amount: 0.3 }}
                            className='lg:w-1/2 relative'
                        >
                            <div className='absolute -inset-20 bg-primary/20 blur-[150px] rounded-full animate-pulse' />
                            <div className='relative rounded-[4rem] overflow-hidden border-[12px] border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] group cursor-pointer'>
                                <motion.img
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 1 }}
                                    src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=1200"
                                    alt="Dashboard Preview"
                                    className='w-full grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000'
                                />
                                <div className='absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors' />
                                <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-primary/30 to-transparent' />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* News Section - What's Happening */}
            <section id="news" className='relative py-32 bg-[#020817]/5'>
                <div className='container mx-auto px-6'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className='text-center mb-20 space-y-4'
                    >
                        <h2 className='text-4xl md:text-7xl font-black tracking-tighter uppercase italic'>What's Happening</h2>
                        <div className='h-2 w-32 bg-[#020817] mx-auto rounded-full' />
                        <p className='text-muted-foreground/80 max-w-xl mx-auto text-xl'>Stay updated with the latest from SmartSignDeck.</p>
                    </motion.div>

                    <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
                        {[
                            {
                                title: "Global Network Expansion",
                                date: "Feb 20, 2026",
                                image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=800",
                                desc: "Expanding our edge clusters to 50+ new regions for even lower latency."
                            },
                            {
                                title: "AI Core 2.0 Launch",
                                date: "Feb 15, 2026",
                                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
                                desc: "New neural scheduling algorithms that predict audience trends."
                            },
                            {
                                title: "Enterprise Partner Success",
                                date: "Feb 10, 2026",
                                image: "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&q=80&w=800",
                                desc: "Celebrating our 500th global enterprise partner joining the ecosystem."
                            },
                            {
                                title: "Zero-Carbon Displays",
                                date: "Feb 05, 2026",
                                image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
                                desc: "New energy-saving modes reducing screen consumption by 40%."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className='group flex flex-col space-y-4 cursor-pointer'
                            >
                                <div className='aspect-square overflow-hidden rounded-[2rem] border border-white/5'>
                                    <img
                                        src={item.image}
                                        className='w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-700'
                                        alt={item.title}
                                    />
                                </div>
                                <div className='space-y-2 px-2'>
                                    <p className='text-[10px] font-black uppercase tracking-widest text-[#020817]'>{item.date}</p>
                                    <h3 className='text-xl font-black uppercase italic leading-tight group-hover:text-[#020817] transition-colors'>{item.title}</h3>
                                    <p className='text-sm text-muted-foreground font-medium'>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className='py-48 overflow-hidden relative'>
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-full bg-primary/5 -rotate-2 z-0 origin-center'
                />
                <div className='container mx-auto px-6 relative z-10'>
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className='bg-primary/95 text-white rounded-[4rem] p-16 md:p-32 text-center space-y-12 shadow-[0_50px_150px_-30px_hsla(var(--primary),0.6)] border border-white/10 backdrop-blur-3xl'
                    >
                        <h2 className='text-5xl md:text-9xl font-black tracking-tighter uppercase italic leading-none'>
                            Ready to <br /> <span className='text-white/40'>transform?</span>
                        </h2>
                        <p className='text-2xl text-white/70 max-w-3xl mx-auto font-medium'>
                            Join the elite businesses using SmartSignDeck. Start your 14-day premium trial today and see the difference.
                        </p>
                        <div className='flex flex-col sm:flex-row items-center justify-center gap-8'>
                            <Button size='lg' onClick={() => navigate(Routes.SIGN_UP)} className='bg-white text-black hover:bg-white/90 h-20 px-16 rounded-3xl font-black uppercase tracking-widest text-lg w-full sm:w-auto shadow-2xl'>
                                Start Free Trial
                            </Button>
                            <Button size='lg' variant='outline' onClick={() => navigate(Routes.CONTACT_US)} className='h-20 px-16 rounded-3xl font-black uppercase tracking-widest text-lg bg-transparent border-white/40 hover:bg-white/10 w-full sm:w-auto mt-4 sm:mt-0'>
                                Contact Sales
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Updated Shared Footer */}
            <Footer />
        </div>
    )
}
