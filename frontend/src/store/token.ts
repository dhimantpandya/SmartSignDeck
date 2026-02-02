import { Access } from '@/models/user.model'

class TokenService {
  private static instance: TokenService

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService()
    }
    return TokenService.instance
  }

  // ===== ACCESS TOKEN (Persistent & Shared) =====
  public getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken')
    if (!token || token === 'null' || token === 'undefined') return null
    return token
  }

  public getExpiresAt(): Date | null {
    const expires = localStorage.getItem('accessExpires')
    return expires ? new Date(expires) : null
  }

  public setAccessToken(resp: Access): void {
    localStorage.setItem('accessToken', resp.token)
    localStorage.setItem('accessExpires', resp.expires.toString())

    // Dispatch a manual storage event so the current tab can also react if needed
    // (though usually only other tabs receive the event)
    window.dispatchEvent(new Event('storage'))
  }

  // ===== REFRESH TOKEN (Persistent) =====
  public getRefreshToken(): string | null {
    const token = localStorage.getItem('refreshToken')
    if (!token || token === 'null' || token === 'undefined') return null

    // Jotai's atomWithStorage stores strings with extra quotes (JSON stringified)
    if (token.startsWith('"') && token.endsWith('"')) {
      return token.slice(1, -1)
    }
    return token
  }

  public setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token)
    window.dispatchEvent(new Event('storage'))
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('accessExpires')
    localStorage.removeItem('refreshToken')
    window.dispatchEvent(new Event('storage'))
  }

  /**
   * Helper to check if the current access token is valid (not expired)
   */
  public isAccessTokenValid(): boolean {
    const expiresAt = this.getExpiresAt()
    if (!expiresAt) return false

    // Add a 10s buffer
    return expiresAt.getTime() > (Date.now() + 10000)
  }

  // ===== SHARED REFRESH LOCK =====
  public getRefreshingStatus(): boolean {
    return localStorage.getItem('isRefreshing') === 'true'
  }

  public setRefreshingStatus(status: boolean): void {
    if (status) {
      localStorage.setItem('isRefreshing', 'true')
    } else {
      localStorage.removeItem('isRefreshing')
    }
    // Storage event fires automatically for other tabs, 
    // but we dispatch manually for the SAME tab to react if needed
    window.dispatchEvent(new Event('storage'))
  }

  /**
   * Wait for another tab to finish refreshing.
   * Resolves to true if refresh finished, false if timed out.
   */
  public async waitForRefresh(maxWaitMs = 10000): Promise<boolean> {
    const start = Date.now()
    while (this.getRefreshingStatus() && (Date.now() - start) < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    return !this.getRefreshingStatus()
  }
}

const tokenStore = TokenService.getInstance()
export { tokenStore }
