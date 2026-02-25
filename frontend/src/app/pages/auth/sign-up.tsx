import { SignUpForm } from './components/sign-up-form'
import { AuthShell } from './components/auth-shell'

export default function SignUp() {
  return (
    <AuthShell
      title="Create Account"
      subtitle="Join the elite network of digital display masters."
    >
      <SignUpForm />
    </AuthShell>
  )
}
