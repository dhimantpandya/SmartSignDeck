import { FC, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collaborationService, socialService, userService } from '@/api'
import { useAuth } from '@/hooks/use-auth'
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
import { IconUsers, IconUserPlus, IconCheck, IconBuildingCommunity, IconUserHeart } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    const { user: currentUser } = useAuth()
    const queryClient = useQueryClient()
    const [mode, setMode] = useState<'company' | 'friends'>('company')

    const { data: friends, isLoading: isLoadingFriends } = useQuery({
        queryKey: ['friends'],
        queryFn: () => socialService.getFriends(),
        enabled: isOpen && mode === 'friends',
    })

    const { data: companyUsers, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['company-users', currentUser?.companyId],
        queryFn: async () => {
            const getCompId = (c: any) => {
                if (!c) return null
                if (typeof c === 'object') return (c?._id || c?.id || '').toString()
                return c.toString()
            }
            const cid = getCompId(currentUser?.companyId)
            if (!cid) return []
            const res = await userService.getAllUsers({
                pagination: { pageIndex: 0, pageSize: 100 },
                filter: {
                    companyId: cid,
                    role: [],
                    search: ''
                }
            })
            // Filter out self
            const myId = (currentUser as any)?.id || (currentUser as any)?._id;
            if (!myId) return res.data.users;
            const myIdStr = myId.toString().trim().toLowerCase();
            return res.data.users.filter((u: any) => {
                const uid = (u.id || u._id || '').toString().trim().toLowerCase();
                return uid !== myIdStr;
            });
        },
        enabled: isOpen && mode === 'company' && !!currentUser?.companyId,
    })

    const { data: pendingRequests } = useQuery({
        queryKey: ['collaboration-requests', 'outgoing', templateId, currentUser?.id],
        queryFn: () => collaborationService.getRequests({ type: 'outgoing', status: 'pending', templateId }),
        enabled: isOpen && !!currentUser?.id,
        refetchOnMount: 'always',
    })

    const sendRequestMutation = useMutation({
        mutationFn: (recipientId: string) =>
            collaborationService.sendRequest(recipientId, templateId),
        onSuccess: () => {
            toast({ title: 'Collaboration request sent' })
            // Invalidate all collaboration and notification related queries
            queryClient.invalidateQueries({ queryKey: ['collaboration-requests'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.refetchQueries({ queryKey: ['collaboration-requests'] })
        },
        onError: (err: any) => {
            toast({
                title: 'Request failed',
                description: err.response?.data?.message || err.message,
                variant: 'destructive'
            })
            queryClient.invalidateQueries({ queryKey: ['collaboration-requests'] })
        }
    })

    const extractId = (obj: any): string => {
        if (!obj) return ''
        if (typeof obj === 'string') return obj.trim().toLowerCase()
        const id = obj._id || obj.id || obj.userId || obj.friendId || (obj.sender && obj.sender._id) || (obj.recipient && obj.recipient._id)
        if (id) return id.toString().trim().toLowerCase()
        return ''
    }

    const isPending = (targetId: string) => {
        if (!targetId || !pendingRequests?.results) return false;
        const tid = targetId.toString().trim().toLowerCase();

        const pending = pendingRequests.results.some((r: any) => {
            if (!r) return false;

            // Extract recipient ID from various possible structures
            const recipientData = r.recipient;
            let rid = '';
            if (!recipientData) return false;

            if (typeof recipientData === 'string') {
                rid = recipientData;
            } else {
                rid = recipientData._id || recipientData.id || '';
            }

            const match = rid.toString().trim().toLowerCase() === tid;
            if (match) console.log(`[CollabDebug] Match found! Target: ${tid}, Request recipient: ${rid}`);
            return match;
        });

        return pending;
    }

    const isCollaborator = (targetId: string) => {
        if (!targetId || !currentCollaborators) return false;
        const tid = targetId.toString().trim().toLowerCase();

        return currentCollaborators.some(c => {
            const cid = extractId(c);
            const match = cid === tid;
            if (match) console.log(`[CollabDebug] Found Collaborator match for ${tid}`);
            return match;
        });
    }

    const isLoading = mode === 'friends' ? isLoadingFriends : isLoadingCompany
    const usersList = mode === 'friends' ? friends : companyUsers

    console.log(`[CollabDebug] Dialog State - isOpen: ${isOpen}, pendingCount: ${pendingRequests?.results?.length || 0}`);

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
                        Invite others to edit this template with you in real-time.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    <Tabs value={mode} onValueChange={(val: any) => setMode(val)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="company" className="gap-2">
                                <IconBuildingCommunity size={16} /> My Company
                            </TabsTrigger>
                            <TabsTrigger value="friends" className="gap-2">
                                <IconUserHeart size={16} /> Friends
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            {usersList && usersList.length > 0 ? (
                                <div className="space-y-4">
                                    {usersList.map((u: any) => {
                                        const userId = u.id || u._id
                                        const alreadyShared = isCollaborator(userId)
                                        const pending = isPending(userId)

                                        return (
                                            <div key={userId} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-primary/10">
                                                        <AvatarImage src={u.avatar} />
                                                        <AvatarFallback>
                                                            {u.first_name?.[0]}{u.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold">{u.first_name} {u.last_name}</p>
                                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={alreadyShared ? "secondary" : pending ? "outline" : "default"}
                                                    className="h-8 gap-2"
                                                    onClick={() => !alreadyShared && !pending && sendRequestMutation.mutate(userId)}
                                                    loading={sendRequestMutation.isPending}
                                                    disabled={alreadyShared || pending}
                                                >
                                                    {alreadyShared ? (
                                                        <><IconCheck size={14} /> Shared</>
                                                    ) : pending ? (
                                                        <>Pending</>
                                                    ) : (
                                                        <><IconUserPlus size={14} /> Share</>
                                                    )}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-muted/30 rounded-xl border border-dashed">
                                    <p className="text-sm font-medium">No {mode} found</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {mode === 'friends' ? 'Connect with other users to collaborate.' : 'Invite team members to your company.'}
                                    </p>
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
