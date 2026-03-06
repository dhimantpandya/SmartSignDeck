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

  const refreshUser = async () => {
    try {
      const response = await authService.getUserInfo()
      const userData = response?.user || response?.data || response

      if (userData) {
        // Map raw API data to standardized User model
        const mappedUser = {
          id: userData.id?.toString() || userData._id?.toString() || '',
          email: userData.email || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role ?? 'user',
          is_email_verified: userData.is_email_verified ?? false,
          onboardingCompleted: userData.onboardingCompleted ?? false,
          companyId: userData.companyId?._id || userData.companyId?.id || userData.companyId || undefined,
          companyName: userData.companyName || userData.companyId?.name || undefined,
          avatar: userData.avatar,
          gender: userData.gender,
          dob: userData.dob,
          language: userData.language,
        }
        setUser(mappedUser as User)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return { user, isLoggedIn, login, logout, refreshUser }
}
