import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import { IconArrowLeft, IconSparkles, IconUsers, IconWorld } from '@tabler/icons-react'
import { motion } from 'framer-motion'

export default function AboutUsPage() {
    const navigate = useNavigate()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

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

    return (
        <div className='min-h-screen bg-background text-foreground selection:bg-[#020817] selection:text-white font-sans overflow-x-hidden'>
            {/* Simple Nav */}
            <nav className='fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-xl py-4 border-b border-white/5'>
                <div className='container mx-auto px-6 flex items-center justify-between'>
                    <div
                        className='flex items-center gap-2 group cursor-pointer'
                        onClick={() => navigate(Routes.LANDING)}
                    >
                        <div className='bg-[#020817]/20 p-2 rounded-xl group-hover:scale-110 transition-transform'>
                            <BrandLogo className='text-[#020817] h-6 w-6' />
                        </div>
                        <span className='text-xl font-black tracking-tighter uppercase italic'>
                            SmartSign<span className='text-[#020817]'>Deck</span>
                        </span>
                    </div>
                </div>
            </nav>

            <main className='pt-32 pb-20 container mx-auto px-6 max-w-4xl'>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='space-y-12'
                >
                    <div className='space-y-6'>
                        <h1 className='text-5xl md:text-7xl font-black tracking-tighter uppercase italic perspective-1000'>
                            About <span className='text-[#020817]'>SmartSignDeck.</span>
                        </h1>
                        <p className='text-xl text-muted-foreground/80 leading-relaxed font-bold'>
                            Bridging the Gap Between Complex Scheduling and Intuitive Design.
                        </p>
                    </div>

                    <div className='grid md:grid-cols-2 gap-12 pt-10'>
                        <div className='space-y-6'>
                            <h2 className='text-2xl font-black uppercase tracking-tight flex items-center gap-3'>
                                <IconSparkles className='text-[#020817]' /> The Vision
                            </h2>
                            <p className='text-muted-foreground leading-relaxed'>
                                SmartSignDeck began as a vision to simplify the digital signage landscape. Developed as a professional internship project, it focuses on high-performance ad scheduling and real-time synchronization across global screen networks.
                            </p>
                        </div>
                        <div className='space-y-6'>
                            <h2 className='text-2xl font-black uppercase tracking-tight flex items-center gap-3'>
                                <IconUsers className='text-[#020817]' /> Driven by Growth
                            </h2>
                            <p className='text-muted-foreground leading-relaxed'>
                                Our mission is to empower businesses with "Unified Broadcast Command"—a system that scales effortlessly from a single display to thousands, all while maintaining absolute brand integrity.
                            </p>
                        </div>
                    </div>

                    <div className='bg-primary/5 rounded-[3rem] p-10 md:p-16 border border-white/5 space-y-8'>
                        <h2 className='text-3xl font-black uppercase italic'>Built with Precision</h2>
                        <p className='text-lg leading-relaxed text-muted-foreground'>
                            Utilizing state-of-the-art technologies including React, Fabric.js for template orchestration, and a robust Node.js backend, SmartSignDeck ensures millisecond-level sync and enterprise-grade reliability.
                        </p>
                        <div className='flex items-center gap-4 text-[#020817] font-black uppercase tracking-widest text-sm'>
                            <IconWorld /> GLOBAL SCALABILITY <span className='text-white/20'>|</span> REAL-TIME SYNC
                        </div>
                    </div>

                    <Button
                        variant='ghost'
                        onClick={() => navigate(Routes.LANDING)}
                        className='gap-2 font-black uppercase tracking-widest hover:text-[#020817]'
                    >
                        <IconArrowLeft size={20} /> Back to Home
                    </Button>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}
