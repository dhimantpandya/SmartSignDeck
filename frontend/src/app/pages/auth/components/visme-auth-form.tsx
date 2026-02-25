import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

declare global {
    interface Window {
        vismeFormsLoad?: () => void
    }
}

export function VismeAuthForm() {
    const location = useLocation()
    const isSignIn = location.pathname.includes('sign-in')
    const scriptInjected = useRef(false)

    useEffect(() => {
        if (scriptInjected.current) return
        scriptInjected.current = true

        // Small delay ensures React has rendered the .visme_d div into the DOM
        // before Visme's script scans for it
        const timer = setTimeout(() => {
            // Remove any old instance to avoid duplicates on re-navigation
            const existing = document.querySelector('[data-visme-embed-script]')
            if (existing) existing.remove()

            const script = document.createElement('script')
            script.src = 'https://static-bundles.visme.co/forms/vismeforms-embed.js'
            script.async = true
            script.setAttribute('data-visme-embed-script', 'true')
            document.body.appendChild(script)
        }, 50)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="relative w-full min-h-screen bg-[#020817] overflow-hidden">

            {/* ── Visme embed ── */}
            <div
                className="visme_d w-full"
                data-title="Mailing List Sign Up Form"
                data-url="8kveq49k-mailing-list-sign-up-form?fullPage=true"
                data-domain="forms"
                data-full-page="true"
                data-min-height="100vh"
                data-form-id="167782"
            />

            {/*
             * Cover "Powered by Visme Forms" bar:
             * It always renders at the bottom of the Visme container.
             * We position a bar on top of it that matches the background and
             * shows the Sign In / Sign Up link instead.
             */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}  // Wait for Visme to fully paint
                className="fixed bottom-0 left-0 w-full z-[9999] flex items-center justify-center gap-4 bg-[#020817] px-6 py-3 text-sm"
                style={{ minHeight: '40px' }}
            >
                <span className="text-white/50 font-medium">
                    {isSignIn ? "Don't have an account?" : "Already have an account?"}
                </span>
                <Link
                    to={isSignIn ? '/sign-up' : '/sign-in'}
                    className="font-black uppercase tracking-widest text-xs text-white hover:text-primary transition-colors"
                >
                    {isSignIn ? 'Sign Up →' : 'Sign In →'}
                </Link>
            </motion.div>

        </div>
    )
}
