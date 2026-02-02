import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders, AxiosError } from 'axios'
import { tokenStore } from '@/store/token'

type RequestBody = undefined | Record<string, unknown> | FormData

class ApiService {
  private api: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (error?: any) => void
  }> = []

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_APP_URL || '',
      headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
    })

    // Request interceptor to attach access token automatically
    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = tokenStore.getAccessToken()

      // Start with existing headers
      const headers = new AxiosHeaders(config.headers)

      // Only set Authorization if token exists
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      config.headers = headers
      return config
    })

    // Response interceptor for automatic token refresh on 401
    this.api.interceptors.response.use(
      (response) => response, // Pass through successful responses
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Check if error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          // SKIP refresh for auth endpoints (login, register, forgot-pass, etc.)
          const authEndpoints = [
            'v1/auth/login',
            'v1/auth/register',
            'v1/auth/forgot-password',
            'v1/auth/verify-otp',
            'v1/auth/resend-otp',
            'v1/auth/verify-reset-otp',
            'v1/auth/refresh-tokens',
            'v1/auth/change-password'
          ]
          const url = originalRequest.url || ''
          if (authEndpoints.some(endpoint => url.includes(endpoint))) {
            return Promise.reject(error)
          }

          // Prevent infinite loops - only retry once per request
          originalRequest._retry = true

          // If already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then(() => {
                // Retry with new token
                return this.api.request(originalRequest)
              })
              .catch((err) => {
                return Promise.reject(err)
              })
          }

          // SMARTER CONCURRENCY:
          // Check if another tab is already refreshing.
          if (tokenStore.getRefreshingStatus()) {
            console.log('[ApiService] Another tab is refreshing. Waiting...')
            await tokenStore.waitForRefresh()

            // After waiting, check if we now have a valid token
            if (tokenStore.isAccessTokenValid()) {
              console.log('[ApiService] New token found after wait. Retrying...')
              return this.api.request(originalRequest)
            }
          }

          this.isRefreshing = true
          tokenStore.setRefreshingStatus(true)

          const refreshTokenAtStart = tokenStore.getRefreshToken()

          try {
            // SHARED SESSION CHECK:
            // Before we try to refresh, check if ANOTHER TAB has already successfully
            // refreshed the token while this request was waiting or failing.
            if (tokenStore.isAccessTokenValid()) {
              console.log('[ApiService] Valid token found (shared session). Retrying original request...')
              return this.api.request(originalRequest)
            }

            if (!refreshTokenAtStart) {
              // No refresh token available, clear everything and logout
              throw new Error('No refresh token available')
            }

            // Refresh tokens using direct axios call (not this.api to avoid interceptor loop)
            const response = await axios.post(
              `${import.meta.env.VITE_APP_URL}/v1/auth/refresh-tokens`,
              { refreshToken: refreshTokenAtStart }
            )

            // Unwrap standardized response
            const responseData = response.data?.data || response.data
            const { tokens } = responseData

            if (!tokens || !tokens.access) {
              throw new Error('Invalid token response')
            }

            // Update access token in memory
            tokenStore.setAccessToken(tokens.access)

            // Update refresh token if rotated
            if (tokens.refresh?.token) {
              tokenStore.setRefreshToken(tokens.refresh.token)
            }

            // Process queued requests with new token
            this.failedQueue.forEach((item) => item.resolve())
            this.failedQueue = []

            // Retry original request with new token
            return this.api.request(originalRequest)
          } catch (refreshError) {
            this.failedQueue.forEach((item) => item.reject(refreshError))
            this.failedQueue = []

            // SMARTER TOKEN CLEARANCE:
            // If the current refresh token in storage is different from the one we tried to use,
            // it means ANOTHER TAB successfully refreshed. Just reload the page to sync.
            const currentRefreshToken = tokenStore.getRefreshToken()
            if (currentRefreshToken && currentRefreshToken !== refreshTokenAtStart) {
              console.log('[ApiService] Refresh failed but new token detected from another tab. Syncing...')
              window.location.reload()
              return Promise.reject(refreshError)
            }

            tokenStore.clearTokens()

            // Redirect to login page
            window.location.href = '/sign-in'

            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
            tokenStore.setRefreshingStatus(false)
          }
        }

        // Not a 401 or already retried, reject the error
        return Promise.reject(error)
      }
    )
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body: RequestBody = undefined,
    params: Record<string, unknown> = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    try {
      const axiosHeaders = new AxiosHeaders(headers)
      axiosHeaders.set('Content-Type', body instanceof FormData ? 'multipart/form-data' : 'application/json')

      const config: InternalAxiosRequestConfig = {
        url: endpoint.startsWith('/') ? endpoint.slice(1) : endpoint,
        method,
        headers: axiosHeaders,
        data: body instanceof FormData || body ? body : undefined,
        params,
      }

      const response = await this.api.request<any>(config)
      const data = response.data

      // Automatically unwrap standardized success responses
      if (data && data.status === 'success' && 'data' in data) {
        return data.data as T
      }

      return data as T
    } catch (error: any) {
      console.error('API request error:', error?.response || error)
      throw error?.response?.data || error
    }
  }

  // ===== HTTP METHODS =====
  get<T>(endpoint: string, config: { params?: Record<string, unknown>, headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, config.params, config.headers)
  }

  post<T>(endpoint: string, body: RequestBody, config: { params?: Record<string, unknown>, headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, config.params, config.headers)
  }

  put<T>(endpoint: string, body: RequestBody, config: { params?: Record<string, unknown>, headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, config.params, config.headers)
  }

  patch<T>(endpoint: string, body: RequestBody, config: { params?: Record<string, unknown>, headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body, config.params, config.headers)
  }

  delete<T>(endpoint: string, config: { params?: Record<string, unknown>, headers?: Record<string, string> } = {}): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, config.params, config.headers)
  }

  async download(endpoint: string, params: Record<string, unknown> = {}): Promise<Blob> {
    const config: any = {
      url: endpoint.startsWith('/') ? endpoint.slice(1) : endpoint,
      method: 'GET',
      params,
      responseType: 'blob',
    }
    const response = await this.api.request(config)
    return response.data
  }
}

export const apiService = new ApiService()
