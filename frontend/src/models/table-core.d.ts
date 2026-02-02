import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    filterColumn?: {
      title: string
    }
  }
}
