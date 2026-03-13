import { useState } from 'react'
import { Button } from '@/components/custom/button'
import { IconPlus, IconTrash, IconPhoto, IconMovie, IconTrashX, IconPlayerPlay, IconArrowsSort } from '@tabler/icons-react'
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
    scrollRef?: React.RefObject<HTMLDivElement>
}

export default function PlaylistEditor({ zone, items, onChange, scrollRef }: PlaylistEditorProps) {
    const [mediaTypeLock, setMediaTypeLock] = useState<'image' | 'video' | 'both'>('both')
    const [isProcessing, setIsProcessing] = useState(false)
    const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'clear' | 'bulk_remove', index?: number } | null>(null)
    const [selectedIndices, setSelectedIndices] = useState<number[]>([])
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
            const zType = zone?.type?.toLowerCase() || 'mixed';
            if (zType !== 'mixed' && zType !== type) {
                rejectedCount++;
                rejectReason = `This is a ${zType || 'media'}-only zone`;
                return;
            }

            // Validation check against User Lock
            if (zType === 'mixed' && mediaTypeLock !== 'both' && mediaTypeLock !== type) {
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
            if (!window.cloudinary || !window.cloudinary.createUploadWidget) {
                throw new Error("Cloudinary SDK not loaded. Please refresh the page.")
            }

            // Get signature from backend
            const { signature, timestamp, cloud_name, api_key } = await apiService.get<any>('/v1/cloudinary/signature', {
                params: {
                    timestamp: Math.round(new Date().getTime() / 1000),
                    source: 'uw' // 🔑 Required for Upload Widget signature
                }
            })
            let isDoneClicked = false;
            let uploadedAssets: any[] = [];

            // Create and show widget
            // @ts-ignore
            const widget = window.cloudinary.createUploadWidget({
                cloudName: cloud_name,
                apiKey: api_key,
                uploadSignatureTimestamp: timestamp,
                uploadSignature: signature,
                multiple: true,
                maxFiles: 15,
                sources: ['local', 'url', 'camera'], // Restricted to reliable sources
                resourceType: 'auto',
                clientAllowedFormats: ['png', 'jpg', 'jpeg', 'mp4', 'mov', 'webm'],
                z_index: 9999,
                showAdvancedOptions: true,
                styles: {
                    palette: {
                        window: "#FFFFFF",
                        windowBorder: "#90A0B3",
                        tabIcon: "#0078FF",
                        menuIcons: "#5A616A",
                        textDark: "#000000",
                        textLight: "#FFFFFF",
                        link: "#0078FF",
                        action: "#FF620C",
                        inactiveTabIcon: "#0E2F5A",
                        error: "#F44235",
                        inProgress: "#0078FF",
                        complete: "#20B832",
                        sourceBg: "#E4EBF1"
                    }
                }
            }, (error: any, result: any) => {
                if (!error && result) {
                    if (result.event === "success") {
                        uploadedAssets.push(result.info);
                    }
                    if (result.event === "queues-end") {
                        isDoneClicked = true;
                    }
                    if (result.event === "close") {
                        // User closed the window.
                        // If they clicked Done (which triggers queues-end), add the items.
                        if (isDoneClicked && uploadedAssets.length > 0) {
                            handleAddItems(uploadedAssets);
                        }
                        uploadedAssets = []; // Reset local session
                        isDoneClicked = false;
                    }
                }
            })

            widget.open();

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
                <div ref={scrollRef} className='flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50 backdrop-blur-sm shadow-sm'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
                            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Playlist Controls</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            {safeItems.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 text-[10px] ${selectedIndices.length === safeItems.length ? 'bg-primary/10' : ''}`}
                                        onClick={() => {
                                            if (selectedIndices.length === safeItems.length) setSelectedIndices([])
                                            else setSelectedIndices(safeItems.map((_, i) => i))
                                        }}
                                    >
                                        {selectedIndices.length === safeItems.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    {selectedIndices.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className='h-7 text-[10px]'
                                            onClick={() => setConfirmAction({ type: 'bulk_remove' })}
                                        >
                                            Remove ({selectedIndices.length})
                                        </Button>
                                    )}
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className='h-7 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors'
                                onClick={clearAll}
                            >
                                <IconTrashX size={14} className='mr-1' />
                                Clear All
                            </Button>
                        </div>
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

                    <div className="pt-1 flex flex-col items-center gap-3">
                        <Button
                            type="button"
                            variant="default"
                            className="w-full max-w-sm h-11 shadow-sm relative overflow-hidden group border-b-2 border-primary-foreground/10 active:border-b-0 active:translate-y-[1px] transition-all"
                            disabled={isProcessing}
                            onClick={handleOpenCloudinaryWidget}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <IconPlus className='mr-2 group-hover:scale-110 transition-transform' size={20} />
                            <span className='font-medium'>{isProcessing ? 'Initializing Widget...' : 'Add from Cloudinary'}</span>
                        </Button>

                        <div className="flex flex-col items-center gap-1">
                            <p className="text-[10px] text-muted-foreground/80 italic text-center leading-relaxed">
                                Select assets from your Media Library to add to this zone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Playlist List */}
                <div className='space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar'>
                    {safeItems.map((item, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 p-2.5 border rounded-lg transition-all group relative shadow-sm hover:shadow-md ${
                                selectedIndices.includes(i) ? 'bg-primary/5 border-primary/40' : 'bg-card/60 border-border/40 hover:bg-muted/40 hover:border-primary/20'
                            }`}
                        >
                            {/* Checkbox for Selection */}
                            <div 
                                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                                    selectedIndices.includes(i) ? 'bg-primary border-primary' : 'bg-background border-border group-hover:border-primary/40'
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIndices(prev => 
                                        prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                                    )
                                }}
                            >
                                {selectedIndices.includes(i) && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50" />}
                            </div>

                            <div className='absolute left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab text-muted-foreground hidden sm:block'>
                                <IconArrowsSort size={12} />
                            </div>

                            {/* Thumbnail Container */}
                            <div
                                className='w-20 h-12 bg-black/90 rounded-md overflow-hidden flex-shrink-0 border border-border/80 relative transition-transform active:scale-95 cursor-zoom-in'
                                onClick={() => setPreviewUrl(item.url)}
                                title="Click to view full size"
                            >
                                <img 
                                    src={item.type === 'video' && item.url.includes('res.cloudinary.com') 
                                        ? item.url.replace(/\.[^/.]+$/, ".jpg").replace('/upload/', '/upload/w_300,q_auto/')
                                        : item.url} 
                                    className="w-full h-full object-cover opacity-90" 
                                    alt="" 
                                    crossOrigin="anonymous"
                                />
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
                    title={
                        confirmAction?.type === 'clear' ? "Clear Playlist" : 
                        confirmAction?.type === 'bulk_remove' ? "Remove Selected" : 
                        "Remove Item"
                    }
                    message={
                        confirmAction?.type === 'clear' ? "Are you sure you want to clear the entire playlist?" :
                        confirmAction?.type === 'bulk_remove' ? `Are you sure you want to remove ${selectedIndices.length} selected items?` :
                        "Are you sure you want to remove this item?"
                    }
                    variant="destructive"
                    confirmBtnText={
                        confirmAction?.type === 'clear' ? "Clear All" : 
                        confirmAction?.type === 'bulk_remove' ? "Remove Selected" : 
                        "Remove"
                    }
                    onConfirm={() => {
                        if (confirmAction?.type === 'clear') {
                            onChange([])
                            setSelectedIndices([])
                        } else if (confirmAction?.type === 'bulk_remove') {
                            const newItems = safeItems.filter((_, i) => !selectedIndices.includes(i))
                            onChange(newItems)
                            setSelectedIndices([])
                        } else if (confirmAction?.type === 'remove' && confirmAction.index !== undefined) {
                            const targetIdx = confirmAction.index;
                            onChange(safeItems.filter((_, i) => i !== targetIdx))
                            setSelectedIndices(prev => prev.filter(idx => idx !== targetIdx).map(idx => idx > targetIdx ? idx - 1 : idx))
                        }
                        setConfirmAction(null)
                    }}
                    onClose={() => setConfirmAction(null)}
                />

                {/* Full Screen Preview Modal */}
                {previewUrl && (
                    <div 
                        className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-300"
                        onClick={() => setPreviewUrl(null)}
                    >
                        <div className="absolute top-6 right-6 flex gap-4">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(previewUrl, '_blank');
                                }}
                            >
                                Open in New Tab
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-white hover:bg-white/10 rounded-full h-10 w-10 text-xl"
                                onClick={() => setPreviewUrl(null)}
                            >
                                ×
                            </Button>
                        </div>
                        
                        <div className="relative w-full h-full flex items-center justify-center">
                            {previewUrl.match(/\.(mp4|webm|ogg|mov)$/i) || previewUrl.includes('video/upload') ? (
                                <video 
                                    src={previewUrl} 
                                    className="max-w-full max-h-full rounded-lg shadow-2xl" 
                                    controls 
                                    autoPlay 
                                    onClick={(e) => e.stopPropagation()} 
                                />
                            ) : (
                                <img 
                                    src={previewUrl} 
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
                                    alt="Preview" 
                                    onClick={(e) => e.stopPropagation()} 
                                />
                            )}
                        </div>
                        
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium tracking-widest uppercase">
                            Click anywhere to close
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}
