import { FC, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '@/api'
import { Routes } from '@/utilities/routes'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/custom/button'
import { tokenStore } from '@/store/token'

import { AuthShell } from './components/auth-shell'

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
        <AuthShell
            title={status === 'loading' ? "Processing Request" : status === 'success' ? "Account Deleted" : "Request Failed"}
            subtitle={message}
        >
            <div className="flex flex-col items-center text-center space-y-6">
                {status === 'loading' && (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Loader2 size={36} className="text-primary animate-spin" />
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                        <Button
                            className="w-full h-12 text-base font-black uppercase tracking-widest shadow-xl rounded-xl"
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
                        <Button
                            variant="outline"
                            className="w-full h-12 text-base font-black uppercase tracking-widest rounded-xl border-white/20 bg-white/5 hover:bg-white/10"
                            onClick={() => navigate(Routes.LANDING)}
                        >
                            Return to Homepage
                        </Button>
                    </>
                )}
            </div>
        </AuthShell>
    )
}

export default DeleteAccount
