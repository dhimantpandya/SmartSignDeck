import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import { IconArrowLeft, IconBrandLinkedin, IconMail, IconArrowRight } from '@tabler/icons-react'
import { motion } from 'framer-motion'

export default function ContactUsPage() {
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='space-y-16 text-center'
                >
                    <div className='space-y-6'>
                        <h1 className='text-5xl md:text-8xl font-black tracking-tighter uppercase italic perspective-1000'>
                            Get In <span className='text-[#020817]'>Touch.</span>
                        </h1>
                        <p className='text-xl text-muted-foreground/80 max-w-2xl mx-auto font-bold leading-relaxed'>
                            Whether you're looking for support, partnership opportunities, or just want to talk tech, we're here to listen.
                        </p>
                    </div>

                    <div className='grid md:grid-cols-2 gap-8'>
                        <a
                            href='mailto:smartsigndeckk@gmail.com'
                            className='group p-12 rounded-[3rem] bg-primary/5 border border-white/5 hover:bg-primary/10 hover:border-[#020817]/30 transition-all duration-500'
                        >
                            <div className='bg-[#020817]/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform'>
                                <IconMail size={40} className='text-[#020817]' />
                            </div>
                            <h2 className='text-3xl font-black uppercase italic mb-4'>Email Us</h2>
                            <p className='text-muted-foreground font-medium mb-6'>smartsigndeckk@gmail.com</p>
                            <span className='inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#020817] group-hover:gap-4 transition-all'>
                                Open Inbox <IconArrowRight size={16} />
                            </span>
                        </a>

                        <a
                            href='https://linkedin.com/in/dhimant-pandya-083b4b271'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='group p-12 rounded-[3rem] bg-primary/5 border border-white/5 hover:bg-primary/10 hover:border-[#020817]/30 transition-all duration-500'
                        >
                            <div className='bg-[#020817]/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform'>
                                <IconBrandLinkedin size={40} className='text-[#020817]' />
                            </div>
                            <h2 className='text-3xl font-black uppercase italic mb-4'>LinkedIn</h2>
                            <p className='text-muted-foreground font-medium mb-6'>Dhimant Pandya</p>
                            <span className='inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#020817] group-hover:gap-4 transition-all'>
                                View Profile <IconArrowRight size={16} />
                            </span>
                        </a>
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
