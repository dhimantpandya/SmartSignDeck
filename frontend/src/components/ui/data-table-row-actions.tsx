import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '../custom/button'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'

interface DataTableRowActionsProps {
  items: {
    label: string
    icon: React.ReactNode
    onClick: () => void
    className?: string
  }[]
}

export const DataTableRowActions: React.FC<DataTableRowActionsProps> = ({
  items,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 focus-visible:ring-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            className={item.className}
            onClick={item.onClick}
          >
            {item.icon}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
