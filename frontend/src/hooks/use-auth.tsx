import { User } from '@/models/user.model'
import { isLoggedInAtom, userAtom } from '@/store/store'
import { tokenStore } from '@/store/token'
import { authService } from '@/api/auth.service'
import { useAtom } from 'jotai'

export const useAuth = () => {
  const [user, setUser] = useAtom(userAtom)
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom)

  const login = (userData: Partial<User>, refreshToken: string | null = null, accessToken: any = null) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : userData as User))
    setIsLoggedIn(true)
    if (refreshToken) {
      tokenStore.setRefreshToken(refreshToken)
    }
    if (accessToken) {
      tokenStore.setAccessToken(accessToken)
    }
  }

  const logout = async () => {
    const refreshToken = tokenStore.getRefreshToken()
    if (refreshToken) {
      // Fire and forget logout call to backend
      authService.logout(refreshToken).catch((error) => {
        console.error('Backend logout failed:', error)
      })
    }
    // Clear local state immediately for better UX
    tokenStore.clearTokens()
    setUser(null)
    setIsLoggedIn(false)
  }

  return { user, isLoggedIn, login, logout }
}
