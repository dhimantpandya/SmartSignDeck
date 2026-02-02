import { useState } from 'react'
import { PaginationState, SortingState } from '@tanstack/react-table'

type Filter = Record<string, unknown>

export interface TableState<TFilter extends Filter> {
  pagination: PaginationState
  sorting?: {
    field: string
    order: string
  }
  filter?: TFilter
}

interface UseTableStateProps<TFilter extends Filter> {
  initialState: TableState<TFilter>
}

const useTableState = <TFilter extends Filter>({
  initialState,
}: UseTableStateProps<TFilter>) => {
  let initialSorting: SortingState = []
  if (initialState.sorting) {
    initialSorting = [
      {
        id: initialState.sorting.field,
        desc: initialState.sorting.order === 'desc',
      },
    ]
  }

  const [sortingState, setSortingState] = useState<SortingState>(initialSorting)
  const [paginationState, setPaginationState] = useState<PaginationState>(
    initialState.pagination
  )

  const [filterState, setFilterState] = useState<TFilter>(
    initialState.filter ?? ({} as TFilter)
  )

  const handleFilterChange = (newFilter: TFilter) => {
    setFilterState(newFilter)
    setPaginationState({
      pageIndex: 0,
      pageSize: paginationState.pageSize,
    })
  }

  const resetFilters = () => {
    setFilterState(initialState.filter ?? ({} as TFilter))
    setPaginationState({
      pageIndex: 0,
      pageSize: paginationState.pageSize,
    })
  }

  const canReset = () => {
    // Check if filter has any keys and whether those keys have values
    const hasFilterKeys = Object.keys(filterState).length > 0

    const hasFilterValues = Object.values(filterState).some((value) => {
      // Check for empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return false
      }
      // Check for non-empty values
      return value !== '' && value !== null && value !== undefined
    })

    return hasFilterKeys && hasFilterValues
  }

  const getTableState = () => ({
    pagination: paginationState,
    sorting: {
      data: sortingState,
      order:
        sortingState.length > 0 ? (sortingState[0].desc ? 'desc' : 'asc') : '',
      field: sortingState.length > 0 ? sortingState[0].id : '',
    },
    filter: filterState,
  })

  return {
    tableState: getTableState(),
    handleSortChange: setSortingState,
    handlePaginationChange: setPaginationState,
    handleFilterChange,
    resetFilters,
    canReset,
  }
}

export { useTableState }
