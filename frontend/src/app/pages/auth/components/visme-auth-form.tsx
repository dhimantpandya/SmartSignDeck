import { useEffect, useRef } from 'react'

declare global {
    interface Window {
        vismeFormsLoad?: () => void
    }
}

export function VismeAuthForm() {
    const mounted = useRef(false)

    useEffect(() => {
        if (mounted.current) return
        mounted.current = true

        // Inject the Visme embed script once
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
        <div className="relative w-full h-full min-h-screen overflow-hidden">
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

            <div
                className="visme_d w-full h-full"
                data-title="Mailing List Sign Up Form"
                data-url="8kveq49k-mailing-list-sign-up-form?fullPage=true"
                data-domain="forms"
                data-full-page="true"
                data-min-height="100vh"
                data-form-id="167782"
            />
        </div>
    )
}
