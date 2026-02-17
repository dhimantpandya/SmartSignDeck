import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import { IconHome, IconPlaylist, IconPlus, IconTrash, IconEdit, IconPlayerPlay } from '@tabler/icons-react'
import { Button } from '@/components/custom/button'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Loader from '@/components/loader'
import { playlistService } from '@/api/playlist.service'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import PlaylistForm from './components/playlist-form'
import { useAuth } from '@/hooks/use-auth'

export default function Playlists() {
    const [showForm, setShowForm] = useState(false)
    const [editingPlaylist, setEditingPlaylist] = useState<any>(null)
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([])
    const queryClient = useQueryClient()

    const togglePlaylistSelection = (id: string) => {
        setSelectedPlaylists(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        )
    }

    const clearSelection = () => setSelectedPlaylists([])

    const selectAll = (playlists: any[]) => {
        const ids = playlists.map(p => p.id)
        setSelectedPlaylists(ids)
    }

    const isAllSelected = (playlists: any[]) => {
        return playlists.length > 0 && playlists.every(p => selectedPlaylists.includes(p.id))
    }

    const toggleSelectAll = (playlists: any[]) => {
        if (isAllSelected(playlists)) {
            clearSelection()
        } else {
            selectAll(playlists)
        }
    }
    const { user } = useAuth()

    const { data, isLoading } = useQuery({
        queryKey: ['playlists', user?.id],
        queryFn: () => playlistService.getPlaylists({ createdBy: user?.id, limit: 100 }),
        enabled: !!user?.id,
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => playlistService.deletePlaylist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] })
            toast({ title: 'Playlist deleted' })
        },
        onError: (err: any) => {
            toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' })
        }
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => playlistService.bulkDeletePlaylists(ids),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] })
            const deletedCount = data.deletedCount || selectedPlaylists.length
            toast({
                title: 'Bulk Action Completed',
                description: `${deletedCount} playlists deleted successfully.`
            })
            clearSelection()
        },
        onError: (error: any) => {
            toast({
                title: 'Bulk Deletion Failed',
                description: error?.response?.data?.message || 'Failed to delete some playlists.',
                variant: 'destructive'
            })
        }
    })

    const handleCreate = () => {
        setEditingPlaylist(null)
        setShowForm(true)
    }

    const handleEdit = (playlist: any) => {
        setEditingPlaylist(playlist)
        setShowForm(true)
    }

    const breadcrumbItems = [
        { href: '/', icon: <IconHome size={18} /> },
        { label: 'Playlists', icon: <IconPlaylist size={18} /> },
    ]

    const playlists = data?.results || []

    return (
        <Layout>
            <Layout.Header>
                <div className='ml-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <UserNav />
                </div>
            </Layout.Header>

            <Layout.Body>
                <BreadcrumbNavigation items={breadcrumbItems} />

                <div className='mb-2 flex items-center justify-between space-y-2'>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Shared Playlists</h1>
                        <p className='text-muted-foreground'>
                            Create playlists that can be assigned to multiple screens.
                        </p>
                    </div>
                    {!showForm && (
                        <Button onClick={handleCreate}>
                            <IconPlus className='mr-2' size={18} />
                            Create Playlist
                        </Button>
                    )}
                </div>

                {showForm ? (
                    <PlaylistForm
                        initialData={editingPlaylist}
                        onCancel={() => {
                            setShowForm(false)
                            setEditingPlaylist(null)
                        }}
                    />
                ) : (
                    <>
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader />
                            </div>
                        ) : playlists.length > 0 ? (
                            <>
                                <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-muted/30 rounded-lg border">
                                    <Checkbox
                                        id="select-all-playlists"
                                        checked={isAllSelected(playlists)}
                                        onCheckedChange={() => toggleSelectAll(playlists)}
                                    />
                                    <label htmlFor="select-all-playlists" className="text-sm font-medium cursor-pointer flex-1">
                                        Select All Playlists ({playlists.length})
                                    </label>
                                </div>
                                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6'>
                                    {playlists.map((playlist: any) => (
                                        <Card key={playlist.id} className="overflow-hidden">
                                            <CardHeader className="bg-muted/50 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={selectedPlaylists.includes(playlist.id)}
                                                            onCheckedChange={() => togglePlaylistSelection(playlist.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <CardTitle className="text-lg truncate" title={playlist.name}>{playlist.name}</CardTitle>
                                                    </div>
                                                    <Badge variant="outline">{playlist.items.length} items</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-4 h-32 relative overflow-hidden group">
                                                <div className="grid grid-cols-4 gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {playlist.items.slice(0, 4).map((item: any, i: number) => (
                                                        <div key={i} className="aspect-square bg-black rounded overflow-hidden">
                                                            {item.type === 'video' ? (
                                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                                    <IconPlayerPlay size={12} className="text-white" />
                                                                </div>
                                                            ) : (
                                                                <img src={item.url} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                    ))}
                                                    {playlist.items.length > 4 && (
                                                        <div className="aspect-square bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                            +{playlist.items.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-4">
                                                    Total Duration: {playlist.items.reduce((acc: number, item: any) => acc + (item.duration || 10), 0)}s
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 px-4 py-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(playlist)}>
                                                    <IconEdit size={16} className="mr-1" /> Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmDelete(playlist.id)}>
                                                    <IconTrash size={16} className="mr-1" /> Delete
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                                ) : (
                                <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-20 text-center mt-6'>
                                    <IconPlaylist size={48} className='mb-4 text-muted-foreground' />
                                    <h2 className='text-xl font-semibold'>No Playlists</h2>
                                    <p className='mb-6 text-muted-foreground'>
                                        Create a shared playlist to reuse content across screens.
                                    </p>
                                    <Button onClick={handleCreate}>
                                        Create First Playlist
                                    </Button>
                                </div>
                        )}
                            </>
                        )}

                        <ConfirmationDialog
                            isOpen={!!confirmDelete}
                            title="Delete Playlist"
                            message="Are you sure? This will not remove content from screens that have already synced, but they will stop receiving updates."
                            variant="destructive"
                            confirmBtnText="Delete"
                            onConfirm={() => {
                                if (confirmDelete) deleteMutation.mutate(confirmDelete)
                                setConfirmDelete(null)
                            }}
                            onClose={() => setConfirmDelete(null)}
                        />
                    </Layout.Body>

                {selectedPlaylists.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-2 border-r pr-6">
                            <Badge variant="default" className="rounded-full h-6 w-6 flex items-center justify-center p-0">
                                {selectedPlaylists.length}
                            </Badge>
                            <span className="text-sm font-medium">Items Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                className="h-9 px-4 rounded-full"
                            >
                                Clear
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (confirm(`${selectedPlaylists.length} items will be permanently deleted. Proceed?`)) {
                                        bulkDeleteMutation.mutate(selectedPlaylists)
                                    }
                                }}
                                className="h-9 px-6 rounded-full gap-2"
                                loading={bulkDeleteMutation.isPending}
                            >
                                <IconTrash size={16} />
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                )}
        </Layout>
    )
}
