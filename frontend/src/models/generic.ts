export interface GenericResponse<T> {
  status: string | number
  code?: number
  message: string
  data: T
}
