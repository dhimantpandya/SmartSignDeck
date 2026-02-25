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
                <AnimatePresence>
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className='w-full flex justify-center'
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
