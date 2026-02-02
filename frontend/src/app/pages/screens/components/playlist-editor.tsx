import { useState } from 'react'
import { Button } from '@/components/custom/button'
import { IconPlus, IconTrash, IconPhoto, IconMovie } from '@tabler/icons-react'
import { toast } from '@/components/ui/use-toast'
import { apiService } from '@/api'

interface PlaylistItem {
    url: string
    duration: number
    type: 'video' | 'image'
}

interface PlaylistEditorProps {
    zone: any
    items: PlaylistItem[] | undefined
    onChange: (items: PlaylistItem[]) => void
}

export default function PlaylistEditor({ zone, items, onChange }: PlaylistEditorProps) {
    const [mediaTypeLock, setMediaTypeLock] = useState<'image' | 'video' | 'both'>('both')
    const [isProcessing, setIsProcessing] = useState(false)
    const safeItems = items || []

    const handleAddItems = (assets: any[]) => {
        const validItems: PlaylistItem[] = [];
        let rejectedCount = 0;
        let rejectReason = '';

        assets.forEach(asset => {
            const url = asset.secure_url;
            if (!url) return;

            // Auto-detect type
            let type: 'video' | 'image' = 'image';
            if (url.match(/\.(mp4|webm|ogg|quicktime)$/i)) type = 'video';
            if (asset.resource_type === 'video') type = 'video'; // Cloudinary metadata fallback

            // Validation check against Zone Type
            if (zone.type !== 'mixed' && zone.type !== type) {
                rejectedCount++;
                rejectReason = `This is a ${zone.type}-only zone`;
                return;
            }

            // Validation check against User Lock
            if (zone.type === 'mixed' && mediaTypeLock !== 'both' && mediaTypeLock !== type) {
                rejectedCount++;
                rejectReason = `Locked to ${mediaTypeLock}s only`;
                return;
            }

            validItems.push({
                url,
                duration: type === 'video' ? (Number(asset.duration) || 10) : 10,
                type
            });
        });

        if (validItems.length > 0) {
            onChange([...safeItems, ...validItems]);
            toast({ title: `${validItems.length} media item(s) added!` });
        }

        if (rejectedCount > 0) {
            toast({
                title: `${rejectedCount} item(s) not added`,
                description: rejectReason,
                variant: "destructive"
            });
        }
    }

    const removeItem = (idx: number) => {
        if (!window.confirm("Delete this item?")) return
        onChange(safeItems.filter((_, i) => i !== idx))
    }

    const moveItem = (idx: number, dir: 'up' | 'down') => {
        if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === safeItems.length - 1)) return
        const newItems = [...safeItems]
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1
            ;[newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]
        onChange(newItems)
    }

    const updateDuration = (idx: number, newDuration: number) => {
        const newItems = [...safeItems]
        newItems[idx].duration = newDuration
        onChange(newItems)
    }

    const handleOpenCloudinaryWidget = async () => {
        setIsProcessing(true)
        try {
            // @ts-ignore
            if (!window.cloudinary || !window.cloudinary.createMediaLibrary) {
                throw new Error("Cloudinary SDK not loaded. Please refresh the page.")
            }

            // Get signature from backend
            const { signature, timestamp, cloud_name, api_key } = await apiService.get<any>('/v1/cloudinary/signature', {
                params: {
                    timestamp: Math.round(new Date().getTime() / 1000)
                }
            })

            // Create and show widget
            // @ts-ignore
            const widget = window.cloudinary.createMediaLibrary({
                cloud_name: cloud_name,
                api_key: api_key,
                timestamp: timestamp,
                signature: signature,
                button_class: 'hidden',
                multiple: true,
                max_files: 10,
                inline_container: null, // Ensure modal
                z_index: 9999
            }, {
                insertHandler: (data: any) => {
                    if (data && data.assets) {
                        handleAddItems(data.assets);
                    }
                }
            })

            widget.show();

        } catch (error: any) {
            console.error(error);
            toast({ title: 'Could not open Cloudinary', description: error.message || "Unknown error", variant: 'destructive' })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className='space-y-4'>
            {/* Controls */}
            <div className='flex flex-col gap-3 p-3 bg-muted/40 rounded-md border'>
                {/* Type Lock for Mixed Zones */}
                {zone.type === 'mixed' && (
                    <div className='flex items-center justify-between text-sm mb-4'>
                        <span className='font-medium text-muted-foreground'>Content Type Lock:</span>
                        <select
                            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs"
                            value={mediaTypeLock}
                            onChange={(e) => setMediaTypeLock(e.target.value as any)}
                        >
                            <option value="both">Allow Both</option>
                            <option value="image">Images Only</option>
                            <option value="video">Videos Only</option>
                        </select>
                    </div>
                )}

                <div className="pt-2 space-y-2">
                    <Button
                        type="button"
                        variant="default"
                        className="w-full h-10 shadow-sm relative overflow-hidden"
                        disabled={isProcessing}
                        onClick={handleOpenCloudinaryWidget}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                        <IconPlus className='mr-2' size={20} />
                        {isProcessing ? 'Opening...' : 'Add Media from Cloudinary'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center px-2">
                        Click the button above to insert media. <br />
                        <span className="opacity-75">Use the link below only for managing files.</span>
                    </p>
                    <div className="flex justify-center items-center text-[10px] text-muted-foreground px-1 pt-1 border-t border-border/50">
                        <a
                            href="https://console.cloudinary.com/console/media_library/folders/all"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline cursor-pointer flex items-center gap-1 opacity-80 hover:opacity-100"
                        >
                            Manage Files (External) <IconMovie size={10} />
                        </a>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className='space-y-2 max-h-[400px] overflow-y-auto pr-1'>
                {safeItems.map((item, i) => (
                    <div key={i} className='flex items-center gap-3 p-2 border rounded-md bg-card hover:bg-muted/50 transition-colors group'>

                        {/* Thumbnail */}
                        <div
                            className='w-16 h-10 bg-black rounded overflow-hidden flex-shrink-0 border border-gray-800 relative group-hover:border-primary/50 transition-colors cursor-pointer'
                            onClick={() => window.open(item.url, '_blank')}
                            title="Open in new tab"
                        >
                            {item.type === 'video' ? (
                                <video src={item.url} className="w-full h-full object-cover opacity-80" muted />
                            ) : (
                                <img src={item.url} className="w-full h-full object-cover opacity-80" alt="" />
                            )}
                            <div className='absolute inset-0 flex items-center justify-center'>
                                {item.type === 'video' ? <IconMovie size={14} className="text-white drop-shadow-md" /> : <IconPhoto size={14} className="text-white drop-shadow-md" />}
                            </div>
                        </div>

                        {/* Details */}
                        <div className='flex-1 min-w-0 flex flex-col justify-center gap-1'>
                            <div className='truncate text-[10px] font-mono text-muted-foreground'>{item.url.split('/').pop()}</div>
                            <div className='flex items-center gap-2'>
                                <span className='text-[10px] text-muted-foreground'>Duration:</span>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        className="h-5 w-12 text-[10px] text-center border rounded bg-background px-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={item.duration}
                                        min={1}
                                        disabled={item.type === 'video'}
                                        onChange={(e) => updateDuration(i, parseInt(e.target.value) || 1)}
                                    />
                                    <span className='text-[10px] ml-1 text-muted-foreground'>s</span>
                                    {item.type === 'video' && <span className="text-[8px] ml-1 text-blue-500">(Video Length)</span>}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(i, 'up')}>↑</Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(i, 'down')}>↓</Button>
                            <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}><IconTrash size={14} /></Button>
                        </div>
                    </div>
                ))}
                {safeItems.length === 0 && (
                    <div className='text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10'>
                        <p className='text-sm'>Playlist is empty</p>
                        <p className='text-xs opacity-50'>Use Cloudinary to add content</p>
                    </div>
                )}
            </div>
        </div>
    )
}
