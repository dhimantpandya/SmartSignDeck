import { FC, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/custom/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { templateService, screenService, socialService } from '@/api'
import { User } from '@/models/user.model'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { IconDeviceTv, IconLayout, IconPlayerPlay, IconCopy, IconUserPlus } from '@tabler/icons-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { useAuth } from '@/hooks/use-auth'

interface UserProfileDialogProps {
    isOpen: boolean
    handleClose: () => void
    user?: User
}

export const UserProfileDialog: FC<UserProfileDialogProps> = ({
    isOpen,
    handleClose,
    user: profileUser,
}) => {
    const { user: currentUser } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'screens' | 'templates'>('screens')

    // Connection Status Queries
    const { data: friendsData } = useQuery({
        queryKey: ['friends'],
        queryFn: () => socialService.getFriends(),
        enabled: isOpen,
    })

    const { data: sentRequestsData } = useQuery({
        queryKey: ['sent-requests'],
        queryFn: () => socialService.getSentRequests(),
        enabled: isOpen,
    })

    const { data: receivedRequestsData } = useQuery({
        queryKey: ['received-requests'],
        queryFn: () => socialService.getReceivedRequests(),
        enabled: isOpen,
    })

    const { mutate: sendFriendMutation, isPending: isMutationPending } = useMutation({
        mutationFn: (toId: string) => socialService.sendFriendRequest(toId),
        onSuccess: () => {
            toast({ title: 'Friend request sent!' })
            queryClient.invalidateQueries({ queryKey: ['sent-requests'] })
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to send request',
                description: err.response?.data?.message || err.message,
                variant: 'destructive',
            })
        },
    })

    const user = profileUser // Alias for existing code
    const isMe = currentUser?.id === (user?.id || (user as any)._id)
    const friendsList = friendsData || []
    const sentReqs = sentRequestsData || []
    const receivedReqs = receivedRequestsData || []

    const targetUserId = user?.id || (user as any)?._id
    const isFriend = friendsList.some((f: any) => (f.id || f._id) === targetUserId)
    const isSent = sentReqs.some((r: any) => (r.toId?.id || r.toId?._id || r.toId) === targetUserId)
    const isReceived = receivedReqs.some((r: any) => (r.fromId?.id || r.fromId?._id || r.fromId) === targetUserId)

    // Fetch public screens
    const { data: screensData, isLoading: isLoadingScreens } = useQuery({
        queryKey: ['public-screens', user?.id],
        queryFn: () => screenService.getScreens({ createdBy: user?.id, isPublic: true }),
        enabled: !!user?.id && activeTab === 'screens',
    })

    // Fetch public templates
    const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
        queryKey: ['public-templates', user?.id],
        queryFn: () => templateService.getTemplates({ createdBy: user?.id, isPublic: true }),
        enabled: !!user?.id && activeTab === 'templates',
    })

    const cloneTemplateMutation = useMutation({
        mutationFn: (id: string) => templateService.cloneTemplate(id),
        onSuccess: () => {
            toast({ title: 'Template cloned successfully', description: 'It has been added to your own templates.' })
            queryClient.invalidateQueries({ queryKey: ['templates'] })
        },
        onError: (error: any) => {
            toast({
                title: 'Cloning failed',
                description: error?.response?.data?.message || 'Failed to clone template',
                variant: 'destructive',
            })
        },
    })

    const cloneScreenMutation = useMutation({
        mutationFn: (id: string) => screenService.cloneScreen(id),
        onSuccess: () => {
            toast({ title: 'Screen cloned successfully', description: 'It and its template have been added to your own section.' })
            queryClient.invalidateQueries({ queryKey: ['screens'] })
            queryClient.invalidateQueries({ queryKey: ['templates'] })
        },
        onError: (error: any) => {
            toast({
                title: 'Cloning failed',
                description: error?.response?.data?.message || 'Failed to clone screen',
                variant: 'destructive',
            })
        },
    })

    const screens = screensData?.results || []
    const templates = templatesData?.results || []

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/10">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="text-xl bg-primary/5 text-primary">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <DialogTitle className="flex items-center gap-2 text-2xl">
                                    {user?.first_name} {user?.last_name}'s Profile
                                    <Badge variant="outline" className="ml-2 font-normal">Public Items</Badge>
                                </DialogTitle>
                                <p className="text-muted-foreground mt-1">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {user && !isMe && !isFriend && (
                                <Button
                                    size="sm"
                                    variant={isSent || isReceived ? 'secondary' : 'default'}
                                    disabled={isSent || isMutationPending}
                                    onClick={() => isReceived ? toast({ title: 'Go to Collaboration Hub to respond!' }) : sendFriendMutation.mutate(user.id || (user as any)._id)}
                                    className="gap-2"
                                >
                                    {isSent ? 'Request Sent' : isReceived ? 'Respond to Request' : 'Add Friend'}
                                    {!isSent && !isReceived && <IconUserPlus size={16} />}
                                </Button>
                            )}
                            {isFriend && (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                                    Connected
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="screens" className="flex items-center gap-2">
                            <IconDeviceTv size={18} /> Screens ({screens.length})
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="flex items-center gap-2">
                            <IconLayout size={18} /> Templates ({templates.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="screens" className="mt-6">
                        {isLoadingScreens ? (
                            <div className="flex h-40 items-center justify-center"><Loader /></div>
                        ) : screens.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                                No public screens found for this user.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {screens.map((screen: any) => (
                                    <Card key={screen.id}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">{screen.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">Template: {screen.templateId?.name}</p>
                                        </CardHeader>
                                        <CardContent className="text-sm">
                                            {screen.location && <p>Location: {screen.location}</p>}
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`/player/${screen.id}`, '_blank')}>
                                                <IconPlayerPlay size={16} className="mr-1" /> Preview
                                            </Button>
                                            <Button variant="default" size="sm" onClick={() => cloneScreenMutation.mutate(screen.id)} loading={cloneScreenMutation.isPending}>
                                                <IconCopy size={16} className="mr-1" /> Use
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="templates" className="mt-6">
                        {isLoadingTemplates ? (
                            <div className="flex h-40 items-center justify-center"><Loader /></div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                                No public templates found for this user.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {templates.map((template: any) => (
                                    <Card key={template.id}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground">{template.zones?.length || 0} Zones • {template.resolution}</p>
                                        </CardHeader>
                                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                            <Button variant="ghost" size="sm" disabled>
                                                Preview Not Available
                                            </Button>
                                            <Button variant="default" size="sm" onClick={() => cloneTemplateMutation.mutate(template.id)} loading={cloneTemplateMutation.isPending}>
                                                <IconCopy size={16} className="mr-1" /> Use
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    )
}
