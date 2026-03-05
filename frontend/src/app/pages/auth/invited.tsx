import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Routes } from '@/utilities/routes'
import { AuthShell } from './components/auth-shell'

export default function Invited() {
    const [link, setLink] = useState('')
    const navigate = useNavigate()

    const handleJoin = () => {
        try {
            if (!link) {
                toast({ title: 'Please paste an invite link', variant: 'destructive' })
                return
            }

            const url = new URL(link)
            const params = new URLSearchParams(url.search)
            const inviteToken = params.get('inviteToken')
            const companyId = params.get('companyId')
            const role = params.get('role')

            if (!inviteToken && !companyId) {
                toast({
                    title: 'Invalid invite link',
                    description: 'No valid invitation details found in the link.',
                    variant: 'destructive'
                })
                return
            }

            let signUpUrl = Routes.SIGN_UP
            if (inviteToken) {
                signUpUrl += `?inviteToken=${inviteToken}`
            } else {
                signUpUrl += `?companyId=${companyId}${role ? `&role=${role}` : ''}`
            }

            navigate(signUpUrl)
        } catch (error) {
            toast({ title: 'Invalid URL', description: 'Please make sure you paste the full invite link.', variant: 'destructive' })
        }
    }

    return (
        <AuthShell
            title="Accept Invitation"
            subtitle="Paste the invite link shared by your administrator to join the workspace."
            isPureForm={true}
        >
            <div className='grid gap-6'>
                <div className='grid gap-3'>
                    <label htmlFor='link' className='text-xs font-semibold text-[#1a1a2e] md:text-muted-foreground'>
                        Paste Invitation Link
                    </label>
                    <Input
                        id='link'
                        placeholder='https://smartsigndeck.com/sign-up?companyId=...'
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className='h-12 rounded-xl border-white/20 bg-white/5 focus-visible:ring-primary/50'
                    />
                </div>
                <Button onClick={handleJoin} className='mt-4 h-12 rounded-xl font-black uppercase tracking-widest shadow-xl w-full'>
                    Continue to Registration
                </Button>

                <div className='relative my-2'>
                    <div className='absolute inset-0 flex items-center'>
                        <span className='w-full border-t border-white/10' />
                    </div>
                    <div className='relative flex justify-center text-xs uppercase'>
                        <span className='px-4 text-[#1a1a2e] md:text-muted-foreground font-bold'>
                            Already a member?
                        </span>
                    </div>
                </div>

                <Button
                    variant='outline'
                    onClick={() => navigate(Routes.SIGN_IN)}
                    className='h-12 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 transition-all font-black uppercase tracking-widest'
                >
                    Sign in to Workspace
                </Button>
            </div>

            <p className='px-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1a2e]/80 md:text-muted-foreground/60 mt-8 leading-relaxed'>
                By joining SmartSignDeck, you agree to our{' '}
                <a href='#' className='text-[#1a1a2e] md:text-foreground underline underline-offset-4 hover:text-[#1a1a2e]/80 md:hover:text-primary transition-colors'>
                    Terms
                </a>{' '}
                &{' '}
                <a href='#' className='text-[#1a1a2e] md:text-foreground underline underline-offset-4 hover:text-[#1a1a2e]/80 md:hover:text-primary transition-colors'>
                    Privacy
                </a>.
            </p>
        </AuthShell>
    )
}
