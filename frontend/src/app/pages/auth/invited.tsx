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
            const companyId = params.get('companyId')
            const role = params.get('role')

            if (!companyId) {
                toast({ title: 'Invalid invite link', description: 'Company ID not found in the link.', variant: 'destructive' })
                return
            }

            const signUpUrl = `${Routes.SIGN_UP}?companyId=${companyId}${role ? `&role=${role}` : ''}`
            navigate(signUpUrl)
        } catch (error) {
            toast({ title: 'Invalid URL', description: 'Please make sure you paste the full invite link.', variant: 'destructive' })
        }
    }

    return (
        <div className='mx-auto flex min-h-screen w-full flex-col justify-center space-y-6 sm:w-[520px] lg:p-8'>
            <div className='flex flex-col space-y-2 text-center'>
                <h1 className='text-3xl font-bold tracking-tight'>Welcome to SmartSignDeck</h1>
                <p className='text-muted-foreground'>
                    Have you been invited to join a team? Paste your invite link below to get started.
                </p>
            </div>

            <Card className='p-8 bg-background/60 backdrop-blur-md border-muted/50 shadow-2xl'>
                <div className='grid gap-6'>
                    <div className='grid gap-2'>
                        <label htmlFor='link' className='text-sm font-medium'>
                            Invite Link
                        </label>
                        <Input
                            id='link'
                            placeholder='https://smartsigndeck.com/sign-up?companyId=...'
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className='h-12'
                        />
                    </div>
                    <Button onClick={handleJoin} size='lg' className='w-full font-semibold'>
                        Join Workspace
                    </Button>

                    <div className='relative'>
                        <div className='absolute inset-0 flex items-center'>
                            <span className='w-full border-t' />
                        </div>
                        <div className='relative flex justify-center text-xs uppercase'>
                            <span className='bg-background px-2 text-muted-foreground'>
                                Or
                            </span>
                        </div>
                    </div>

                    <Button
                        variant='outline'
                        onClick={() => navigate(Routes.SIGN_IN)}
                        className='w-full'
                    >
                        Sign in to your existing account
                    </Button>
                </div>
            </Card>

            <p className='px-8 text-center text-sm text-muted-foreground'>
                By joining, you agree to our{' '}
                <a href='#' className='underline underline-offset-4 hover:text-primary'>
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href='#' className='underline underline-offset-4 hover:text-primary'>
                    Privacy Policy
                </a>.
            </p>
        </div>
    )
}
