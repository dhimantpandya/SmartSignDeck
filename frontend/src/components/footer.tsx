import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandTwitter } from '@tabler/icons-react'

export default function Footer() {
    return (
        <footer className='w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='container mx-auto px-4 py-8 md:py-12'>
                <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
                    {/* Brand */}
                    <div className='space-y-4'>
                        <h2 className='text-2xl font-bold tracking-tight text-primary'>SmartSignDeck</h2>
                        <p className='text-sm text-muted-foreground'>
                            Intelligent Ad Scheduling & Display Platform. Empowering your digital presence with smart solutions.
                        </p>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className='mb-4 text-sm font-semibold uppercase tracking-wider text-foreground'>Services</h3>
                        <ul className='space-y-3 text-sm text-muted-foreground'>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Ad Scheduling</a>
                            </li>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Screen Management</a>
                            </li>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Analytics</a>
                            </li>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Template Implementation</a>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className='mb-4 text-sm font-semibold uppercase tracking-wider text-foreground'>Company</h3>
                        <ul className='space-y-3 text-sm text-muted-foreground'>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>About Us</a>
                            </li>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Contact</a>
                            </li>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Privacy Policy</a>
                            </li>
                            <li>
                                <a href='#' className='transition-colors hover:text-primary'>Terms of Service</a>
                            </li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div>
                        <h3 className='mb-4 text-sm font-semibold uppercase tracking-wider text-foreground'>Follow Us</h3>
                        <div className='flex space-x-4'>
                            <a href='#' className='text-muted-foreground transition-all hover:scale-110 hover:text-primary'>
                                <IconBrandFacebook className='h-6 w-6' />
                                <span className='sr-only'>Facebook</span>
                            </a>
                            <a href='#' className='text-muted-foreground transition-all hover:scale-110 hover:text-primary'>
                                <IconBrandTwitter className='h-6 w-6' />
                                <span className='sr-only'>Twitter</span>
                            </a>
                            <a href='#' className='text-muted-foreground transition-all hover:scale-110 hover:text-primary'>
                                <IconBrandInstagram className='h-6 w-6' />
                                <span className='sr-only'>Instagram</span>
                            </a>
                            <a href='#' className='text-muted-foreground transition-all hover:scale-110 hover:text-primary'>
                                <IconBrandLinkedin className='h-6 w-6' />
                                <span className='sr-only'>LinkedIn</span>
                            </a>
                        </div>
                        <div className='mt-6'>
                            <p className='text-sm text-muted-foreground'>
                                Subscribe to our newsletter for updates.
                            </p>
                            {/* Simple newsletter stub */}
                            <div className='mt-2 flex'>
                                <input type='email' placeholder='Enter your email' className='h-9 w-full rounded-l-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50' />
                                <button className='inline-flex h-9 items-center justify-center whitespace-nowrap rounded-r-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'>
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='mt-12 border-t pt-8'>
                    <p className='text-center text-xs text-muted-foreground'>
                        &copy; {new Date().getFullYear()} SmartSignDeck. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
