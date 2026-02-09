import { useState } from 'react'
import { Button } from '@/components/custom/button'
import { IconPlus, IconTrash, IconPhoto, IconMovie, IconTrashX, IconPlayerPlay, IconArrowsSort, IconExternalLink } from '@tabler/icons-react'
import { toast } from '@/components/ui/use-toast'
import { apiService } from '@/api'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

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
    const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'clear', index?: number } | null>(null)
    const safeItems = items || []

    const handleAddItems = (assets: any[]) => {
        const validItems: PlaylistItem[] = [];
        let rejectedCount = 0;
        let rejectReason = '';

        assets.forEach(asset => {
            const url = asset.secure_url;
            if (!url) return;

            // Robust type detection
            let type: 'video' | 'image' = 'image';

            // Priority 1: Cloudinary resource_type
            if (asset.resource_type === 'video') {
                type = 'video';
            }
            // Priority 2: Extension check
            else if (url.match(/\.(mp4|webm|ogg|quicktime|mov|m4v)$/i)) {
                type = 'video';
            }
            // Priority 3: Cloudinary specific URL patterns for video
            else if (url.includes('/video/upload/')) {
                type = 'video';
            }

            // Validation check against Zone Type
            if (zone?.type !== 'mixed' && zone?.type !== type) {
                rejectedCount++;
                rejectReason = `This is a ${zone?.type || 'media'}-only zone`;
                return;
            }

            // Validation check against User Lock
            if (zone?.type === 'mixed' && mediaTypeLock !== 'both' && mediaTypeLock !== type) {
                rejectedCount++;
                rejectReason = `Locked to ${mediaTypeLock}s only`;
                return;
            }

            // Add with smart duration
            validItems.push({
                url,
                duration: type === 'video' ? (Math.round(Number(asset.duration)) || 10) : 10,
                type
            });
        });

        if (validItems.length > 0) {
            onChange([...safeItems, ...validItems]);
            toast({
                title: "Media Added",
                description: `Successfully added ${validItems.length} item(s) to the playlist.`
            });
        }

        if (rejectedCount > 0) {
            toast({
                title: `${rejectedCount} item(s) skipped`,
                description: rejectReason,
                variant: "destructive"
            });
        }
    }

    const removeItem = (idx: number) => {
        setConfirmAction({ type: 'remove', index: idx })
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
        newItems[idx] = { ...newItems[idx], duration: Math.max(1, newDuration) }
        onChange(newItems)
    }

    const clearAll = () => {
        setConfirmAction({ type: 'clear' })
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
                max_files: 15,
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
        <TooltipProvider>
            <div className='space-y-4'>
                {/* Header/Controls */}
                <div className='flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50 backdrop-blur-sm'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
                            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Playlist Controls</span>
                        </div>
                        {safeItems.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className='h-7 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors'
                                onClick={clearAll}
                            >
                                <IconTrashX size={14} className='mr-1' />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {/* Type Lock for Mixed Zones */}
                    {zone?.type === 'mixed' && (
                        <div className='flex items-center justify-between p-2 rounded bg-background/40 border border-border/40'>
                            <div className='flex items-center gap-2'>
                                <IconArrowsSort size={14} className='text-muted-foreground' />
                                <span className='text-[11px] font-medium'>Content Type Filter:</span>
                            </div>
                            <select
                                className="h-7 rounded border border-input bg-background px-2 py-0 text-xs focus:ring-1 focus:ring-primary outline-none transition-shadow"
                                value={mediaTypeLock}
                                onChange={(e) => setMediaTypeLock(e.target.value as any)}
                            >
                                <option value="both">Allow Both</option>
                                <option value="image">Images Only</option>
                                <option value="video">Videos Only</option>
                            </select>
                        </div>
                    )}

                    <div className="pt-1 space-y-3">
                        <Button
                            type="button"
                            variant="default"
                            className="w-full h-11 shadow-sm relative overflow-hidden group border-b-2 border-primary-foreground/10 active:border-b-0 active:translate-y-[1px] transition-all"
                            disabled={isProcessing}
                            onClick={handleOpenCloudinaryWidget}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <IconPlus className='mr-2 group-hover:scale-110 transition-transform' size={20} />
                            <span className='font-medium'>{isProcessing ? 'Initializing Widget...' : 'Add from Cloudinary'}</span>
                        </Button>

                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] text-muted-foreground/80 italic text-center leading-relaxed">
                                Select assets from your Media Library to add to this zone.
                            </p>
                            <a
                                href="https://console.cloudinary.com/console/media_library/folders/all"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/5 border border-transparent hover:border-primary/10"
                            >
                                <IconExternalLink size={12} />
                                Manage Files Externally
                            </a>
                        </div>
                    </div>
                </div>

                {/* Playlist List */}
                <div className='space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar'>
                    {safeItems.map((item, i) => (
                        <div
                            key={i}
                            className='flex items-center gap-3 p-2.5 border rounded-lg bg-card/60 hover:bg-muted/40 transition-all group relative border-border/40 hover:border-primary/20 shadow-sm hover:shadow-md'
                        >
                            <div className='absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab text-muted-foreground hidden sm:block'>
                                <IconArrowsSort size={12} />
                            </div>

                            {/* Thumbnail Container */}
                            <div
                                className='w-20 h-12 bg-black/90 rounded-md overflow-hidden flex-shrink-0 border border-border/80 relative transition-transform active:scale-95 cursor-zoom-in'
                                onClick={() => window.open(item.url, '_blank')}
                                title="Click to view full size"
                            >
                                {item.type === 'video' ? (
                                    <video src={item.url} className="w-full h-full object-cover opacity-90" muted />
                                ) : (
                                    <img src={item.url} className="w-full h-full object-cover opacity-90" alt="" />
                                )}
                                <div className='absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors'>
                                    {item.type === 'video' ?
                                        <IconMovie size={16} className="text-white drop-shadow-lg" /> :
                                        <IconPhoto size={16} className="text-white drop-shadow-lg" />
                                    }
                                </div>
                                <div className='absolute bottom-0 right-0 p-0.5 bg-black/60 rounded-tl flex items-center justify-center'>
                                    <IconPlayerPlay size={8} className='text-white' />
                                </div>
                            </div>

                            {/* Details Segment */}
                            <div className='flex-1 min-w-0 flex flex-col justify-center gap-1.5'>
                                <div className='flex items-center gap-2'>
                                    <span className='truncate text-[10px] font-mono font-medium text-foreground/80 tracking-tight'>
                                        {item.url.split('/').pop()?.split('?')[0] || 'Media Item'}
                                    </span>
                                    <span className={`text-[8px] px-1 rounded uppercase font-bold tracking-tighter ${item.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                        }`}>
                                        {item.type}
                                    </span>
                                </div>

                                <div className='flex items-center gap-3'>
                                    <div className='flex items-center gap-2 bg-muted/60 px-2 py-0.5 rounded border border-border/20'>
                                        <span className='text-[10px] text-muted-foreground font-medium'>Duration:</span>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                className="h-5 w-14 text-[10px] text-center border-none bg-transparent font-bold focus:ring-0 p-0 disabled:opacity-50"
                                                value={item.duration}
                                                min={1}
                                                disabled={item.type === 'video'}
                                                onChange={(e) => updateDuration(i, parseInt(e.target.value) || 1)}
                                            />
                                            <span className='text-[10px] text-muted-foreground/60 ml-0.5'>sec</span>
                                        </div>
                                    </div>
                                    {item.type === 'video' && (
                                        <span className="text-[9px] text-blue-500/80 font-medium flex items-center gap-1">
                                            <div className='w-1 h-1 rounded-full bg-blue-500 animate-pulse' />
                                            Native
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions Group */}
                            <div className='flex flex-col sm:flex-row gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 pr-1'>
                                <div className='flex sm:flex-col gap-1'>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className={`h-7 w-7 rounded-md ${i === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary/10 hover:text-primary transition-colors'}`}
                                                onClick={() => moveItem(i, 'up')}
                                                disabled={i === 0}
                                            >
                                                ↑
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left"><p className='text-xs'>Move Up</p></TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className={`h-7 w-7 rounded-md ${i === safeItems.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary/10 hover:text-primary transition-colors'}`}
                                                onClick={() => moveItem(i, 'down')}
                                                disabled={i === safeItems.length - 1}
                                            >
                                                ↓
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left"><p className='text-xs'>Move Down</p></TooltipContent>
                                    </Tooltip>
                                </div>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-full sm:h-auto sm:w-7 rounded-md shadow-sm hover:shadow-md transition-all active:scale-90"
                                            onClick={() => removeItem(i)}
                                        >
                                            <IconTrash size={15} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left"><p className='text-xs'>Remove Item</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    ))}

                    {safeItems.length === 0 && (
                        <div className='flex flex-col items-center justify-center py-12 px-4 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5 border-border/40 group/empty hover:bg-muted/10 transition-colors'>
                            <div className='w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4 group-hover/empty:scale-110 transition-transform'>
                                <IconPlus className='text-muted-foreground/40' size={32} />
                            </div>
                            <p className='text-sm font-semibold'>Empty Playlist</p>
                            <p className='text-[11px] opacity-60 text-center max-w-[200px] mt-1'>
                                Add your first media item from Cloudinary to get started.
                            </p>
                        </div>
                    )}
                </div>

                <ConfirmationDialog
                    isOpen={!!confirmAction}
                    title={confirmAction?.type === 'clear' ? "Clear Playlist" : "Remove Item"}
                    message={confirmAction?.type === 'clear'
                        ? "Are you sure you want to clear the entire playlist? This cannot be undone."
                        : "Are you sure you want to remove this item from the playlist?"}
                    variant="destructive"
                    confirmBtnText={confirmAction?.type === 'clear' ? "Clear All" : "Remove"}
                    onConfirm={() => {
                        if (confirmAction?.type === 'clear') {
                            onChange([])
                        } else if (confirmAction?.type === 'remove' && confirmAction.index !== undefined) {
                            onChange(safeItems.filter((_, i) => i !== confirmAction.index))
                        }
                        setConfirmAction(null)
                    }}
                    onClose={() => setConfirmAction(null)}
                />
            </div>
        </TooltipProvider>
    )
}
