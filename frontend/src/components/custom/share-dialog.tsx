import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/custom/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Globe, Lock, Users, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareDialogProps {
    isOpen: boolean
    onClose: () => void
    onShare: (visibility: 'private' | 'company' | 'public') => Promise<void>
    initialVisibility: 'private' | 'company' | 'public'
    title?: string
    description?: string
}

export function ShareDialog({
    isOpen,
    onClose,
    onShare,
    initialVisibility = 'private',
    title = 'Share Content',
    description = 'Choose who can see and use this content.',
}: ShareDialogProps) {
    const [visibility, setVisibility] = useState<'private' | 'company' | 'public'>(initialVisibility)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onShare(visibility)
            onClose()
        } catch (error) {
            console.error('Failed to share:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Share2 size={20} />
                        </div>
                        <DialogTitle className="text-xl">{title}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <RadioGroup
                        value={visibility}
                        onValueChange={(val: any) => setVisibility(val)}
                        className="grid gap-4"
                    >
                        <div className={cn(
                            "flex items-start gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 cursor-pointer",
                            visibility === 'private' ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                        )} onClick={() => setVisibility('private')}>
                            <RadioGroupItem value="private" id="private" className="mt-1" />
                            <div className="grid gap-1.5 cursor-pointer flex-1">
                                <Label htmlFor="private" className="font-bold flex items-center gap-2 cursor-pointer">
                                    <Lock size={14} className={visibility === 'private' ? "text-primary" : "text-muted-foreground"} />
                                    Private
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Only you can see and manage this content.
                                </p>
                            </div>
                        </div>

                        <div className={cn(
                            "flex items-start gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 cursor-pointer",
                            visibility === 'company' ? "border-amber-500 bg-amber-500/5 shadow-sm" : "border-border"
                        )} onClick={() => setVisibility('company')}>
                            <RadioGroupItem value="company" id="company" className="mt-1" />
                            <div className="grid gap-1.5 cursor-pointer flex-1">
                                <Label htmlFor="company" className="font-bold flex items-center gap-2 cursor-pointer">
                                    <Users size={14} className={visibility === 'company' ? "text-amber-500" : "text-muted-foreground"} />
                                    My Company
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Visible to everyone in your company. They can use it but cannot edit the original.
                                </p>
                            </div>
                        </div>

                        <div className={cn(
                            "flex items-start gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 cursor-pointer",
                            visibility === 'public' ? "border-blue-500 bg-blue-500/5 shadow-sm" : "border-border"
                        )} onClick={() => setVisibility('public')}>
                            <RadioGroupItem value="public" id="public" className="mt-1" />
                            <div className="grid gap-1.5 cursor-pointer flex-1">
                                <Label htmlFor="public" className="font-bold flex items-center gap-2 cursor-pointer">
                                    <Globe size={14} className={visibility === 'public' ? "text-blue-500" : "text-muted-foreground"} />
                                    Global Library
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Share with the entire SmartSignDeck community as a public template.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} loading={isSaving}>
                        Update Visibility
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
