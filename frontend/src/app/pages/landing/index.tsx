import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/custom/button'
import { Routes } from '@/utilities/routes'
import {
    IconDeviceTv,
    IconSparkles,
    IconChartBar,
    IconLayout,
    IconArrowRight,
    IconUsers,
    IconMessageCircle,
    IconWorld,
    IconBrandLinkedin
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

export default function LandingPage() {
    const navigate = useNavigate()
    const [isScrolled, setIsScrolled] = useState(false)

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
            title: 'Effortless Creation',
            description: 'Design stunning layouts in minutes with our intuitive drag-and-drop editor.',
            icon: <IconSparkles className="text-primary" />
        },
        {
            title: 'Real-time Sync',
            description: 'Collaborate with your team instantly. Changes reflect on screens in milliseconds.',
            icon: <IconWorld className="text-primary" />
        },
        {
            title: 'Advanced Analytics',
            description: 'Track impressions, playtime, and engagement with deep insights.',
            icon: <IconChartBar className="text-primary" />
        },
        {
            title: 'Global Distribution',
            description: 'Scale from one screen to thousands across the globe with ease.',
            icon: <IconDeviceTv className="text-primary" />
        }
    ]

    return (
        <div className='min-h-screen bg-background text-foreground selection:bg-primary selection:text-white font-sans overflow-x-hidden'>
            {/* Navigation */}
            <nav className={cn(
                'fixed top-0 w-full z-[100] transition-all duration-500 border-b border-white/5',
                isScrolled ? 'bg-background/80 backdrop-blur-xl py-4 shadow-2xl' : 'bg-transparent py-6'
            )}>
                <div className='container mx-auto px-6 flex items-center justify-between'>
                    <div className='flex items-center gap-2 group cursor-pointer' onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className='bg-primary/20 p-2 rounded-xl group-hover:scale-110 transition-transform'>
                            <IconDeviceTv className='text-primary h-6 w-6' />
                        </div>
                        <span className='text-xl font-black tracking-tighter uppercase italic'>
                            SmartSign<span className='text-primary'>Deck</span>
                        </span>
                    </div>

                    <div className='hidden md:flex items-center gap-8'>
                        <a href="#features" className='text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors'>Features</a>
                        <a href="#solutions" className='text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors'>Solutions</a>
                        <a href="#contact" className='text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors'>Contact</a>
                    </div>

                    <div className='flex items-center gap-4'>
                        <Button variant='ghost' onClick={() => navigate(Routes.SIGN_IN)} className='font-bold uppercase tracking-widest text-xs h-10 px-6'>
                            Login
                        </Button>
                        <Button onClick={() => navigate(Routes.SIGN_UP)} className='font-bold uppercase tracking-widest text-xs h-10 px-6 shadow-[0_0_30px_-5px_hsl(var(--primary))] hover:shadow-[0_0_50px_-5px_hsl(var(--primary))] transition-all'>
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className='relative h-screen flex items-center justify-center overflow-hidden'>
                {/* Video Background */}
                <div className='absolute inset-0 z-0'>
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='w-full h-full object-cover opacity-70 scale-105'
                    >
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-loop-9710-large.mp4" type="video/mp4" />
                    </video>
                    <div className='absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background z-10' />
                </div>

                <div className='container mx-auto px-6 relative z-20 text-center space-y-8 max-w-5xl'>


                    <h1 className='text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic'>
                        Your Message, <br />
                        <span className='text-primary drop-shadow-[0_0_20px_hsla(var(--primary),0.3)]'>Across Every Screen.</span>
                    </h1>

                    <p className='text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-medium leading-relaxed'>
                        Smart and powerful digital signage that lets you focus on what’s important — your message. Cloud-based management for a digital world.
                    </p>

                    <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-10'>
                        <Button size='lg' onClick={() => navigate(Routes.SIGN_UP)} className='h-16 px-10 rounded-2xl text-md font-black uppercase tracking-widest gap-3 w-full sm:w-auto shadow-2xl'>
                            Try for Free <IconArrowRight size={20} />
                        </Button>
                        <Button
                            variant='outline'
                            size='lg'
                            className='h-16 px-10 rounded-2xl text-md font-black uppercase tracking-widest w-full sm:w-auto bg-background/50 backdrop-blur-xl border-white/10'
                            onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Explore Solutions
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className='relative py-32 overflow-hidden'>
                {/* Background Video for Features */}
                <div className='absolute inset-0 z-0'>
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className='w-full h-full object-cover opacity-30 grayscale brightness-50'
                    >
                        <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-11005-large.mp4" type="video/mp4" />
                    </video>
                    <div className='absolute inset-0 bg-background/80 backdrop-blur-3xl z-10' />
                </div>

                <div className='container mx-auto px-6 relative z-20'>
                    <div className='text-center space-y-4 mb-20'>
                        <h2 className='text-3xl md:text-5xl font-black tracking-tighter uppercase italic'>Powerful Features</h2>
                        <div className='h-1.5 w-24 bg-primary mx-auto rounded-full' />
                        <p className='text-muted-foreground/80 max-w-xl mx-auto text-lg'>Experience the next generation of content management.</p>
                    </div>

                    <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
                        {features.map((f, i) => (
                            <div key={i} className='p-8 rounded-[2rem] bg-background/40 backdrop-blur-xl border border-white/10 hover:bg-primary/5 hover:border-primary/20 transition-all duration-500 group shadow-2xl'>
                                <div className='bg-primary/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform'>
                                    {f.icon}
                                </div>
                                <h3 className='text-xl font-bold mb-4 uppercase tracking-tight text-foreground'>{f.title}</h3>
                                <p className='text-muted-foreground/90 leading-relaxed font-medium'>{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Solutions Section */}
            <section id="solutions" className='relative py-32 overflow-hidden border-y border-white/5'>
                {/* Background Image for Solutions */}
                <div className='absolute inset-0 z-0'>
                    <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
                        alt="Corporate Background"
                        className='w-full h-full object-cover opacity-20 filter grayscale contrast-125'
                    />
                    <div className='absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent z-10' />
                </div>

                <div className='container mx-auto px-6 relative z-20'>
                    <div className='flex flex-col lg:flex-row items-center gap-20'>
                        <div className='lg:w-1/2 space-y-8'>
                            <h2 className='text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-tight'>
                                Solutions for Every <br /> <span className='text-primary drop-shadow-2xl'>Industry.</span>
                            </h2>
                            <p className='text-xl text-muted-foreground/90 leading-relaxed font-medium'>
                                SmartSignDeck is versatile and scales perfectly to fit any professional environment, ensuring your message is heard.
                            </p>

                            <div className='grid grid-cols-2 gap-4'>
                                {industries.map((ind, i) => (
                                    <div key={i} className='flex items-center gap-3 p-4 bg-background/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl hover:border-primary/30 transition-all group'>
                                        <div className='text-primary group-hover:scale-110 transition-transform'>{ind.icon}</div>
                                        <span className='font-bold text-sm uppercase tracking-wider'>{ind.name}</span>
                                    </div>
                                ))}
                            </div>

                            <Button variant='link' className='gap-2 text-primary font-bold p-0 text-lg uppercase tracking-tighter hover:gap-4 transition-all'>
                                Explore all industries <IconArrowRight size={18} />
                            </Button>
                        </div>

                        <div className='lg:w-1/2 relative'>
                            <div className='absolute -inset-10 bg-primary/20 blur-[100px] rounded-full' />
                            <div className='relative rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-1000 group'>
                                <img
                                    src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=1000"
                                    alt="Dashboard Preview"
                                    className='w-full grayscale group-hover:grayscale-0 transition-all duration-1000'
                                />
                                <div className='absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors' />
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* CTA Section */}
            <section id="contact" className='py-32 overflow-hidden relative'>
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-primary/5 -rotate-3 z-0' />
                <div className='container mx-auto px-6 relative z-10'>
                    <div className='bg-primary/95 text-white rounded-[2.5rem] p-12 md:p-20 text-center space-y-10 shadow-[0_50px_100px_-20px_hsla(var(--primary),0.5)]'>
                        <h2 className='text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none'>
                            Ready to transform <br /> your communication?
                        </h2>
                        <p className='text-xl text-white/80 max-w-2xl mx-auto font-medium'>
                            Join thousands of businesses using SmartSignDeck to power their visual displays. Start your 14-day free trial today.
                        </p>
                        <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>
                            <Button size='lg' onClick={() => navigate(Routes.SIGN_UP)} className='bg-white text-black hover:bg-white/90 h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-md w-full sm:w-auto'>
                                Start Free Trial
                            </Button>
                            <Button size='lg' variant='outline' className='h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-md bg-transparent border-white/40 hover:bg-white/10 w-full sm:w-auto'>
                                Contact Sales
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className='py-20 bg-background border-t border-white/5'>
                <div className='container mx-auto px-6'>
                    <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12'>
                        <div className='col-span-2 space-y-6'>
                            <div className='flex items-center gap-2'>
                                <IconDeviceTv className='text-primary h-8 w-8' />
                                <span className='text-2xl font-black tracking-tighter uppercase italic'>SmartSign<span className='text-primary'>Deck</span></span>
                            </div>
                            <p className='text-muted-foreground/60 max-w-xs leading-relaxed'>
                                The industry standard for cloud-based digital signage management. Built for performance, designed for ease.
                            </p>
                        </div>

                        <div className='space-y-4'>
                            <h4 className='font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground'>Product</h4>
                            <ul className='space-y-2 text-sm text-muted-foreground/80'>
                                <li className='hover:text-primary cursor-pointer'>Features</li>
                                <li className='hover:text-primary cursor-pointer'>Integrations</li>
                                <li className='hover:text-primary cursor-pointer'>Security</li>
                                <li className='hover:text-primary cursor-pointer'>Pricing</li>
                            </ul>
                        </div>

                        <div className='space-y-4'>
                            <h4 className='font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground'>Support</h4>
                            <ul className='space-y-2 text-sm text-muted-foreground/80'>
                                <li className='hover:text-primary cursor-pointer'>Help Center</li>
                                <li className='hover:text-primary cursor-pointer'>API Docs</li>
                                <li className='hover:text-primary cursor-pointer'>Training</li>
                                <li className='hover:text-primary cursor-pointer'>Status</li>
                            </ul>
                        </div>

                        <div className='space-y-4'>
                            <h4 className='font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground'>Company</h4>
                            <ul className='space-y-2 text-sm text-muted-foreground/80'>
                                <li className='hover:text-primary cursor-pointer'>About</li>
                                <li className='hover:text-primary cursor-pointer'>Careers</li>
                                <li className='hover:text-primary cursor-pointer'>Contact</li>
                                <li className='hover:text-primary cursor-pointer'>Legal</li>
                            </ul>
                        </div>

                        <div className='space-y-4'>
                            <h4 className='font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground'>Follow</h4>
                            <div className='flex gap-4'>
                                <a href="https://linkedin.com/in/dhimant-pandya-083b4b271" target="_blank" rel="noopener noreferrer" className='bg-muted p-2 rounded-lg hover:bg-primary/20 cursor-pointer transition-colors'>
                                    <IconBrandLinkedin size={20} className="text-primary" />
                                </a>
                                <div className='bg-muted p-2 rounded-lg hover:bg-primary/20 cursor-pointer transition-colors'><IconWorld size={20} /></div>
                                <div className='bg-muted p-2 rounded-lg hover:bg-primary/20 cursor-pointer transition-colors'><IconMessageCircle size={20} /></div>
                            </div>
                        </div>
                    </div>

                    <div className='mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40'>
                        <span>© 2026 SmartSignDeck. All rights reserved.</span>
                        <div className='flex gap-8'>
                            <span>Privacy Policy</span>
                            <span>Terms of Service</span>
                            <span>Cookie Policy</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
