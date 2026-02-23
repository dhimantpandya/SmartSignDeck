import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Routes } from '@/utilities/routes'

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

            // Construct registration URL based on what we have
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
        <div className='mx-auto flex min-h-screen w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
            <div className='mb-4 flex items-center justify-center'>
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='mr-2 h-6 w-6 text-primary'
                >
                    <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
                </svg>
                <h1 className='text-xl font-medium'>SmartSignDeck</h1>
            </div>

            <Card className='p-8 bg-background/60 backdrop-blur-md border-muted/50 shadow-2xl'>
                <div className='flex flex-col space-y-2 text-left mb-6'>
                    <h1 className='text-2xl font-bold tracking-tight'>Accept Invitation</h1>
                    <p className='text-sm text-muted-foreground'>
                        Paste the invite link shared by your administrator to join the workspace.
                    </p>
                </div>

                <div className='grid gap-6'>
                    <div className='grid gap-3'>
                        <label htmlFor='link' className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                            Paste Invitation Link
                        </label>
                        <Input
                            id='link'
                            placeholder='https://smartsigndeck.com/sign-up?companyId=...'
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className='h-12 bg-muted/30 border-muted-foreground/20 focus:border-primary transition-all'
                        />
                    </div>
                    <Button onClick={handleJoin} size='lg' className='w-full font-bold shadow-lg hover:shadow-xl transition-all h-12 text-md'>
                        Continue to Registration
                    </Button>

                    <div className='relative my-2'>
                        <div className='absolute inset-0 flex items-center'>
                            <span className='w-full border-t border-muted-foreground/20' />
                        </div>
                        <div className='relative flex justify-center text-xs uppercase'>
                            <span className='bg-background px-4 text-muted-foreground font-semibold'>
                                Already a member?
                            </span>
                        </div>
                    </div>

                    <Button
                        variant='outline'
                        onClick={() => navigate(Routes.SIGN_IN)}
                        className='w-full h-11 border-muted-foreground/20 hover:bg-muted/50 transition-all font-semibold'
                    >
                        Sign in to Workspace
                    </Button>
                </div>
            </Card>

            <p className='px-8 text-center text-xs text-muted-foreground mt-6'>
                By joining SmartSignDeck, you agree to our{' '}
                <a href='#' className='underline underline-offset-4 hover:text-primary transition-colors'>
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href='#' className='underline underline-offset-4 hover:text-primary transition-colors'>
                    Privacy Policy
                </a>.
            </p>
        </div>
    )
}
