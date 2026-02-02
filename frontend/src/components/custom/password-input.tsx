import * as React from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PasswordIndicator } from '../ui/password-indicator'

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showTooltip?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, value = '', showTooltip = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [tooltipVisible, setTooltipVisible] = React.useState(false)

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (showTooltip) {
        setTooltipVisible(true)
      }
      props.onFocus?.(event)
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (showTooltip) {
        setTooltipVisible(false)
      }
      props.onBlur?.(event)
    }

    return (
      <TooltipProvider>
        <div className='relative rounded-md'>
          <Tooltip open={tooltipVisible}>
            <TooltipTrigger asChild>
              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                    className
                  )}
                  ref={ref}
                  {...props}
                  value={value}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  className='absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md text-muted-foreground'
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <IconEye size={18} />
                  ) : (
                    <IconEyeOff size={18} />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side='left'
              className='hidden max-w-xs rounded-md bg-white py-2 shadow-lg md:block'
            >
              <PasswordIndicator value={value as string} />
            </TooltipContent>
          </Tooltip>
        </div>
        {tooltipVisible && (
          <div className='block text-sm text-gray-500 md:hidden'>
            <PasswordIndicator value={value as string} />
          </div>
        )}
      </TooltipProvider>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
