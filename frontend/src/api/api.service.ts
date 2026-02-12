import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
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
    let baseURL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_URL || 'https://smart-sign-deck.onrender.com').replace(/\/$/, "");

    // Safety check: ensure protocol is present (Railway URLs often copied without https://)
    if (!baseURL.startsWith('http') && !baseURL.includes('localhost')) {
      baseURL = `https://${baseURL}`;
    }

    // Safety check: strip /v1 if it was accidentally included in the env var
    baseURL = baseURL.replace(/\/v1\/?$/, "");

    console.log(`[ApiService] Final API URL: ${baseURL}`);

    if (!axios || typeof axios.create !== 'function') {
      console.error('[ApiService] Axios is not properly imported or .create is missing!', axios);
      // Fallback for some weird bundling issues
      const anyAxios = axios as any;
      if (anyAxios.default && typeof anyAxios.default.create === 'function') {
        console.log('[ApiService] Using axios.default.create fallback');
        this.api = anyAxios.default.create({
          baseURL,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error('Axios initialization failed: .create is not a function');
      }
    } else {
      console.log(`[ApiService] Initializing with baseURL: ${baseURL}`);
      this.api = axios.create({
        baseURL,
        timeout: 30000, // 30 second timeout to prevent infinite hang
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Request interceptor to attach access token automatically
    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = tokenStore.getAccessToken()
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
      }
      return config
    })

    // Response interceptor for automatic token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          const authEndpoints = [
            'v1/auth/login', 'v1/auth/register', 'v1/auth/forgot-password',
            'v1/auth/verify-otp', 'v1/auth/resend-otp', 'v1/auth/verify-reset-otp',
            'v1/auth/refresh-tokens', 'v1/auth/change-password', 'v1/auth/firebase'
          ]
          const url = originalRequest.url || ''
          if (authEndpoints.some(endpoint => url.includes(endpoint))) {
            return Promise.reject(error)
          }

          originalRequest._retry = true

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => this.api.request(originalRequest)).catch((err) => Promise.reject(err))
          }

          if (tokenStore.getRefreshingStatus()) {
            await tokenStore.waitForRefresh()
            if (tokenStore.isAccessTokenValid()) {
              return this.api.request(originalRequest)
            }
          }

          this.isRefreshing = true
          tokenStore.setRefreshingStatus(true)

          const refreshTokenAtStart = tokenStore.getRefreshToken()

          try {
            if (tokenStore.isAccessTokenValid()) {
              return this.api.request(originalRequest)
            }

            if (!refreshTokenAtStart) {
              throw new Error('No refresh token available')
            }

            // Use direct axios call to avoid interceptor loop
            const response = await axios.post(
              `${baseURL}/v1/auth/refresh-tokens`,
              { refreshToken: refreshTokenAtStart }
            )

            const responseData = response.data?.data || response.data
            const { tokens } = responseData

            if (!tokens || !tokens.access) {
              throw new Error('Invalid token response')
            }

            tokenStore.setAccessToken(tokens.access)
            if (tokens.refresh?.token) {
              tokenStore.setRefreshToken(tokens.refresh.token)
            }

            this.failedQueue.forEach((item) => item.resolve())
            this.failedQueue = []

            return this.api.request(originalRequest)
          } catch (refreshError) {
            this.failedQueue.forEach((item) => item.reject(refreshError))
            this.failedQueue = []

            const currentRefreshToken = tokenStore.getRefreshToken()
            if (currentRefreshToken && currentRefreshToken !== refreshTokenAtStart) {
              // Token changed in another tab, but don't reload here as it can loop
              return Promise.reject(refreshError)
            }

            tokenStore.clearTokens()

            // 🛡️ Hardened Redirect: Avoid infinite reload loop if already on Auth page
            const isAuthPage = window.location.pathname.includes('/sign-in') ||
              window.location.pathname.includes('/sign-up') ||
              window.location.pathname.includes('/otp') ||
              window.location.pathname.includes('/forgot-password')

            if (!isAuthPage) {
              window.location.href = '/sign-in'
            }

            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
            tokenStore.setRefreshingStatus(false)
          }
        }
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
      const contentType = body instanceof FormData ? 'multipart/form-data' : 'application/json';
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const config: any = {
        url: cleanEndpoint.startsWith('v1/') ? cleanEndpoint : `v1/${cleanEndpoint}`,
        method,
        headers: { ...headers, 'Content-Type': contentType },
        data: body instanceof FormData || body ? body : undefined,
        params,
      }

      console.log(`[ApiService] Full Target URL: ${this.api.defaults.baseURL}/${config.url}`);

      const response = await this.api.request<any>(config)
      const data = response.data

      if (data && data.status === 'success' && 'data' in data) {
        return data.data as T
      }
      return data as T
    } catch (error: any) {
      console.error('API request error:', error?.response || error)
      throw error?.response?.data || error
    }
  }

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
