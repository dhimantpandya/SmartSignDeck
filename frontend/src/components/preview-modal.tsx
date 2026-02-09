import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/custom/button'
import { VisualMap } from '@/components/visual-map'
import { IconLayout, IconArrowLeft } from '@tabler/icons-react'

interface PreviewModalProps {
    isOpen: boolean
    onClose: () => void
    template: any
}

export function PreviewModal({ isOpen, onClose, template }: PreviewModalProps) {
    if (!template) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-zinc-950 border-none ring-1 ring-white/10">
                <DialogHeader className="p-4 bg-muted/10 border-b border-white/5 flex flex-row items-center justify-between z-10 backdrop-blur-md">
                    <DialogTitle className="text-white flex items-center gap-2">
                        <IconLayout size={18} /> Layout Preview: {template.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="relative w-full overflow-y-auto bg-zinc-950 flex items-center justify-center p-6 min-h-[400px] max-h-[80vh] custom-scrollbar">
                    <div className="flex flex-col items-center gap-4 py-8">
                        {(() => {
                            const [w, h] = (template.resolution || '1920x1080').split('x').map(Number)
                            const isVertical = h > w
                            const previewWidth = isVertical ? 300 : 640 // Slightly smaller for better fit
                            return (
                                <>
                                    <VisualMap template={template} width={previewWidth} />
                                    {/* Resolution Label */}
                                    <div className="bg-black/50 text-white/50 text-[10px] px-2 py-1 rounded font-mono border border-white/10 uppercase tracking-tighter">
                                        {template.resolution} ({isVertical ? 'Portrait' : 'Landscape'})
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end">
                    <Button variant="outline" onClick={onClose} className="gap-2">
                        <IconArrowLeft size={16} /> Back
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
