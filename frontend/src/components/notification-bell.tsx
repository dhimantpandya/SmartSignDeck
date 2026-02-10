import { IconBell } from '@tabler/icons-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/custom/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/components/nav-notification-provider'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Routes } from '@/utilities/routes'

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const navigate = useNavigate()

    const handleNotificationClick = (notif: any) => {
        if (!notif.isRead) {
            markAsRead(notif._id)
        }

        // Redirect logic based on type
        if (notif.type === 'friend_request') {
            navigate(Routes.COLLABORATION)
        } else if (notif.type === 'new_chat') {
            navigate(Routes.COLLABORATION) // Or specific chat if possible
        } else {
            // Default fallbacks
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='relative'>
                    <IconBell size={20} />
                    {unreadCount > 0 && (
                        <Badge
                            variant='destructive'
                            className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full px-1 text-[10px]'
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-80' align='end' forceMount>
                <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                        <div className='flex items-center justify-between'>
                            <p className='text-sm font-medium leading-none'>Notifications</p>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => markAllAsRead()}
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                        <p className='text-xs leading-none text-muted-foreground'>
                            You have {unreadCount} unread messages
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((item) => (
                            <DropdownMenuItem
                                key={item._id}
                                className={`flex cursor-pointer flex-col items-start gap-1 p-3 ${!item.isRead ? 'bg-muted/50' : ''}`}
                                onClick={() => handleNotificationClick(item)}
                            >
                                <div className="flex w-full items-center gap-2">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.message}
                                        </p>
                                    </div>
                                    {!item.isRead && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <span className="self-end text-[10px] text-muted-foreground">
                                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
