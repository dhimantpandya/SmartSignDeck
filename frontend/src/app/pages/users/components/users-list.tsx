import { ChangeEvent, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { userService } from '@/api'
import { useAuth } from '@/hooks/use-auth'
import { useUserListTableColumns } from '../hooks/use-users-list-table-columns'
import { User, UserListFilter } from '@/models/user.model'
import { Button } from '@/components/custom/button'
import { Search } from '@/components/search'
import { IconEdit, IconTrash, IconUserPlus } from '@tabler/icons-react'
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

  const getActionItems = (user: User) => {
    const actionItems = [
      {
        label: 'Edit',
        icon: <IconEdit className='mr-2' />,
        onClick: () => handleUserFormOpen(user),
      },
      {
        label: 'Delete',
        icon: <IconTrash className='mr-2' />,
        onClick: () => !isPending && handleDeleteUser(user),
        className: 'text-red focus:text-red',
      },
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

  const confirmDeleteUser = () => {
    if (confirmDelete.user) {
      deleteUser(confirmDelete.user.id)
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
                handleFilterChange({
                  ...tableState.filter,
                  companyId: values.includes('company') ? user?.companyId : undefined,
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
          <Button
            variant='outline'
            onClick={() => {
              const inviteLink = `${window.location.origin}${Routes.SIGN_UP}?companyId=${user?.companyId}`
              navigator.clipboard.writeText(inviteLink)
              toast({ title: 'Invite link copied!', description: 'Share this link with your team.' })
            }}
            className='h-9 px-4 hidden md:flex'
          >
            Copy Invite Link
          </Button>
          <Button
            variant='default'
            onClick={() => handleUserFormOpen()}
            className='h-9 px-4 font-semibold shadow-sm transition-all hover:shadow-md'
          >
            <IconUserPlus className='mr-2 h-4 w-4' />
            Create User
          </Button>
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
      <ConfirmationDialog
        isOpen={confirmDelete.isOpen}
        message={`Are you sure you want to delete ${confirmDelete.user?.first_name} ${confirmDelete.user?.last_name}?`}
        onConfirm={confirmDeleteUser}
        confirmBtnText='Delete'
        closeBtnText='No'
        onClose={() => setConfirmDelete({ isOpen: false })}
      />
    </>
  )
}
