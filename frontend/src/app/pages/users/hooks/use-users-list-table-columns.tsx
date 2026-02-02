import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { User } from '@/models/user.model'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UseUserListTableColumnsProps {
  actionHandler: (user: User) => void
  pagination: {
    pageIndex: number
    pageSize: number
  }
}

const useUserListTableColumns = ({
  actionHandler,
  pagination,
}: UseUserListTableColumnsProps) =>
  React.useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'id',
        cell: ({ row }) => (pagination.pageIndex * pagination.pageSize) + row.index + 1,
        header: 'Id',
        enableSorting: false,
        enableHiding: false,
      },

      {
        accessorKey: 'name',
        cell: ({ row: { original } }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={original.avatar} />
              <AvatarFallback className="text-xs">
                {original.first_name?.[0]}{original.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span>{`${original.first_name} ${original.last_name}`}</span>
          </div>
        ),
        header: 'Name',
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        cell: (info) => info.getValue(),
        header: 'Email',
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        cell: (info) => info.getValue(),
        header: 'Role',
        enableSorting: true,
      },
      {
        accessorKey: 'actions',
        cell: ({ row: { original } }) => actionHandler(original),
        header: '',
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [actionHandler]
  )

export { useUserListTableColumns }
