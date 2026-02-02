import {
  flexRender,
  SortDirection,
  Table as TableProps,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getTableStatusMessage } from '@/lib/utils'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
} from '@radix-ui/react-icons'
import { Skeleton } from './skeleton'

interface DataTableProps<T> {
  tableProps: TableProps<T>
  isFetching: boolean
  isError: boolean
  totalColumn: number
  hasRecord: boolean
}

const DataTable = <T extends object>({
  tableProps,
  isFetching,
  isError,
  totalColumn,
  hasRecord,
}: DataTableProps<T>) => {
  const statusMessage = getTableStatusMessage(isFetching, isError)

  const getSortIcon = (sortOrder: false | SortDirection) => {
    if (sortOrder === 'asc') return <ArrowDownIcon className='ml-2 h-4 w-4' />
    if (sortOrder === 'desc') return <ArrowUpIcon className='ml-2 h-4 w-4' />
    return <CaretSortIcon className='ml-2 h-4 w-4' />
  }

  return (
    <Table>
      <TableHeader>
        {tableProps.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort()
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  onClick={
                    canSort
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                  className={canSort ? 'cursor-pointer' : undefined}
                >
                  <div className='flex items-center gap-2'>
                    {!header.isPlaceholder &&
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    {canSort && (
                      <span className='flex items-center'>
                        {getSortIcon(header.column.getIsSorted())}
                      </span>
                    )}
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {hasRecord ? (
          tableProps.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <>
            {!isFetching ? (
              <TableRow>
                <TableCell colSpan={totalColumn} className='h-24 text-center'>
                  {statusMessage}
                </TableCell>
              </TableRow>
            ) : (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell colSpan={totalColumn} className='text-center'>
                    <Skeleton className='h-8' />
                  </TableCell>
                </TableRow>
              ))
            )}
          </>
        )}
      </TableBody>
    </Table>
  )
}

export default DataTable
