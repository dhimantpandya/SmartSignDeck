import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import { IconArrowLeft } from '@tabler/icons-react'
import { motion } from 'framer-motion'

export default function TermsOfServicePage() {
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
                        <h1 className='text-5xl md:text-7xl font-black tracking-tighter uppercase italic'>
                            Terms Of <span className='text-[#020817]'>Service.</span>
                        </h1>
                        <p className='text-muted-foreground/80 font-bold'>Last Updated: February 24, 2026</p>
                    </div>

                    <div className='prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed'>
                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the SmartSignDeck platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>2. Description of Service</h2>
                            <p>
                                SmartSignDeck provides an intelligent ad scheduling and display platform. We reserve the right to modify or discontinue the service at any time without notice.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>3. User Obligations</h2>
                            <p>
                                You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to use the platform in compliance with all applicable laws and regulations.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>4. Intellectual Property</h2>
                            <p>
                                All content and materials on the SmartSignDeck platform, including logo, designs, and software, are the property of SmartSignDeck and are protected by intellectual property laws.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>5. Limitation of Liability</h2>
                            <p>
                                SmartSignDeck shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
                            </p>
                        </section>
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
