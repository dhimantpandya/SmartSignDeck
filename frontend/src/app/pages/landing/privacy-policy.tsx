import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/custom/button'
import Footer from '@/components/footer'
import { Routes } from '@/utilities/routes'
import { IconArrowLeft } from '@tabler/icons-react'
import { motion } from 'framer-motion'

export default function PrivacyPolicyPage() {
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
        <div className='min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans overflow-x-hidden'>
            {/* Simple Nav */}
            <nav className='fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-xl py-4 border-b border-white/5'>
                <div className='container mx-auto px-6 flex items-center justify-between'>
                    <div
                        className='flex items-center gap-2 group cursor-pointer'
                        onClick={() => navigate(Routes.LANDING)}
                    >
                        <div className='bg-primary/10 p-2 rounded-xl group-hover:scale-110 transition-transform'>
                            <BrandLogo className='text-primary h-6 w-6' />
                        </div>
                        <span className='text-xl font-black tracking-tighter uppercase italic'>
                            SmartSign<span className='text-primary'>Deck</span>
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
                            Privacy <span className='text-primary'>Policy.</span>
                        </h1>
                        <p className='text-muted-foreground/80 font-bold'>Last Updated: February 24, 2026</p>
                    </div>

                    <div className='prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed'>
                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>1. Information We Collect</h2>
                            <p>
                                We collect information you provide directly to us when you create an account, use our services, or communicate with us. This may include your name, email address, company information, and any other information you choose to provide.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>2. How We Use Your Information</h2>
                            <p>
                                We use the information we collect to provide, maintain, and improve our services, including ad scheduling and display management. We also use your information to communicate with you about updates, security alerts, and support needs.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>3. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>4. Third-Party Services</h2>
                            <p>
                                Our platform may integrate with third-party services. We are not responsible for the privacy practices of these third parties, and we encourage you to review their privacy policies.
                            </p>
                        </section>

                        <section className='space-y-4'>
                            <h2 className='text-2xl font-black uppercase tracking-tight text-foreground italic'>5. Your Rights</h2>
                            <p>
                                You have the right to access, correct, or delete your personal information. If you wish to exercise these rights, please contact us at smartsigndeckk@gmail.com.
                            </p>
                        </section>
                    </div>

                    <Button
                        variant='ghost'
                        onClick={() => navigate(Routes.LANDING)}
                        className='gap-2 font-black uppercase tracking-widest hover:text-primary'
                    >
                        <IconArrowLeft size={20} /> Back to Home
                    </Button>
                </motion.div>
            </main>

            <Footer />
        </div>
    )
}
