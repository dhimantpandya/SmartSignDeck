import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/custom/button'
import {
    IconBold,
    IconItalic,
    IconAlignLeft,
    IconAlignCenter,
    IconAlignRight,
    IconLetterT,
    IconPalette,
    IconShadow,
    IconBoxMargin
} from '@tabler/icons-react'
import { Textarea } from '@/components/ui/textarea'

interface TextZoneStyle {
    fontFamily: string
    fontSize: number
    fontWeight: string
    fontStyle: string
    color: string
    textAlign: 'left' | 'center' | 'right' | 'start' | 'end'
    backgroundColor?: string
    strokeColor?: string
    strokeWidth?: number
    shadowColor?: string
    shadowBlur?: number
    shadowOffsetX?: number
    shadowOffsetY?: number
    padding?: number
    lineHeight?: number
}


interface ColorFrame {
    color: string
    duration: number
}

interface TextZoneContent {
    type: 'text'
    text: string
    style: TextZoneStyle
    colorSequence?: ColorFrame[]
}

interface TextZoneEditorProps {
    zone: any
    content: TextZoneContent | undefined
    onChange: (content: TextZoneContent) => void
}

const DEFAULT_STYLE: TextZoneStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 48,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: 'transparent',
    strokeColor: 'transparent',
    strokeWidth: 0,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    padding: 20,
    lineHeight: 1.2
}

