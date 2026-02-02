import { useState, useEffect, useRef } from 'react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { templateService, Template } from '@/api/template.service'
import { apiService } from '@/api'
import { toast } from '@/components/ui/use-toast'
import { IconDeviceFloppy, IconArrowLeft, IconPlayerPlay } from '@tabler/icons-react'
import PlaylistEditor from './playlist-editor'
import ScheduleManager from './schedule-manager'
import AudienceRules from './audience-rules'
import TriggerRules from './trigger-rules'

interface ScreenFormProps {
    initialData?: any
    onCancel: () => void
}

interface PlaylistItem {
    url: string
    duration: number
    type: 'video' | 'image'
}

export default function ScreenForm({ initialData, onCancel }: ScreenFormProps) {
    const queryClient = useQueryClient()
    const [name, setName] = useState(initialData?.name || '')
    const [selectedTemplateId, setSelectedTemplateId] = useState(initialData?.templateId?.id || initialData?.templateId || '')
    const [location, setLocation] = useState(initialData?.location || '')
    const [defaultContent, setDefaultContent] = useState<any>(initialData?.defaultContent || {})
    const [schedules, setSchedules] = useState<any[]>(initialData?.schedules || [])
    const [audienceRules, setAudienceRules] = useState<any[]>(initialData?.audienceRules || [])
    const [triggerRules, setTriggerRules] = useState<any[]>(initialData?.triggerRules || [])
    const [activeTab, setActiveTab] = useState('default')
    const [isSaving, setIsSaving] = useState(false)
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

    // Visual Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mediaSectionRef = useRef<HTMLDivElement>(null)

    // Scroll to media section when a zone is selected
    useEffect(() => {
        if (selectedZoneId && mediaSectionRef.current) {
            mediaSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }, [selectedZoneId])


    // Fetch templates to choose from
    const { data: templatesData } = useQuery({
        queryKey: ['templates'],
        queryFn: () => templateService.getTemplates(),
    })

    const selectedTemplate = templatesData?.results.find((t: Template) => t.id === selectedTemplateId)

    // Initialize content object when template changes
    useEffect(() => {
        if (selectedTemplate) {
            // If editing existing screen, merge with existing content, else create new structure
            const newContent: any = { ...defaultContent }
            selectedTemplate.zones.forEach((zone: any) => {
                if (!newContent[zone.id]) {
                    // Backward compatibility: check if old format (src/value) exists, convert to playlist
                    if (initialData?.defaultContent?.[zone.id]?.src) {
                        newContent[zone.id] = {
                            type: zone.type,
                            playlist: [{
                                url: initialData.defaultContent[zone.id].src,
                                type: zone.type === 'video' ? 'video' : 'image',
                                duration: 10
                            }]
                        }
                    } else {
                        newContent[zone.id] = { type: zone.type, playlist: [] }
                    }
                } else if (!newContent[zone.id].playlist && newContent[zone.id].src) {
                    // Auto-migrate on load if needed
                    newContent[zone.id].playlist = [{
                        url: newContent[zone.id].src,
                        type: zone.type === 'video' ? 'video' : 'image',
                        duration: 10
                    }]
                }
            })
            setDefaultContent(newContent)
        }
    }, [selectedTemplateId, templatesData])

    // Draw Visual Map
    useEffect(() => {
        if (!selectedTemplate || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const SCALE = 0.25
        canvas.width = 1920 * SCALE
        canvas.height = 1080 * SCALE

        // Draw Loop
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Background
            ctx.fillStyle = '#111'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            selectedTemplate.zones.forEach((zone: any) => {
                const scaledX = zone.x * SCALE
                const scaledY = zone.y * SCALE
                const scaledW = zone.width * SCALE
                const scaledH = zone.height * SCALE

                let color = '#f59e0b'
                if (zone.type === 'video') color = '#3b82f6'
                if (zone.type === 'image') color = '#10b981'
                if (zone.type === 'mixed') color = '#8b5cf6'

                // Fill
                ctx.fillStyle = color + '44'
                ctx.fillRect(scaledX, scaledY, scaledW, scaledH)

                // Stroke (Highlight if selected)
                ctx.strokeStyle = selectedZoneId === zone.id ? '#fff' : color
                ctx.lineWidth = selectedZoneId === zone.id ? 3 : 1
                ctx.strokeRect(scaledX, scaledY, scaledW, scaledH)

                // Visual Indicator for Content
                const zoneContent = activeContent?.[zone.id]
                const hasPlaylist = zoneContent?.playlist && zoneContent.playlist.length > 0

                if (hasPlaylist) {
                    ctx.fillStyle = color
                    ctx.beginPath()
                    ctx.arc(scaledX + scaledW - 10, scaledY + 10, 4, 0, Math.PI * 2)
                    ctx.fill()

                    // Show count
                    ctx.font = 'bold 9px Inter, sans-serif'
                    ctx.fillStyle = '#fff'
                    ctx.fillText(`${zoneContent.playlist.length}`, scaledX + scaledW - 18, scaledY + 22)
                }

                // Label
                ctx.font = 'bold 10px Inter, sans-serif'
                ctx.fillStyle = '#fff'
                ctx.fillText(zone.id, scaledX + 4, scaledY + 12)
            })
        }

        draw()
    }, [selectedTemplate, selectedZoneId])

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!selectedTemplate || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        const SCALE = 0.25

        // Check for click in zones (reverse order for z-index, though mostly flat here)
        for (const zone of [...selectedTemplate.zones].reverse()) {
            const scaledX = zone.x * SCALE
            const scaledY = zone.y * SCALE
            const scaledW = zone.width * SCALE
            const scaledH = zone.height * SCALE

            if (clickX >= scaledX && clickX <= scaledX + scaledW &&
                clickY >= scaledY && clickY <= scaledY + scaledH) {
                setSelectedZoneId(zone.id)
                return
            }
        }

        // Deselect if clicked background
        setSelectedZoneId(null)
    }

    const handlePlaylistChange = (zoneId: string, newPlaylist: PlaylistItem[], tabId: string = activeTab) => {
        if (tabId === 'default') {
            setDefaultContent((prev: any) => ({
                ...prev,
                [zoneId]: { ...prev[zoneId], playlist: newPlaylist }
            }))
        } else if (tabId.startsWith('schedule-')) {
            const index = parseInt(tabId.split('-')[1])
            const newSchedules = [...schedules]
            newSchedules[index].content = {
                ...newSchedules[index].content,
                [zoneId]: { ...newSchedules[index].content[zoneId], playlist: newPlaylist }
            }
            setSchedules(newSchedules)
        } else if (tabId.startsWith('audience-')) {
            const index = parseInt(tabId.split('-')[1])
            const newRules = [...audienceRules]
            newRules[index].content = {
                ...newRules[index].content,
                [zoneId]: { ...newRules[index].content[zoneId], playlist: newPlaylist }
            }
            setAudienceRules(newRules)
        } else if (tabId.startsWith('trigger-')) {
            const index = parseInt(tabId.split('-')[1])
            const newRules = [...triggerRules]
            newRules[index].content = {
                ...newRules[index].content,
                [zoneId]: { ...newRules[index].content[zoneId], playlist: newPlaylist }
            }
            setTriggerRules(newRules)
        }
    }

    const addSchedule = () => {
        if (!selectedTemplate) return
        const newContent: any = {}
        selectedTemplate.zones.forEach((zone: any) => {
            newContent[zone.id] = { type: zone.type, playlist: [] }
        })

        setSchedules([...schedules, {
            name: `Schedule ${schedules.length + 1}`,
            startTime: '09:00',
            endTime: '17:00',
            content: newContent
        }])
        setActiveTab(`schedule-${schedules.length}`)
    }

    const removeSchedule = (index: number) => {
        const newSchedules = schedules.filter((_, i) => i !== index)
        setSchedules(newSchedules)
        setActiveTab('default')
    }

    const updateSchedule = (index: number, field: string, value: string) => {
        const newSchedules = [...schedules]
        newSchedules[index] = { ...newSchedules[index], [field]: value }
        setSchedules(newSchedules)
    }

    const addAudienceRule = () => {
        if (!selectedTemplate) return
        const newContent: any = {}
        selectedTemplate.zones.forEach((zone: any) => {
            newContent[zone.id] = { type: zone.type, playlist: [] }
        })
        setAudienceRules([...audienceRules, { ageRange: '', gender: '', content: newContent }])
        setActiveTab(`audience-${audienceRules.length}`)
    }

    const updateAudienceRule = (index: number, field: string, value: string) => {
        const newRules = [...audienceRules]
        newRules[index] = { ...newRules[index], [field]: value }
        setAudienceRules(newRules)
    }

    const removeAudienceRule = (index: number) => {
        setAudienceRules(audienceRules.filter((_, i) => i !== index))
        setActiveTab('default')
    }

    const addTriggerRule = () => {
        if (!selectedTemplate) return
        const newContent: any = {}
        selectedTemplate.zones.forEach((zone: any) => {
            newContent[zone.id] = { type: zone.type, playlist: [] }
        })
        setTriggerRules([...triggerRules, { type: 'weather', condition: '', content: newContent }])
        setActiveTab(`trigger-${triggerRules.length}`)
    }

    const updateTriggerRule = (index: number, field: string, value: string) => {
        const newRules = [...triggerRules]
        newRules[index] = { ...newRules[index], [field]: value }
        setTriggerRules(newRules)
    }

    const removeTriggerRule = (index: number) => {
        setTriggerRules(triggerRules.filter((_, i) => i !== index))
        setActiveTab('default')
    }

    const saveScreen = async () => {
        if (!name || !selectedTemplateId) {
            toast({ title: 'Please fill name and pick a template', variant: 'destructive' })
            return
        }

        setIsSaving(true)
        try {
            const payload = {
                name,
                location,
                templateId: selectedTemplateId,
                defaultContent,
                schedules,
                audienceRules,
                triggerRules,
                status: initialData?.status || 'offline'
            }

            const screenId = initialData?.id || initialData?._id
            if (screenId) {
                await apiService.put(`/v1/screens/${screenId}`, payload)
            } else {
                await apiService.post('/v1/screens', payload)
            }

            queryClient.invalidateQueries({ queryKey: ['screens'] })
            toast({ title: screenId ? 'Screen updated!' : 'Screen created!' })
            onCancel()
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    // Identify which content object to work with based on active tab
    const activeContent = activeTab === 'default'
        ? defaultContent
        : activeTab.startsWith('schedule-')
            ? schedules[parseInt(activeTab.split('-')[1])]?.content
            : activeTab.startsWith('audience-')
                ? audienceRules[parseInt(activeTab.split('-')[1])]?.content
                : triggerRules[parseInt(activeTab.split('-')[1])]?.content

    const renderMediaSection = () => (
        <div ref={mediaSectionRef} className={`flex flex-col gap-4 border-t pt-8 ${selectedZoneId ? 'border-none pt-0 pb-8 border-b' : ''}`}>
            <h3 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>Media Content per Zone</h3>

            <div className='flex flex-col gap-2'>
                <Label className='text-xs opacity-70'>Select a zone to edit its playlist:</Label>
                <div className='flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-2 border rounded-md p-2 bg-muted/5'>
                    {!selectedTemplate || selectedTemplate.zones.length === 0 ? (
                        <p className='text-xs text-muted-foreground italic p-2'>No zones in this template</p>
                    ) : (
                        selectedTemplate.zones.map((zone: any) => {
                            const zoneContent = activeContent?.[zone.id]
                            const hasPlaylist = zoneContent?.playlist && zoneContent.playlist.length > 0

                            return (
                                <div
                                    key={zone.id}
                                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer border ${selectedZoneId === zone.id
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-background hover:bg-muted border-transparent'
                                        }`}
                                    onClick={() => setSelectedZoneId(zone.id)}
                                >
                                    <div className='flex items-center gap-2 overflow-hidden'>
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${zone.type === 'video' ? 'bg-blue-500' :
                                            zone.type === 'image' ? 'bg-green-500' : 'bg-purple-500'
                                            }`} />
                                        <span className='truncate font-medium'>{zone.name || zone.id}</span>
                                        <span className='text-[10px] opacity-40 uppercase ml-1'>({zone.type})</span>
                                    </div>
                                    {hasPlaylist && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${selectedZoneId === zone.id ? 'bg-primary-foreground/20 text-white' : 'bg-primary/10 text-primary'
                                            }`}>
                                            {zoneContent.playlist.length}
                                        </span>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Active Zone Editor */}
            <div className='mt-2'>
                {selectedZoneId ? (
                    <div className='animate-in fade-in slide-in-from-bottom-2 border-2 border-primary/20 rounded-lg p-4 bg-primary/5'>
                        <div className='flex items-center justify-between mb-4 border-b pb-2'>
                            <h4 className='font-bold flex items-center gap-2 text-primary'>
                                Editing: {selectedZoneId}
                            </h4>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedZoneId(null)}>Close</Button>
                        </div>

                        {activeContent && activeContent[selectedZoneId] && (
                            <PlaylistEditor
                                zone={selectedTemplate?.zones.find((z: any) => z.id === selectedZoneId)}
                                items={activeContent[selectedZoneId].playlist || []}
                                onChange={(items) => handlePlaylistChange(selectedZoneId, items)}
                            />
                        )}
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5'>
                        <p className='text-sm'>No zone selected</p>
                        <p className='text-xs opacity-60'>Select a zone from the list above to manage media</p>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className='flex flex-col gap-6 lg:flex-row h-[calc(100vh-140px)]'>
            {/* Left: Configuration & Playlist */}
            <div className='flex flex-1 flex-col gap-6 overflow-hidden'>
                <Card className='flex flex-col p-6 shadow-md h-full overflow-hidden'>
                    <div className='mb-6 flex items-center gap-4 flex-shrink-0'>
                        <Button variant="ghost" size="icon" onClick={onCancel}><IconArrowLeft size={18} /></Button>
                        <h3 className='text-lg font-semibold'>{initialData ? 'Edit Screen' : 'New Screen'}</h3>
                        <div className='ml-auto flex gap-2'>
                            {(initialData?.id || initialData?._id) && (
                                <Button variant="outline" onClick={() => window.open(`/player/${initialData.id || initialData._id}`, '_blank')}>
                                    <IconPlayerPlay className='mr-2' size={18} />
                                    Preview
                                </Button>
                            )}
                            <Button loading={isSaving} onClick={saveScreen}>
                                <IconDeviceFloppy className='mr-2' size={18} />
                                Save
                            </Button>
                        </div>
                    </div>

                    <div className='grid gap-4 sm:grid-cols-3 flex-shrink-0 mb-6'>
                        <div className='grid gap-2'>
                            <Label htmlFor='name'>Screen Name</Label>
                            <Input id='name' placeholder='Lobby Display 1' value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='location'>Location (for Weather)</Label>
                            <Input id='location' placeholder='London, UK' value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
                        <div className='grid gap-2'>
                            <Label>Template</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                                disabled={!!initialData?.id}
                            >
                                <option value="" disabled>Select a template</option>
                                {templatesData?.results?.filter((t: Template) => t.id).map((t: Template) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.resolution})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedTemplate && (
                        <div className='mt-6 flex-1 overflow-y-auto pr-4 custom-scrollbar -mr-2'>
                            <div className='flex flex-col gap-8'>

                                {selectedZoneId && renderMediaSection()}

                                <ScheduleManager
                                    schedules={schedules}
                                    activeTab={activeTab}
                                    onAddSchedule={addSchedule}
                                    onRemoveSchedule={removeSchedule}
                                    onUpdateSchedule={updateSchedule}
                                    onTabChange={setActiveTab}
                                />

                                <AudienceRules
                                    rules={audienceRules}
                                    activeTab={activeTab}
                                    onAddRule={addAudienceRule}
                                    onRemoveRule={removeAudienceRule}
                                    onUpdateRule={updateAudienceRule}
                                    onTabChange={setActiveTab}
                                />

                                <TriggerRules
                                    rules={triggerRules}
                                    activeTab={activeTab}
                                    onAddRule={addTriggerRule}
                                    onRemoveRule={removeTriggerRule}
                                    onUpdateRule={updateTriggerRule}
                                    onTabChange={setActiveTab}
                                />

                                {!selectedZoneId && renderMediaSection()}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Right: Visual Map */}
            {selectedTemplate && (
                <div className='w-full lg:w-[480px]'>
                    <Card className='p-4 sticky top-6 bg-muted/30'>
                        <h4 className='mb-3 font-semibold'>Visual Map</h4>
                        <div className='rounded-lg bg-black p-2 shadow-inner'>
                            <div className='relative w-full bg-slate-900 overflow-hidden rounded border border-gray-800 flex justify-center'>
                                <canvas ref={canvasRef} onClick={handleCanvasClick} className="cursor-pointer" />
                            </div>
                        </div>
                        <p className='mt-2 text-xs text-muted-foreground text-center italic'>
                            Click on a zone above to select it.
                        </p>
                    </Card>
                </div>
            )}
        </div>
    )
}
