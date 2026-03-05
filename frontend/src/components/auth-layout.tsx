import { Outlet } from 'react-router-dom'
import { AnimatedAuthBg } from '@/app/pages/auth/components/animated-auth-bg'
import '@/app/pages/auth/auth-animations.css'

export default function AuthLayout() {
    return (
        <div className='auth-page-container relative flex min-h-svh flex-col overflow-hidden bg-[#020817]'>
            <AnimatedAuthBg />

            {/* Full-screen auth content — no footer on auth pages */}
            <main className='relative z-50 flex w-full flex-1 flex-col items-center justify-center p-4 lg:p-8'>
                <Outlet />
            </main>
        </div>
    )
}
