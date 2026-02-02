import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ChangeEvent, FC } from 'react'
interface SearchProps {
  searchTerm: string | undefined
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export const Search: FC<SearchProps> = ({
  searchTerm,
  onChange,
  placeholder,
  className,
}) => {
  return (
    <div>
      <Input
        value={searchTerm}
        onChange={onChange}
        type='search'
        placeholder={placeholder ?? 'Search...'}
        className={cn('md:w-[100px] lg:w-[300px]', className)}
      />
    </div>
  )
}
