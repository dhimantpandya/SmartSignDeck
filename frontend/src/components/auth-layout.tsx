import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Footer from './footer'
import { AnimatedAuthBg } from '@/app/pages/auth/components/animated-auth-bg'

export default function AuthLayout() {
    const location = useLocation()

    return (
        <div className='relative flex min-h-svh flex-col overflow-hidden bg-[#020817]'>
            <AnimatedAuthBg />

            {/* Main Content Area - Transitions handled by AuthShell layoutId */}
            <main className='relative z-10 flex flex-1 flex-col items-center justify-center p-4 lg:p-8'>
                <Outlet />
            </main>

            {/* Footer at the bottom */}
            <Footer className="relative z-10" />
        </div>
    )
}
