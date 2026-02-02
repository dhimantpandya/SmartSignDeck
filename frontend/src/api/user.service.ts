import { apiService } from './api.service'
import {
  UserListResponse,
  UserListRequest,
  UserAddOrUpdateResponse,
  UserDeletionResponse,
  UpdateProfileResponse,
} from '@/models/user.model'
import {
  ProfileUpdateRequest,
  UserAddOrUpdateRequest,
} from '@/validations/user.validation'

class UserService {
  private api: typeof apiService
  controller: string = 'v1/users'

  constructor() {
    this.api = apiService
  }

  async getAllUsers(body: UserListRequest) {
    const { pageIndex, pageSize } = body.pagination
    const search = body.filter?.search
    const role = body.filter?.role
    const companyId = body.filter?.companyId

    // Build query params
    const params = new URLSearchParams()
    params.append('limit', pageSize.toString())
    params.append('skip', (pageIndex * pageSize).toString())

    if (search) params.append('search', search)
    if (role && role.length > 0) params.append('role', role.join(','))
    if (companyId) params.append('companyId', companyId)

    const response = await this.api.get<any>(`${this.controller}?${params.toString()}`)
    const { results, totalResults } = response

    // Map backend response (Paginate plugin) to frontend model
    return {
      message: 'Users retrieved successfully',
      status: 'success',
      data: {
        users: results,
        count: totalResults
      }
    } as UserListResponse
  }

  async addUser(user: UserAddOrUpdateRequest) {
    return this.api.post<UserAddOrUpdateResponse>(`${this.controller}`, user)
  }

  async updateUser(id: string | number, user: UserAddOrUpdateRequest) {
    return this.api.patch<UserAddOrUpdateResponse>(`${this.controller}/${id}`, user)
  }

  async deleteUser(id: string | number) {
    return this.api.delete<UserDeletionResponse>(`${this.controller}/${id}`)
  }

  async updateProfile(body: ProfileUpdateRequest) {
    return this.api.patch<UpdateProfileResponse>('v1/auth/profile', body);
  }
}

export const userService = new UserService()
