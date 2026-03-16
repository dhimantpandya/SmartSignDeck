import { Link } from 'react-router-dom'
import { Routes } from '@/utilities/routes'
import { IconBrandLinkedin, IconMail } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface FooterProps {
    className?: string
}

export default function Footer({ className }: FooterProps) {
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
        <footer className={cn('w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
            <div className='container mx-auto px-4 py-8 md:py-12'>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5'>
                    {/* Brand */}
                    <div className='space-y-4 lg:col-span-2'>
                        <div className='flex items-center gap-2'>
                            <BrandLogo className='text-primary h-8 w-8' />
                            <h2 className='text-3xl font-black tracking-tighter text-primary italic uppercase'>SmartSign<span className='text-foreground'>Deck</span></h2>
                        </div>
                        <p className='text-sm text-muted-foreground leading-relaxed max-w-sm'>
                            Intelligent Ad Scheduling & Display Platform. Empowering your digital presence with smart solutions. Built for performance, designed for ease.
                        </p>
                    </div>

                    <div>
                        <h3 className='mb-4 text-xs font-black uppercase tracking-[0.2em] text-foreground'>Services</h3>
                        <ul className='space-y-3 text-sm text-muted-foreground font-medium'>
                            <li><span>Ad Scheduling</span></li>
                            <li><span>Screen Management</span></li>
                            <li><span>Analytics</span></li>
                            <li><span>Template Implementation</span></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className='mb-4 text-xs font-black uppercase tracking-[0.2em] text-foreground'>Company</h3>
                        <ul className='space-y-3 text-sm text-muted-foreground font-medium'>
                            <li>
                                <Link
                                    to={Routes.ABOUT_US}
                                    className='transition-colors hover:text-primary'
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={Routes.CONTACT_US}
                                    className='transition-colors hover:text-primary'
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={Routes.PRIVACY_POLICY}
                                    className='transition-colors hover:text-primary'
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={Routes.TERMS_OF_SERVICE}
                                    className='transition-colors hover:text-primary'
                                >
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Follow Us / Action */}
                    <div>
                        <h3 className='mb-4 text-xs font-black uppercase tracking-[0.2em] text-foreground'>Follow Us</h3>
                        <div className='flex space-x-4 mb-6'>
                            <a
                                href='https://linkedin.com/in/dhimant-pandya-083b4b271'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground transition-all hover:scale-110 hover:text-primary'
                            >
                                <IconBrandLinkedin className='h-8 w-8' />
                                <span className='sr-only'>LinkedIn</span>
                            </a>
                            <a
                                href='mailto:smartsigndeckk@gmail.com'
                                className='text-muted-foreground transition-all hover:scale-110 hover:text-primary'
                            >
                                <IconMail className='h-8 w-8' />
                                <span className='sr-only'>Email Us</span>
                            </a>
                        </div>
                        <div className='bg-primary/5 p-6 rounded-2xl border border-white/5'>
                            <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4'>Enterprise Power</p>
                            <p className='text-[10px] text-muted-foreground/60 leading-relaxed font-medium'>
                                Unleash the potential of your digital network with our state-of-the-art orchestration engine.
                            </p>
                        </div>
                    </div>
                </div>

                <div className='mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/40 pt-8'>
                    <p className='text-xs font-bold text-muted-foreground/50 uppercase tracking-widest'>
                        &copy; 2026 SmartSignDeck. All rights reserved.
                    </p>
                    <div className='flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30'>
                        <Link to={Routes.PRIVACY_POLICY} className="hover:text-primary transition-colors">Privacy Policy</Link>
                        <Link to={Routes.TERMS_OF_SERVICE} className="hover:text-primary transition-colors">Terms of Service</Link>
                        <Link to={Routes.DIRECT_MANAGEMENT} className="hover:text-primary transition-colors">Direct Management</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
