import { ChangeEvent, useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { userService, adminRequestService, socialService, authService } from '@/api'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/components/nav-notification-provider'
import { useUserListTableColumns } from '../hooks/use-users-list-table-columns'
import { User, UserListFilter } from '@/models/user.model'
import { Button } from '@/components/custom/button'
import { Search } from '@/components/search'
import { IconEdit, IconTrash, IconUserPlus, IconUserShare, IconUserCheck } from '@tabler/icons-react'
import { useTableState } from '@/hooks/use-table-state'
import DataTable from '@/components/ui/data-table'
import { DataTableRowActions } from '@/components/ui/data-table-row-actions'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { DataTableViewOptions } from '@/components/ui/data-table-view-options'
import { QueryKeys } from '@/data/constants/query-key'
import { DataTableFilter } from '@/components/ui/data-table-filter'
import { Cross2Icon } from '@radix-ui/react-icons'
import { roleOptions } from '@/data/options'
import { UserForm } from './user-form'
import { UserProfileDialog } from './user-profile-dialog'
import { LocalErrorBoundary } from '@/components/local-error-boundary'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from '@/components/ui/use-toast'
import { Roles } from '@/validations/user.validation'
import { Routes } from '@/utilities/routes'

const initialTableState = {
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  filter: {
    role: [],
    search: '',
  },
}

export const UsersList = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { socket } = useNotifications()

  // ⚡ Real-time: refresh users list when a new user registers
  useEffect(() => {
    if (!socket) return
    const handleNewUser = (newUser: any) => {
      console.log('[UsersList] New user registered:', newUser)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_LIST] })
    }

    const handleUserUpdated = (data: any) => {
      console.log('[UsersList] User updated event received:', data)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_LIST] })
    }

    const handleUserDeleted = (data: any) => {
      console.log('[UsersList] User deleted event received:', data)
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_LIST] })
    }

    socket.on('new_user_registered', handleNewUser)
    socket.on('user_updated', handleUserUpdated)
    socket.on('user_deleted', handleUserDeleted)

    return () => {
      socket.off('new_user_registered', handleNewUser)
      socket.off('user_updated', handleUserUpdated)
      socket.off('user_deleted', handleUserDeleted)
    }
  }, [socket, queryClient])

  const [userForm, setUserForm] = useState<{
    isOpen: boolean
    user?: User
  }>({ isOpen: false })

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    user?: User
  }>({ isOpen: false })

  const { mutate: deleteUser } = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: (response) => {
      toast({
        title: response.message,
      })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_LIST] })
    },
  })

  const {
    tableState,
    handlePaginationChange,
    handleSortChange,
    handleFilterChange,
    resetFilters,
    canReset,
  } = useTableState<UserListFilter>({
    initialState: initialTableState,
  })

  const { data, isFetching, error, isPending } = useQuery({
    queryKey: [QueryKeys.USER_LIST, tableState],
    queryFn: () => userService.getAllUsers(tableState),
  })

  // Social Queries
  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: () => socialService.getFriends(),
  })

  const { data: sentRequestsData } = useQuery({
    queryKey: ['sent-requests'],
    queryFn: () => socialService.getSentRequests(),
  })

  const { data: receivedRequestsData } = useQuery({
    queryKey: ['received-requests'],
    queryFn: () => socialService.getReceivedRequests(),
  })

  const { mutate: sendFriendRequest } = useMutation({
    mutationFn: (toId: string) => socialService.sendFriendRequest(toId),
    onSuccess: () => {
      toast({ title: 'Friend request sent!' })
      queryClient.invalidateQueries({ queryKey: ['sent-requests'] })
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to send request',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      })
    },
  })

  const getActionItems = (targetUser: User) => {
    const isSuperAdmin = user?.role === 'super_admin'
    const isAdmin = user?.role === 'admin'
    const targetUserId = targetUser.id || (targetUser as any)._id

    // 1. Hide 3-dots for current user row
    if (targetUserId === user?.id) return null

    // 2. Hide for advertisers (Advertiser should not see user details/profile)
    if (user?.role === 'advertiser') return null

    // Social Checks
    const friendsList = friendsData || []
    const sentReqs = sentRequestsData || []
    const receivedReqs = receivedRequestsData || []

    const isFriend = friendsList.some((f: any) => (f.id || f._id) === targetUserId)
    const isSent = sentReqs.some((r: any) => (r.toId?.id || r.toId?._id || r.toId) === targetUserId)
    const isReceived = receivedReqs.some((r: any) => (r.fromId?.id || r.fromId?._id || r.fromId) === targetUserId)

    // 3. Super Admin sees actions for everyone
    // 4. Admin only sees actions for same company
    const getCompId = (c: any) => {
      if (!c) return null
      if (typeof c === 'object') return (c?._id || c?.id || '').toString()
      return c.toString()
    }
    const currentUserCompId = getCompId(user?.companyId)
    const targetUserCompId = getCompId(targetUser.companyId)

    const sameCompany =
      (currentUserCompId && targetUserCompId && currentUserCompId === targetUserCompId) ||
      (user?.companyName && targetUser.companyName && user.companyName.toLowerCase() === targetUser.companyName.toLowerCase())

    const canManage = isSuperAdmin || (isAdmin && sameCompany)
    const isAdminTarget = targetUser.role === 'admin'

    const actionItems = [
      {
        label: 'Profile',
        icon: <IconUserShare className='mr-2' />,
        onClick: () => {
          setSelectedProfileUser(targetUser)
          setIsProfileOpen(true)
        },
      },
      ...(isFriend ? [
        {
          label: 'Friend',
          icon: <IconUserCheck className='mr-2 text-green-500' />,
          disabled: true,
          onClick: () => { },
        }
      ] : isSent || isReceived ? [
        {
          label: 'Pending',
          icon: <IconUserPlus className='mr-2 text-yellow-500' />,
          disabled: true,
          onClick: () => { },
        }
      ] : [
        {
          label: 'Add Friend',
          icon: <IconUserPlus className='mr-2' />,
          onClick: () => sendFriendRequest(targetUserId),
        }
      ]),
      ...(canManage && !(isAdmin && isAdminTarget) ? [
        {
          label: 'Edit',
          icon: <IconEdit className='mr-2' />,
          onClick: () => handleUserFormOpen(targetUser),
        },
        {
          label: 'Delete',
          icon: <IconTrash className='mr-2' />,
          onClick: () => !isPending && handleDeleteUser(targetUser),
          className: 'text-red focus:text-red',
        },
      ] : [])
    ]
    return <DataTableRowActions items={actionItems} />
  }

  const columns = useUserListTableColumns({
    actionHandler: getActionItems,
    pagination: tableState.pagination,
  })

  const tableProps = useReactTable({
    data: data?.data?.users || [],
    columns,
    rowCount: data?.data?.count ?? 0,
    state: {
      pagination: tableState.pagination,
      sorting: tableState.sorting.data,
    },
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const [selectedProfileUser, setSelectedProfileUser] = useState<User | undefined>()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleUserFormOpen = (user?: User) => {
    setUserForm({ isOpen: true, user })
  }

  const handleUserFormClose = (hasChanges?: boolean) => {
    if (hasChanges) {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USER_LIST] })
    }
    setUserForm({ isOpen: false })
  }

  const handleDeleteUser = (user: User) => {
    setConfirmDelete({ isOpen: true, user })
  }

  const { mutate: requestAction } = useMutation({
    mutationFn: (data: { targetUserId: string, type: 'DELETE' | 'ROLE_UPDATE', details?: any }) =>
      adminRequestService.createRequest(data),
    onSuccess: (response) => {
      toast({
        title: response.message || 'Request submitted successfully',
        description: 'Super Admin will review your request.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit request',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive'
      })
    }
  })

  const confirmDeleteUser = () => {
    if (confirmDelete.user) {
      const targetUserId = confirmDelete.user.id || (confirmDelete.user as any)._id
      if (user?.role === 'admin') {
        requestAction({
          targetUserId,
          type: 'DELETE'
        })
      } else {
        deleteUser(targetUserId)
      }
    }
    setConfirmDelete({ isOpen: false })
  }

  const handleRoleChange = (newSelectedValues: string[]) => {
    const role = newSelectedValues as Roles[]
    handleFilterChange({
      ...tableState.filter,
      role,
    })
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFilterChange({
      ...tableState.filter,
      search: event.target.value ?? '',
    })
  }

  return (
    <>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center space-x-2'>
          <Search
            onChange={handleSearchChange}
            searchTerm={tableState.filter.search}
            placeholder='Search users...'
            className='h-9 w-[150px] lg:w-[250px]'
          />
          <div className='flex items-center gap-2'>
            <DataTableFilter
              title='Role'
              options={roleOptions}
              selectedValues={tableState.filter.role}
              onChange={handleRoleChange}
            />
            <DataTableFilter
              title='Scope'
              options={[
                { label: 'Global Directory', value: 'all' },
                { label: 'My Organization', value: 'company' },
              ]}
              selectedValues={tableState.filter.companyId ? ['company'] : ['all']}
              onChange={(values) => {
                const getCompId = (c: any) => {
                  if (!c) return undefined
                  if (typeof c === 'object') return (c?._id || c?.id || '').toString()
                  return c.toString()
                }
                const companyId = values.includes('company') ? getCompId(user?.companyId) : undefined
                console.log('[DEBUG] Setting company filter:', companyId)
                handleFilterChange({
                  ...tableState.filter,
                  companyId,
                })
              }}
            />
            {canReset() && (
              <Button
                variant='ghost'
                onClick={resetFilters}
                className='h-9 px-2 lg:px-3 text-muted-foreground hover:text-foreground'
              >
                <Cross2Icon className='mr-2 h-4 w-4' />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className='flex flex-row items-center gap-2'>
          <DataTableViewOptions table={tableProps} />
          <div className='flex items-center gap-2'>
            <select
              className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
              onChange={async (e) => {
                const role = e.target.value
                if (!role) return

                try {
                  const compId = (user?.companyId as any)?._id || user?.companyId
                  if (!compId) {
                    toast({ title: 'Error', description: 'Company ID not found.', variant: 'destructive' })
                    return
                  }

                  const response = await authService.getInviteToken(compId.toString(), role)
                  const token = response.token
                  const inviteLink = `${window.location.origin}${Routes.SIGN_UP}?inviteToken=${token}`

                  navigator.clipboard.writeText(inviteLink)
                  toast({
                    title: 'Secure link copied!',
                    description: `Secure invite link for ${role} role copied to clipboard.`,
                  })
                } catch (error: any) {
                  toast({
                    title: 'Failed to generate link',
                    description: error.message || 'Server error',
                    variant: 'destructive',
                  })
                }
              }}
              defaultValue=''
            >
              <option value=''>Select Role to Copy Link</option>
              {roleOptions
                .filter((option) => {
                  if (user?.role === 'super_admin') return true
                  if (user?.role === 'admin') return true
                  if (user?.role === 'user') return option.value === Roles.USER
                  return false // Advertisers or unknown roles cannot invite
                })
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
{/* 
            Requirement: Remove 'Create User' button from Super Admin
            {user?.role === 'super_admin' && (
            <Button
              variant='default'
              onClick={() => handleUserFormOpen()}
              className='h-9 px-4 font-semibold shadow-sm transition-all hover:shadow-md'
            >
              <IconUserPlus className='mr-2 h-4 w-4' />
              Create User
            </Button>
          )} */}
        </div>
      </div>

      <div className='mt-4 rounded-xl border bg-card text-card-foreground shadow-sm'>
        <DataTable<User>
          tableProps={tableProps}
          isFetching={isFetching}
          isError={!!error}
          totalColumn={columns.length}
          hasRecord={!!data?.data?.users?.length}
        />
      </div>
      <div className='mt-4'>
        <DataTablePagination table={tableProps} isFetching={isFetching} />
      </div>

      <UserForm
        isOpen={userForm.isOpen}
        initialData={userForm.user}
        handleClose={handleUserFormClose}
      />
      <LocalErrorBoundary>
        <UserProfileDialog
          isOpen={isProfileOpen}
          handleClose={() => {
            setIsProfileOpen(false)
            setSelectedProfileUser(undefined)
          }}
          user={selectedProfileUser}
        />
      </LocalErrorBoundary>
      <ConfirmationDialog
        isOpen={confirmDelete.isOpen}
        title="Delete User"
        message={user?.role === 'admin'
          ? `Send request to delete ${confirmDelete.user?.first_name} ${confirmDelete.user?.last_name}? (Requires Super Admin approval)`
          : `Are you sure you want to delete ${confirmDelete.user?.first_name} ${confirmDelete.user?.last_name}?`}
        variant="destructive"
        onConfirm={confirmDeleteUser}
        confirmBtnText={user?.role === 'admin' ? 'Send Request' : 'Delete'}
        cancelBtnText='No'
        onClose={() => setConfirmDelete({ isOpen: false })}
      />
    </>
  )
}
