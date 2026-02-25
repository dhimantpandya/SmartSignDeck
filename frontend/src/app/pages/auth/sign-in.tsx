import { UserAuthForm } from './components/user-auth-form'
import { AuthShell } from './components/auth-shell'

export default function SignIn() {
  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Enter your credentials to access your command center."
    >
      <UserAuthForm />
    </AuthShell>
  )
}
