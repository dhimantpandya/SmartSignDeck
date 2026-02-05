import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  title?: string
  message: string
  onConfirm: () => void
  onClose: () => void
  confirmBtnText?: string
  cancelBtnText?: string
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  isLoading?: boolean
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title = 'Are you sure?',
  message,
  onConfirm,
  onClose,
  confirmBtnText = 'Confirm',
  cancelBtnText = 'Cancel',
  variant = 'default',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
      case 'warning':
        return <IconAlertTriangle className={cn("h-10 w-10", variant === 'destructive' ? "text-destructive" : "text-yellow-500")} />
      case 'success':
        return <IconCircleCheck className="h-10 w-10 text-green-500" />
      default:
        return <IconInfoCircle className="h-10 w-10 text-primary" />
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-[420px] gap-6 backdrop-blur-md bg-background/95 border-primary/10 shadow-2xl">
        <div className="flex flex-col items-center justify-center pt-2 text-center">
          <div className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            variant === 'destructive' ? "bg-destructive/10" :
              variant === 'warning' ? "bg-yellow-500/10" :
                variant === 'success' ? "bg-green-500/10" : "bg-primary/10"
          )}>
            {getIcon()}
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-2">
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            {cancelBtnText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              variant === 'destructive' && "bg-destructive hover:bg-destructive/90",
              variant === 'warning' && "bg-yellow-500 hover:bg-yellow-600",
              variant === 'success' && "bg-green-500 hover:bg-green-600"
            )}
          >
            {isLoading ? 'Processing...' : confirmBtnText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
