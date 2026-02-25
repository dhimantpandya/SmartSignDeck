import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Footer from './footer'
import { AnimatedAuthBg } from '@/app/pages/auth/components/animated-auth-bg'

export default function AuthLayout() {
    const location = useLocation()

    return (
        <div className='relative flex min-h-svh flex-col overflow-hidden bg-[#020817]'>
            <AnimatedAuthBg />

            {/* Main Content Area */}
            <main className='relative z-10 flex flex-1 flex-col items-center justify-center p-4 lg:p-8'>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className='w-full'
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer at the bottom */}
            <Footer className="relative z-10" />
        </div>
    )
}
