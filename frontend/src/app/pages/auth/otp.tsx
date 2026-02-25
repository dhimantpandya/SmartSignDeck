import { useSearchParams } from 'react-router-dom'
import OtpForm from './components/otp-form'
import { AuthShell } from './components/auth-shell'

export default function Otp() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  return (
    <AuthShell
      title="Verify Email"
      subtitle={`We have sent a 6-digit code to ${email || 'your email'}.`}
      isPureForm={true}
    >
      <OtpForm />
    </AuthShell>
  )
}
