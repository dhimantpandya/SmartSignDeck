import { Outlet } from 'react-router-dom'
import Footer from './footer'

export default function AuthLayout() {
    return (
        <div className='flex min-h-svh flex-col animate-gradient bg-background'>
            {/* Main Content Area - Grows to push footer down */}
            <main className='flex flex-1 flex-col items-center justify-center p-4 lg:p-8'>
                <Outlet />
            </main>

            {/* Footer at the bottom */}
            <Footer />
        </div>
    )
}
