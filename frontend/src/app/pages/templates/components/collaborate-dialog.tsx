import { FC } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialService, templateService } from '@/api'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/custom/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { IconUsers, IconUserPlus, IconCheck } from '@tabler/icons-react'
import Loader from '@/components/loader'

interface CollaborateDialogProps {
    isOpen: boolean
    onClose: () => void
    templateId: string
    currentCollaborators: any[]
}

export const CollaborateDialog: FC<CollaborateDialogProps> = ({
    isOpen,
    onClose,
    templateId,
    currentCollaborators = [],
}) => {
    const queryClient = useQueryClient()

    const { data: friends, isLoading } = useQuery({
        queryKey: ['friends'],
        queryFn: () => socialService.getFriends(),
        enabled: isOpen,
    })

    const updateMutation = useMutation({
        mutationFn: (collaborators: string[]) =>
            templateService.updateTemplate(templateId, { collaborators }),
        onSuccess: () => {
            toast({ title: 'Collaborators updated' })
            queryClient.invalidateQueries({ queryKey: ['templates'] })
            queryClient.invalidateQueries({ queryKey: ['template', templateId] })
        },
        onError: (err: any) => {
            toast({
                title: 'Update failed',
                description: err.response?.data?.message || err.message,
                variant: 'destructive'
            })
        }
    })

    const toggleCollaborator = (friendId: string) => {
        const collaboratorIds = currentCollaborators.map(c => c._id || c)
        const isAlreadyCollaborator = collaboratorIds.includes(friendId)

        let newCollaborators
        if (isAlreadyCollaborator) {
            newCollaborators = collaboratorIds.filter(id => id !== friendId)
        } else {
            newCollaborators = [...collaboratorIds, friendId]
        }

        updateMutation.mutate(newCollaborators)
    }

    const isCollaborator = (friendId: string) => {
        return currentCollaborators.some(c => (c._id || c) === friendId)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <IconUsers className="text-primary" size={20} />
                        </div>
                        <DialogTitle>Collaborate</DialogTitle>
                    </div>
                    <DialogDescription>
                        Invite your friends to edit this template with you in real-time.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            {friends && friends.length > 0 ? (
                                <div className="space-y-4">
                                    {friends.map((friend: any) => (
                                        <div key={friend.id || friend._id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-primary/10">
                                                    <AvatarImage src={friend.avatar} />
                                                    <AvatarFallback>
                                                        {friend.first_name?.[0]}{friend.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold">{friend.first_name} {friend.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{friend.email}</p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={isCollaborator(friend.id || friend._id) ? "secondary" : "default"}
                                                className="h-8 gap-2"
                                                onClick={() => toggleCollaborator(friend.id || friend._id)}
                                                loading={updateMutation.isPending}
                                            >
                                                {isCollaborator(friend.id || friend._id) ? (
                                                    <><IconCheck size={14} /> Shared</>
                                                ) : (
                                                    <><IconUserPlus size={14} /> Share</>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-sm font-medium">No friends found</p>
                                    <p className="text-xs text-muted-foreground mt-1">Connect with other users to collaborate.</p>
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>

                {currentCollaborators.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Current Collaborators</p>
                        <div className="flex flex-wrap gap-2">
                            {currentCollaborators.map((c: any) => (
                                <Badge key={c._id || c} variant="outline" className="gap-1 pl-1 py-1">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={c.avatar} />
                                        <AvatarFallback className="text-[8px]">{c.first_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    {c.first_name || 'Collaborator'}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
