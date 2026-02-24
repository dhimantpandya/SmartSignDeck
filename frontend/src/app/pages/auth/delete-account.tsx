import { FC, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/api'
import { Routes } from '@/utilities/routes'
import { Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { tokenStore } from '@/store/token'

const DeleteAccount: FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying your deletion request...')

    const email = searchParams.get('email')
    const token = searchParams.get('token')

    useEffect(() => {
        if (!email || !token) {
            setStatus('error')
            setMessage('Invalid link: Missing required parameters.')
            return
        }

        const confirmDeletion = async () => {
            try {
                await authService.confirmDeleteAccount(email, token)
                // Clear tokens immediately on success
                tokenStore.clearTokens()
                setStatus('success')
                setMessage('Your account has been deleted successfully. We are sorry to see you go.')
            } catch (err: any) {
                console.error('Delete account failed:', err)
                setStatus('error')
                setMessage(err.response?.data?.message || err.message || 'Failed to verify deletion request.')
            }
        }

        confirmDeletion()
    }, [email, token])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Logo */}
            <div className="w-full max-w-md flex justify-center mb-8 relative z-10">
                <div className="flex items-center gap-3 select-none">
                    <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shadow-inner">
                        <Building2 size={28} className="text-primary" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-foreground/90 font-outfit">
                        SmartSign<span className="text-primary">Deck</span>
                    </span>
                </div>
            </div>

            <Card className="w-full max-w-md shadow-2xl border-border/40 backdrop-blur-xl bg-background/60 overflow-hidden relative z-10 custom-login-card">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                    {status === 'loading' && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                <Loader2 size={36} className="text-primary animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Processing Request</h1>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 size={40} className="text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Account Deleted</h1>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <Button
                                className="w-full h-12 text-base font-semibold shadow-xl rounded-xl"
                                onClick={() => navigate(Routes.LANDING)}
                            >
                                Return to Homepage
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <XCircle size={40} className="text-destructive" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold tracking-tight">Request Failed</h1>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <div className="w-full space-y-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 text-base font-semibold rounded-xl border-border/50"
                                    onClick={() => navigate(Routes.LANDING)}
                                >
                                    Return to Homepage
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Footer note */}
            <p className="mt-8 text-xs text-muted-foreground/60 select-none relative z-10 font-medium">
                © {new Date().getFullYear()} SmartSignDeck. All rights reserved.
            </p>
        </div>
    )
}

export default DeleteAccount
