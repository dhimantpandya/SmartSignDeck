import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export function VismeAuthForm() {
    const location = useLocation()
    const isSignIn = location.pathname.includes('sign-in')

    return (
        <div className="relative w-full min-h-screen flex flex-col bg-[#020817]">
            {/* Visme Form via iframe - most reliable method in React SPAs */}
            <iframe
                src="https://forms.visme.co/formsPlayer/8kveq49k-mailing-list-sign-up-form"
                style={{ width: '100%', height: '100vh', border: 'none', flex: 1 }}
                title={isSignIn ? 'Sign In' : 'Sign Up'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            />

            {/* Sign In / Sign Up Toggle Link - floating pill */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/70 backdrop-blur-xl px-6 py-3 text-sm font-semibold text-white shadow-2xl">
                    {isSignIn ? (
                        <>
                            <span className="text-white/60">Don't have an account?</span>
                            <Link
                                to="/sign-up"
                                className="text-white hover:text-primary transition-colors font-black uppercase tracking-widest text-xs"
                            >
                                Sign Up →
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-white/60">Already have an account?</span>
                            <Link
                                to="/sign-in"
                                className="text-white hover:text-primary transition-colors font-black uppercase tracking-widest text-xs"
                            >
                                Sign In →
                            </Link>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
