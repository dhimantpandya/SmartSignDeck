import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { tokenStore } from '@/store/token'
import { authService } from '@/api'
import Loader from '@/components/loader'
import { toast } from '@/components/ui/use-toast'

export default function GoogleCallback() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { login } = useAuth()

    useEffect(() => {
        const accessToken = searchParams.get('access')
        const refreshToken = searchParams.get('refresh')

        if (accessToken && refreshToken) {
            const handleLogin = async () => {
                try {
                    // 1. Set Access Token (memory)
                    tokenStore.setAccessToken({
                        token: accessToken,
                        expires: new Date(Date.now() + 30 * 60 * 1000), // Dummy expiration for memory store
                    })

                    // 2. Fetch User Info (since backend redirect only gives tokens for simplicity in URL)
                    const response = await authService.getUserInfo()

                    // 3. Complete login via hook (sets persistence)
                    login(response.user, refreshToken, {
                        token: accessToken,
                        expires: new Date(Date.now() + 30 * 60 * 1000)
                    })

                    toast({ title: 'Google login successful!', description: 'Please verify your email.' })

                    // Trigger OTP resend to ensure they have a code, since Google auth doesn't send one by default
                    // But only if they are not already verified (though here we might just force it for the requirement)
                    // The requirement says "make sure when user signup from gmail... they should redirect to the otp page for verification"
                    // It implies they need to verify.

                    try {
                        await authService.resendOtp(response.user.email);
                    } catch (e) {
                        console.error("Failed to send OTP for Google user", e);
                    }

                    navigate(`/otp?email=${response.user.email}`)
                } catch (error) {
                    console.error('Google callback error:', error)
                    toast({ variant: 'destructive', title: 'Authentication failed' })
                    navigate('/sign-in')
                }
            }

            handleLogin()
        } else {
            toast({ variant: 'destructive', title: 'Missing authentication tokens' })
            navigate('/sign-in')
        }
    }, [searchParams, login, navigate])

    return <Loader />
}
