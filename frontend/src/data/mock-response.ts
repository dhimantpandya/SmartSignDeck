import { User, UserListRequest } from '@/models/user.model'
/* eslint-disable */
import {
  ProfileUpdateRequest,
  Roles,
  UserAddOrUpdateRequest,
} from '@/validations/user.validation'

export const mockUser = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'test@test.com',
  role: Roles.USER,
  is_email_verified: true,
  onboardingCompleted: false,
}

export const mockGenerateNewTokenResponse = {
  data: {
    access: {
      token: 'access-token',
      expires: new Date(),
    },
  },
  message: '',
  status: 200,
}
export const mockLoginResponse = {
  data: {
    user: mockUser,
    tokens: {
      access: mockGenerateNewTokenResponse.data.access,
      refresh: mockGenerateNewTokenResponse.data.access,
    },
  },
  message: 'Login successful',
  status: 200,
}
const mockUsers: User[] = [
  { id: '1', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', role: Roles.ADMIN, is_email_verified: true, onboardingCompleted: true },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '3',
    first_name: 'Alice',
    last_name: 'Johnson',
    email: 'alice.johnson@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '4',
    first_name: 'Bob',
    last_name: 'Brown',
    email: 'bob.brown@example.com',
    role: Roles.ADMIN,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '5',
    first_name: 'Lisa',
    last_name: 'White',
    email: 'lisa.white@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '6',
    first_name: 'Mike',
    last_name: 'Jones',
    email: 'mike.jones@example.com',
    role: Roles.USER,
    is_email_verified: false,
    onboardingCompleted: false,
  },
  {
    id: '7',
    first_name: 'Carlos',
    last_name: 'Davis',
    email: 'carlos.davis@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '8',
    first_name: 'David',
    last_name: 'Miller',
    email: 'david.miller@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '9',
    first_name: 'Susan',
    last_name: 'Wilson',
    email: 'susan.wilson@example.com',
    role: Roles.USER,
    is_email_verified: false,
    onboardingCompleted: false,
  },
  {
    id: '10',
    first_name: 'Chris',
    last_name: 'Lee',
    email: 'chris.lee@example.com',
    role: Roles.ADMIN,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '11',
    first_name: 'Nancy',
    last_name: 'Kim',
    email: 'nancy.kim@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '12',
    first_name: 'Steve',
    last_name: 'Clark',
    email: 'steve.clark@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '13',
    first_name: 'Angela',
    last_name: 'Brown',
    email: 'angela.brown@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '14',
    first_name: 'Tom',
    last_name: 'Scott',
    email: 'tom.scott@example.com',
    role: Roles.USER,
    is_email_verified: false,
    onboardingCompleted: false,
  },
  {
    id: '15',
    first_name: 'Linda',
    last_name: 'Taylor',
    email: 'linda.taylor@example.com',
    role: Roles.ADMIN,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '16',
    first_name: 'Paul',
    last_name: 'Martinez',
    email: 'paul.martinez@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '17',
    first_name: 'Emma',
    last_name: 'Johnson',
    email: 'emma.johnson@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '18',
    first_name: 'Gregory',
    last_name: 'Wilson',
    email: 'gregory.wilson@example.com',
    role: Roles.USER,
    is_email_verified: false,
    onboardingCompleted: false,
  },
  {
    id: '19',
    first_name: 'Kate',
    last_name: 'Green',
    email: 'kate.green@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '20',
    first_name: 'Jason',
    last_name: 'Adams',
    email: 'jason.adams@example.com',
    role: Roles.ADMIN,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '21',
    first_name: 'Olivia',
    last_name: 'King',
    email: 'olivia.king@example.com',
    role: Roles.USER,
    is_email_verified: false,
    onboardingCompleted: false,
  },
  {
    id: '22',
    first_name: 'Matthew',
    last_name: 'Young',
    email: 'matthew.young@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '23',
    first_name: 'Isabella',
    last_name: 'Mitchell',
    email: 'isabella.mitchell@example.com',
    role: Roles.USER,
    is_email_verified: true,
    onboardingCompleted: true,
  },
  {
    id: '24',
    first_name: 'Noah',
    last_name: 'Cooper',
    email: 'noah.cooper@example.com',
    role: Roles.USER,
    is_email_verified: false,
    onboardingCompleted: false,
  },
]

const filterAndSortUsers = (request: UserListRequest) => {
  let filteredUsers = [...mockUsers]
  const { sorting, filter } = request

  // Search
  if (filter?.search) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(filter?.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filter?.search.toLowerCase())
    )
  }

  // Role Filter
  if (filter?.role && filter.role.length > 0) {
    filteredUsers = filteredUsers.filter((user) =>
      filter.role.includes(user.role)
    )
  }

  // Sorting
  if (sorting?.field && sorting.order) {
    const sortField =
      sorting.field === 'name' ? 'first_name' : (sorting.field as keyof User)

    const sortOrder = sorting.order
    filteredUsers.sort((a, b) => {
      const valA = String(a[sortField]);
      const valB = String(b[sortField]);
      return sortOrder === 'desc'
        ? valB.localeCompare(valA)
        : valA.localeCompare(valB)
    })
  }

  // Pagination
  const start = request.pagination.pageIndex * request.pagination.pageSize
  const end = start + request.pagination.pageSize
  const paginatedUsers = filteredUsers.slice(start, end)

  return {
    users: paginatedUsers,
    count: filteredUsers.length,
  }
}

export const mockUsersResponse = (request: UserListRequest) => ({
  status: 200,
  message: 'Users retrieved successfully',
  data: filterAndSortUsers(request),
})

export const mockUserAddResponse = (data: UserAddOrUpdateRequest) => {
  const existingIds = mockUsers.map((user) => parseInt(user.id))
  const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
  const newUser = { ...data, id: String(nextId), is_email_verified: false, onboardingCompleted: false }
  mockUsers.push(newUser as User)

  return {
    status: 200,
    message: 'Users retrieved successfully',
    data: newUser,
  }
}

export const mockUserUpdateResponse = (
  id: string,
  data: UserAddOrUpdateRequest
) => {
  // Find the user to update
  const userIndex = mockUsers.findIndex((user) => user.id === id)

  mockUsers[userIndex] = { ...mockUsers[userIndex], ...data }

  return {
    status: 200,
    message: 'User updated successfully',
    data: mockUsers[userIndex],
  }
}

export const mockUserDeletionResponse = (id: string) => {
  const userIndex = mockUsers.findIndex((user) => user.id === id)
  mockUsers.splice(userIndex, 1)
  return {
    status: 200,
    message: 'User deleted successfully',
  }
}
export const mockChangePasswordResponse = {
  status: 200,
  message: 'Password changed successful',
  data: {
    message: 'Your password has been successfully changed.',
  },
}

export const mockUpdateProfileResponse = (body: ProfileUpdateRequest) => ({
  status: 200,
  message: 'User update successful',
  data: body,
})

export const mockAnalyticsResponse = {
  status: 200,
  message: 'Analytics fetched successfully',
  data: {
    totalRevenue: {
      value: '$45,231.89',
      percentageChange: '+20.1% from last month',
    },
    subscriptions: {
      value: '+2350',
      percentageChange: '+180.1% from last month',
    },
    sales: {
      value: '+12,234',
      percentageChange: '+19% from last month',
    },
    activeNow: {
      value: '+573',
      percentageChange: '+201 since last hour',
    },
  },
}
