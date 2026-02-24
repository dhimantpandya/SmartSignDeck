import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import { IconArrowLeft, IconCircleCheck, IconShieldLock, IconTerminal2, IconWorldUpload } from '@tabler/icons-react'
import { motion } from 'framer-motion'

export default function DirectManagementPage() {
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

    const features = [
        {
            title: 'Real-Time Telemetry',
            description: 'Monitor every pixel on every screen with sub-second latency reporting.',
            icon: <IconTerminal2 size={32} />
        },
        {
            title: 'Remote Diagnostics',
            description: 'Instantly diagnose and resolve hardware issues without leaving your desk.',
            icon: <IconShieldLock size={32} />
        },
        {
            title: 'Global Push Sync',
            description: 'Deploy updates across thousands of screens globally in milliseconds.',
            icon: <IconWorldUpload size={32} />
        },
        {
            title: 'Enterprise Governance',
            description: 'Granular role-based access control for complex organizational structures.',
            icon: <IconCircleCheck size={32} />
        }
    ]

    return (
        <div className='min-h-screen bg-background text-foreground selection:bg-[#020817] selection:text-white font-sans overflow-x-hidden'>
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

                    <div className='hidden md:flex items-center gap-8'>
                        {[
                            { name: 'Features', hash: '#features' },
                            { name: 'Solutions', hash: '#features' },
                            { name: 'Contact', hash: '#contact' }
                        ].map((item) => (
                            <motion.button
                                key={item.name}
                                onClick={() => navigate(Routes.LANDING + item.hash)}
                                whileHover={{ scale: 1.1, color: '#020817' }}
                                className='text-sm font-black uppercase tracking-widest text-primary hover:text-[#020817] transition-all duration-300'
                            >
                                {item.name}
                            </motion.button>
                        ))}
                    </div>

                    <div className='flex items-center gap-4'>
                        <Button variant='ghost' onClick={() => navigate(Routes.SIGN_IN)} className='font-bold uppercase tracking-widest text-xs h-10 px-6'>
                            Login
                        </Button>
                        <Button onClick={() => navigate(Routes.SIGN_UP)} className='font-bold uppercase tracking-widest text-xs h-10 px-6'>
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>

            <main className='pt-32 pb-20'>
                <div className='container mx-auto px-6 max-w-6xl'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='space-y-16 text-center mb-24'
                    >
                        <div className='space-y-6'>
                            <h1 className='text-5xl md:text-8xl font-black tracking-tighter uppercase italic perspective-1000'>
                                Direct <span className='text-[#020817]'>Management.</span>
                            </h1>
                            <p className='text-xl text-muted-foreground/80 max-w-3xl mx-auto font-bold leading-relaxed'>
                                Experience the power of absolute control. Our Direct Management suite allows you to orchestrate your entire digital ecosystem from a single, unified command center.
                            </p>
                        </div>
                    </motion.div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-24'>
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className='p-12 rounded-[3.5rem] bg-primary/5 border border-white/5 space-y-6 hover:bg-primary/10 transition-colors'
                            >
                                <div className='bg-[#020817]/20 w-20 h-20 rounded-2xl flex items-center justify-center text-[#020817]'>
                                    {f.icon}
                                </div>
                                <h3 className='text-3xl font-black uppercase italic'>{f.title}</h3>
                                <p className='text-muted-foreground text-lg leading-relaxed font-medium'>
                                    {f.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className='relative rounded-[4rem] overflow-hidden border border-white/5 mb-24 aspect-[21/9]'>
                        <img
                            src='https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200'
                            className='w-full h-full object-cover grayscale brightness-50'
                            alt='Control Center'
                        />
                        <div className='absolute inset-0 flex items-center justify-center bg-[#020817]/20 backdrop-blur-sm'>
                            <div className='text-center space-y-6 p-8'>
                                <h2 className='text-4xl md:text-6xl font-black uppercase italic text-white'>Unmatched Performance</h2>
                                <p className='text-white/80 max-w-xl mx-auto font-bold'>
                                    Built on a cloud-native architecture that scales infinitely while maintaining sub-millisecond responsiveness.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='text-center'>
                        <Button
                            variant='ghost'
                            onClick={() => navigate(Routes.LANDING)}
                            className='gap-2 font-black uppercase tracking-widest hover:text-[#020817]'
                        >
                            <IconArrowLeft size={20} /> Back to Home
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