export default function TextZoneEditor({ zone, content, onChange }: TextZoneEditorProps) {
    // Merge provided content with defaults to ensure all fields exist
    const [localContent, setLocalContent] = useState<TextZoneContent>({
        type: 'text',
        text: content?.text || 'Enter your text here...',
        style: { ...DEFAULT_STYLE, ...content?.style },
        colorSequence: content?.colorSequence || []
    })

    // Debounce updates to parent to avoid excessive re-renders/writes
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localContent)
        }, 300)
        return () => clearTimeout(timer)
    }, [localContent])

    const updateStyle = (key: keyof TextZoneStyle, value: any) => {
        setLocalContent(prev => ({
            ...prev,
            style: { ...prev.style, [key]: value }
        }))
    }

    const addColorFrame = () => {
        setLocalContent(prev => ({
            ...prev,
            colorSequence: [...(prev.colorSequence || []), { color: '#ffffff', duration: 5 }]
        }))
    }

    const removeColorFrame = (index: number) => {
        setLocalContent(prev => ({
            ...prev,
            colorSequence: prev.colorSequence?.filter((_, i) => i !== index)
        }))
    }

    const updateColorFrame = (index: number, key: keyof ColorFrame, value: any) => {
        setLocalContent(prev => ({
            ...prev,
            colorSequence: prev.colorSequence?.map((frame, i) =>
                i === index ? { ...frame, [key]: value } : frame
            )
        }))
    }

    return (
        <div className="space-y-6">
            {/* Text Input */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IconLetterT size={14} /> Content
                </Label>
                <Textarea
                    value={localContent.text}
                    onChange={(e) => setLocalContent(prev => ({ ...prev, text: e.target.value }))}
                    className="min-h-[100px] font-mono text-sm bg-muted/20 resize-y"
                    placeholder="Enter text to display..."
                />
            </div>

            {/* Typography Controls */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/10">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typography</Label>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[10px]">Font Family</Label>
                        <select
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                            value={localContent.style.fontFamily}
                            onChange={(e) => updateStyle('fontFamily', e.target.value)}
                        >
                            <option value="Inter, sans-serif">Inter (Sans)</option>
                            <option value="'Times New Roman', serif">Times New Roman (Serif)</option>
                            <option value="'Courier New', monospace">Courier New (Mono)</option>
                            <option value="Impact, sans-serif">Impact</option>
                            <option value="Arial, sans-serif">Arial</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px]">Font Size (px)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                className="h-8 text-xs"
                                value={localContent.style.fontSize}
                                onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                                min={10}
                            />
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={localContent.style.fontSize}
                                onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    {/* Style Toggles */}
                    <div className="flex bg-muted rounded-md p-1 gap-1">
                        <Button
                            variant={localContent.style.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStyle('fontWeight', localContent.style.fontWeight === 'bold' ? 'normal' : 'bold')}
                        >
                            <IconBold size={14} />
                        </Button>
                        <Button
                            variant={localContent.style.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStyle('fontStyle', localContent.style.fontStyle === 'italic' ? 'normal' : 'italic')}
                        >
                            <IconItalic size={14} />
                        </Button>
                    </div>

                    {/* Alignment Toggles */}
                    <div className="flex bg-muted rounded-md p-1 gap-1">
                        <Button
                            variant={localContent.style.textAlign === 'left' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStyle('textAlign', 'left')}
                        >
                            <IconAlignLeft size={14} />
                        </Button>
                        <Button
                            variant={localContent.style.textAlign === 'center' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStyle('textAlign', 'center')}
                        >
                            <IconAlignCenter size={14} />
                        </Button>
                        <Button
                            variant={localContent.style.textAlign === 'right' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateStyle('textAlign', 'right')}
                        >
                            <IconAlignRight size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Color & Appearance */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/10">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IconPalette size={14} /> Appearance
                </Label>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[10px]">Base Text Color</Label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={localContent.style.color}
                                onChange={(e) => updateStyle('color', e.target.value)}
                                className="h-8 w-8 rounded overflow-hidden border cursor-pointer p-0"
                            />
                            <span className="text-xs font-mono opacity-70 uppercase">{localContent.style.color}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px]">Background</Label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={localContent.style.backgroundColor === 'transparent' ? '#000000' : localContent.style.backgroundColor}
                                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                className="h-8 w-8 rounded overflow-hidden border cursor-pointer p-0"
                                disabled={localContent.style.backgroundColor === 'transparent'}
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="bg-transparent"
                                    checked={localContent.style.backgroundColor === 'transparent'}
                                    onChange={(e) => updateStyle('backgroundColor', e.target.checked ? 'transparent' : '#000000')}
                                />
                                <Label htmlFor="bg-transparent" className="text-[10px] cursor-pointer">Transparent</Label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Color Animation Sequence */}
                <div className="mt-4 pt-3 border-t border-dashed border-muted-foreground/20">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-[10px] font-semibold text-blue-400">Color Animation Loop</Label>
                        <Button size="sm" variant="outline" onClick={addColorFrame} className="h-6 text-[10px] px-2">
                            + Add Color Step
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {localContent.colorSequence?.map((frame, index) => (
                            <div key={index} className="flex items-center gap-2 bg-background p-1.5 rounded border">
                                <div className="text-[10px] text-muted-foreground w-4 text-center">{index + 1}</div>
                                <input
                                    type="color"
                                    value={frame.color}
                                    onChange={(e) => updateColorFrame(index, 'color', e.target.value)}
                                    className="h-6 w-6 rounded border cursor-pointer p-0"
                                />
                                <div className="flex items-center gap-1 flex-1">
                                    <Input
                                        type="number"
                                        value={frame.duration}
                                        onChange={(e) => updateColorFrame(index, 'duration', Number(e.target.value))}
                                        className="h-6 text-xs"
                                        min={1}
                                    />
                                    <span className="text-[10px] text-muted-foreground">sec</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => removeColorFrame(index)}
                                >
                                    <span className="sr-only">Delete</span>
                                    &times;
                                </Button>
                            </div>
                        ))}
                        {(!localContent.colorSequence || localContent.colorSequence.length === 0) && (
                            <div className="text-center py-2 text-[10px] text-muted-foreground italic bg-muted/30 rounded">
                                No animation. Text uses Base Color.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Effects (Shadow & Outline) */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/10">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IconShadow size={14} /> Effects
                </Label>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px]">Outline (Stroke)</Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={localContent.style.strokeColor === 'transparent' ? '#000000' : localContent.style.strokeColor}
                                onChange={(e) => updateStyle('strokeColor', e.target.value)}
                                className="h-6 w-6 rounded border cursor-pointer p-0 shrink-0"
                            />
                            <Input
                                type="number"
                                className="h-6 text-xs w-16"
                                placeholder="Width"
                                value={localContent.style.strokeWidth || 0}
                                onChange={(e) => updateStyle('strokeWidth', Number(e.target.value))}
                                min={0}
                            />
                            <span className="text-[10px] text-muted-foreground">px</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px]">Shadow Color</Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={localContent.style.shadowColor === 'transparent' ? '#000000' : localContent.style.shadowColor}
                                onChange={(e) => updateStyle('shadowColor', e.target.value)}
                                className="h-6 w-6 rounded border cursor-pointer p-0 shrink-0"
                            />
                            <Input
                                type="number"
                                className="h-6 text-xs w-16"
                                placeholder="Blur"
                                value={localContent.style.shadowBlur || 0}
                                onChange={(e) => updateStyle('shadowBlur', Number(e.target.value))}
                                min={0}
                            />
                            <span className="text-[10px] text-muted-foreground">Blur</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Box Model */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/10">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <IconBoxMargin size={14} /> Spacing
                </Label>
                <div className="flex gap-4">
                    <div className="space-y-1 flex-1">
                        <Label className="text-[10px]">Padding (px)</Label>
                        <Input
                            type="number"
                            className="h-8 text-xs"
                            value={localContent.style.padding}
                            onChange={(e) => updateStyle('padding', Number(e.target.value))}
                            min={0}
                        />
                    </div>
                    <div className="space-y-1 flex-1">
                        <Label className="text-[10px]">Line Height</Label>
                        <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-xs"
                            value={localContent.style.lineHeight}
                            onChange={(e) => updateStyle('lineHeight', Number(e.target.value))}
                            min={0.5}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
