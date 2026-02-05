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
      if (response?.data) {
        // Map raw API data to standardized User model
        const mappedUser = {
          id: response.data.id?.toString() || response.data._id?.toString() || '',
          email: response.data.email || '',
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          role: response.data.role ?? 'user',
          is_email_verified: response.data.is_email_verified ?? false,
          onboardingCompleted: response.data.onboardingCompleted ?? false,
          companyId: response.data.companyId?._id || response.data.companyId?.id || response.data.companyId || undefined,
          companyName: response.data.companyName || response.data.companyId?.name || undefined,
          avatar: response.data.avatar,
          gender: response.data.gender,
          dob: response.data.dob,
          language: response.data.language,
        }
        setUser(mappedUser as User)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return { user, isLoggedIn, login, logout, refreshUser }
}
