import { useState } from 'react'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { playlistService, Playlist } from '@/api/playlist.service'
import { toast } from '@/components/ui/use-toast'
import { IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react'
import { Card } from '@/components/ui/card'
import PlaylistEditor from '../../screens/components/playlist-editor'

interface PlaylistFormProps {
    initialData?: Playlist
    onCancel: () => void
}

export default function PlaylistForm({ initialData, onCancel }: PlaylistFormProps) {
    const [name, setName] = useState(initialData?.name || '')
    const [items, setItems] = useState<any[]>(initialData?.items || [])
    const [isSaving, setIsSaving] = useState(false)

    const queryClient = useQueryClient()

    const saveMutation = useMutation({
        mutationFn: (data: Partial<Playlist>) => {
            if (initialData?.id || (initialData as any)?._id) {
                return playlistService.updatePlaylist(initialData!.id || (initialData as any)._id, data)
            }
            return playlistService.createPlaylist(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] })
            toast({ title: initialData ? 'Playlist updated' : 'Playlist created' })
            onCancel()
        },
        onError: (error: any) => {
            console.error(error)
            toast({
                title: 'Failed to save',
                description: error.response?.data?.message || error.message,
                variant: 'destructive'
            })
        }
    })

    const handleSave = () => {
        if (!name.trim()) return toast({ title: 'Name required', variant: 'destructive' })
        if (items.length === 0) return toast({ title: 'Playlist cannot be empty', variant: 'destructive' })

        setIsSaving(true)
        saveMutation.mutate({ name, items })
        setIsSaving(false)
    }

    // Dummy zone to allow mixed content in the reused editor
    const dummyZone = { type: 'mixed' }

    return (
        <div className='flex flex-col gap-6 h-[calc(100vh-140px)]'>
            <Card className='flex flex-col p-6 shadow-md h-full overflow-hidden'>
                <div className='mb-6 flex items-center gap-4 flex-shrink-0'>
                    <Button variant="ghost" size="icon" onClick={onCancel}><IconArrowLeft size={18} /></Button>
                    <h3 className='text-lg font-semibold'>{initialData ? 'Edit Playlist' : 'New Playlist'}</h3>
                    <div className='ml-auto'>
                        <Button loading={saveMutation.isPending || isSaving} onClick={handleSave}>
                            <IconDeviceFloppy className='mr-2' size={18} />
                            Save Playlist
                        </Button>
                    </div>
                </div>

                <div className='grid gap-4 mb-6 flex-shrink-0'>
                    <div className='grid gap-2'>
                        <Label htmlFor='name'>Playlist Name</Label>
                        <Input
                            id='name'
                            placeholder='e.g. Lunch Specials, Corporate Messaging'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar border-t pt-4'>
                    <Label className="mb-2 block">Media Items ({items.length})</Label>
                    <PlaylistEditor
                        zone={dummyZone}
                        items={items}
                        onChange={setItems}
                    />
                </div>
            </Card>
        </div>
    )
}
