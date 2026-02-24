import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import { IconArrowLeft } from '@tabler/icons-react'
import { motion } from 'framer-motion'

export default function IndustriesPage() {
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

    const industries = [
        {
            name: 'Retail',
            image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=800',
            description: 'Dynamic window displays and interactive aisle screens that drive engagement.'
        },
        {
            name: 'Healthcare',
            image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=800',
            description: 'Wayfinding and patient information systems for modern medical facilities.'
        },
        {
            name: 'Corporate',
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            description: 'Internal communications and visitor welcome boards for world-class offices.'
        },
        {
            name: 'Education',
            image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800',
            description: 'Campus-wide alert systems and interactive learning boards.'
        },
        {
            name: 'Hospitality',
            image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
            description: 'Digital concierge and elegant menu boards for luxury stays.'
        },
        {
            name: 'Manufacturing',
            image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
            description: 'Real-time production metrics and safety alerts for smart factories.'
        },
        {
            name: 'Transportation',
            image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
            description: 'Instant schedule updates and traveler information for transit hubs.'
        },
        {
            name: 'Real Estate',
            image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
            description: 'Immersive property tours and neighborhood highlights.'
        },
        {
            name: 'Finance',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
            description: 'Secure market data visualization and branch lobby engagement.'
        },
        {
            name: 'Entertainment',
            image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800',
            description: 'High-impact movie posters and event schedule boards.'
        },
        {
            name: 'Government',
            image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800',
            description: 'Public service announcements and efficient queue management.'
        },
        {
            name: 'Energy',
            image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800',
            description: 'Sustainability metrics and grid status monitoring displays.'
        },
        {
            name: 'Automotive',
            image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800',
            description: 'Sleek showroom displays and service status boards.'
        },
        {
            name: 'Technology',
            image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800',
            description: 'Developer boards and tech-event orchestration.'
        },
        {
            name: 'Sports',
            image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
            description: 'Real-time scoreboards and fan engagement zones.'
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
                <div className='container mx-auto px-6'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='space-y-16 text-center mb-24'
                    >
                        <div className='space-y-6'>
                            <h1 className='text-5xl md:text-8xl font-black tracking-tighter uppercase italic perspective-1000'>
                                Tailored <span className='text-[#020817]'>Industries.</span>
                            </h1>
                            <p className='text-xl text-muted-foreground/80 max-w-3xl mx-auto font-bold leading-relaxed'>
                                Discover how SmartSignDeck empowers diverse sectors with intelligent digital orchestration and stunning visual communication.
                            </p>
                        </div>
                    </motion.div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                        {industries.map((ind, i) => (
                            <motion.div
                                key={ind.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                                viewport={{ once: true }}
                                className='group relative overflow-hidden rounded-[3rem] bg-primary/5 border border-white/5 hover:border-[#020817]/30 transition-all duration-700'
                            >
                                <div className='aspect-video overflow-hidden'>
                                    <img
                                        src={ind.image}
                                        alt={ind.name}
                                        className='w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-1000'
                                    />
                                </div>
                                <div className='p-8 space-y-4'>
                                    <h2 className='text-3xl font-black uppercase italic text-foreground'>{ind.name}</h2>
                                    <p className='text-muted-foreground font-medium leading-relaxed'>{ind.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className='mt-24 text-center'>
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
