import { IconBrandLinkedin, IconMail } from '@tabler/icons-react'

export default function Footer() {
    return (
        <footer className='w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='container mx-auto px-4 py-8 md:py-12'>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5'>
                    {/* Brand */}
                    <div className='space-y-4 lg:col-span-2'>
                        <h2 className='text-3xl font-black tracking-tighter text-primary italic uppercase'>SmartSign<span className='text-foreground'>Deck</span></h2>
                        <p className='text-sm text-muted-foreground leading-relaxed max-w-sm'>
                            Intelligent Ad Scheduling & Display Platform. Empowering your digital presence with smart solutions. Built for performance, designed for ease.
                        </p>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className='mb-4 text-xs font-black uppercase tracking-[0.2em] text-foreground'>Services</h3>
                        <ul className='space-y-3 text-sm text-muted-foreground font-medium'>
                            <li><a href='#' className='transition-colors hover:text-primary'>Ad Scheduling</a></li>
                            <li><a href='#' className='transition-colors hover:text-primary'>Screen Management</a></li>
                            <li><a href='#' className='transition-colors hover:text-primary'>Analytics</a></li>
                            <li><a href='#' className='transition-colors hover:text-primary'>Template Implementation</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className='mb-4 text-xs font-black uppercase tracking-[0.2em] text-foreground'>Company</h3>
                        <ul className='space-y-3 text-sm text-muted-foreground font-medium'>
                            <li>
                                <button
                                    onClick={() => alert("About Us:\nSmartSignDeck is an innovative digital signage project developed during a professional internship. Focused on bridging the gap between complex scheduling needs and intuitive user interfaces, we aim to provide a high-performance, accessible platform for businesses.")}
                                    className='transition-colors hover:text-primary text-left'
                                >
                                    About Us
                                </button>
                            </li>
                            <li><a href='mailto:smartsigndeckk@gmail.com' className='transition-colors hover:text-primary'>Contact</a></li>
                            <li><a href='#' className='transition-colors hover:text-primary'>Privacy Policy</a></li>
                            <li><a href='#' className='transition-colors hover:text-primary'>Terms of Service</a></li>
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
                        <div className='space-y-3'>
                            <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Newsletter</p>
                            <div className='flex items-center gap-2'>
                                <input
                                    type='email'
                                    placeholder='Enter your email'
                                    className='h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                                />
                                <button className='inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg hover:bg-primary/90 transition-all'>
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-border/40 pt-8'>
                    <p className='text-xs font-bold text-muted-foreground/50 uppercase tracking-widest'>
                        &copy; 2026 SmartSignDeck. All rights reserved.
                    </p>
                    <div className='flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30'>
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Direct Management</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
