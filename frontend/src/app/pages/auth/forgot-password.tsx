import { ForgotForm } from './components/forgot-form'
import { AuthShell } from './components/auth-shell'

export default function ForgotPassword() {
  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link."
      isPureForm={true}
    >
      <ForgotForm />
    </AuthShell>
  )
}
