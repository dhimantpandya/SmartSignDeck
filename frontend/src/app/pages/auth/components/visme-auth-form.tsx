import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

declare global {
    interface Window {
        vismeFormsLoad?: () => void
    }
}

export function VismeAuthForm() {
    const mounted = useRef(false)
    const location = useLocation()
    const isSignIn = location.pathname.includes('sign-in')

    useEffect(() => {
        if (mounted.current) return
        mounted.current = true

        if (!document.querySelector('[data-visme-script]')) {
            const script = document.createElement('script')
            script.src = 'https://static-bundles.visme.co/forms/vismeforms-embed.js'
            script.async = true
            script.setAttribute('data-visme-script', 'true')
            document.body.appendChild(script)
        } else {
            window.vismeFormsLoad?.()
        }
    }, [])

    return (
        <div className="relative w-full min-h-screen flex flex-col">
            {/* Hide "Powered by Visme" branding */}
            <style>{`
                .formPlayer__footer,
                .visme-powered-by,
                [class*="powered-by"],
                [class*="visme-brand"],
                a[href*="visme.co"][target="_blank"] {
                    display: none !important;
                    height: 0 !important;
                    overflow: hidden !important;
                }
            `}</style>

            {/* Visme Form */}
            <div className="flex-1">
                <div
                    className="visme_d w-full"
                    data-title="Mailing List Sign Up Form"
                    data-url="8kveq49k-mailing-list-sign-up-form?fullPage=true"
                    data-domain="forms"
                    data-full-page="true"
                    data-min-height="100vh"
                    data-form-id="167782"
                />
            </div>

            {/* Sign In / Sign Up Toggle Link */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/70 backdrop-blur-xl px-6 py-3 text-sm font-semibold text-white shadow-2xl">
                    {isSignIn ? (
                        <>
                            <span className="text-white/60">Don't have an account?</span>
                            <Link
                                to="/sign-up"
                                className="text-white underline-offset-4 hover:underline transition-all font-black uppercase tracking-widest"
                            >
                                Sign Up →
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className="text-white/60">Already have an account?</span>
                            <Link
                                to="/sign-in"
                                className="text-white underline-offset-4 hover:underline transition-all font-black uppercase tracking-widest"
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
