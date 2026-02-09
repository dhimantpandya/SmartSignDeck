import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconTrash, IconPlus } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useState } from 'react'

interface Schedule {
    name: string
    startTime: string
    endTime: string
    content: any
    daysOfWeek?: number[] // 0=Sun, 1=Mon...
    startDate?: string
    endDate?: string
    priority?: number
}

interface ScheduleManagerProps {
    schedules: Schedule[]
    activeTab: string
    onAddSchedule: () => void
    onRemoveSchedule: (index: number) => void
    onUpdateSchedule: (index: number, field: keyof Schedule, value: any) => void
    onTabChange: (value: string) => void
}

export default function ScheduleManager({
    schedules,
    activeTab,
    onAddSchedule,
    onRemoveSchedule,
    onUpdateSchedule,
    onTabChange
}: ScheduleManagerProps) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const currentScheduleIndex = activeTab === 'default' ? -1 : parseInt(activeTab.split('-')[1])

    return (
        <div className='flex flex-col flex-1 overflow-hidden'>
            <div className='flex items-center justify-between mb-2'>
                <h4 className='text-sm font-semibold uppercase text-muted-foreground'>Content Manager</h4>
                <Button size="sm" variant="outline" onClick={onAddSchedule}>
                    <IconPlus size={16} className='mr-2' /> Add Schedule
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className='w-full justify-start overflow-x-auto flex-shrink-0'>
                    <TabsTrigger value='default'>Default Playlist</TabsTrigger>
                    {schedules.map((s, i) => (
                        <TabsTrigger key={i} value={`schedule-${i}`}>
                            {s.name} ({s.startTime}-{s.endTime})
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Schedule Configuration Panel (Only if a schedule is active) */}
            {activeTab !== 'default' && schedules[currentScheduleIndex] && (
                <div className='mt-4 mb-2 rounded-lg bg-muted/30 p-4 animate-in fade-in slide-in-from-top-1 max-h-[400px] overflow-y-auto custom-scrollbar'>
                    <div className='grid gap-4 sm:grid-cols-3'>
                        <div className='grid gap-1'>
                            <Label className="text-xs">Slot Name</Label>
                            <Input
                                value={schedules[currentScheduleIndex].name}
                                onChange={(e) => onUpdateSchedule(currentScheduleIndex, 'name', e.target.value)}
                            />
                        </div>
                        <div className='grid gap-1'>
                            <Label className="text-xs">Start Time</Label>
                            <Input
                                type="time"
                                value={schedules[currentScheduleIndex].startTime}
                                onChange={(e) => onUpdateSchedule(currentScheduleIndex, 'startTime', e.target.value)}
                            />
                        </div>
                        <div className='grid gap-1'>
                            <Label className="text-xs">End Time</Label>
                            <Input
                                type="time"
                                value={schedules[currentScheduleIndex].endTime}
                                onChange={(e) => onUpdateSchedule(currentScheduleIndex, 'endTime', e.target.value)}
                            />
                        </div>

                        {/* Advanced Rules */}
                        <div className='grid gap-1'>
                            <Label className="text-xs">Start Date (Optional)</Label>
                            <Input
                                type="date"
                                value={schedules[currentScheduleIndex].startDate ? new Date(schedules[currentScheduleIndex].startDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => onUpdateSchedule(currentScheduleIndex, 'startDate', e.target.value)}
                            />
                        </div>
                        <div className='grid gap-1'>
                            <Label className="text-xs">End Date (Optional)</Label>
                            <Input
                                type="date"
                                value={schedules[currentScheduleIndex].endDate ? new Date(schedules[currentScheduleIndex].endDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => onUpdateSchedule(currentScheduleIndex, 'endDate', e.target.value)}
                            />
                        </div>
                        <div className='grid gap-1'>
                            <Label className="text-xs">Priority (Higher wins)</Label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={schedules[currentScheduleIndex].priority || 0}
                                onChange={(e) => onUpdateSchedule(currentScheduleIndex, 'priority', parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className='grid gap-1 sm:col-span-3'>
                            <Label className="text-xs">Active Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { val: 1, label: 'Mon' },
                                    { val: 2, label: 'Tue' },
                                    { val: 3, label: 'Wed' },
                                    { val: 4, label: 'Thu' },
                                    { val: 5, label: 'Fri' },
                                    { val: 6, label: 'Sat' },
                                    { val: 0, label: 'Sun' }
                                ].map((day) => {
                                    const isSelected = (schedules[currentScheduleIndex].daysOfWeek || []).includes(day.val)
                                    return (
                                        <Button
                                            key={day.val}
                                            size="sm"
                                            variant={isSelected ? "default" : "outline"}
                                            className={`h-7 w-9 p-0 text-[10px] uppercase transition-all duration-200 ${isSelected
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5'
                                                }`}
                                            title={isSelected ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                                            onClick={() => {
                                                const currentDays = schedules[currentScheduleIndex].daysOfWeek || []
                                                const newDays = isSelected
                                                    ? currentDays.filter(d => d !== day.val)
                                                    : [...currentDays, day.val]
                                                onUpdateSchedule(currentScheduleIndex, 'daysOfWeek', newDays)
                                            }}
                                        >
                                            {day.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            className='sm:col-span-3 w-fit mt-2'
                            onClick={() => setConfirmDelete(true)}
                        >
                            <IconTrash size={16} className='mr-2' /> Delete Slot
                        </Button>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                isOpen={confirmDelete}
                title="Delete Schedule Slot"
                message="Are you sure you want to delete this time slot? This content will no longer be scheduled for playback."
                variant="destructive"
                confirmBtnText="Delete Slot"
                onConfirm={() => {
                    onRemoveSchedule(currentScheduleIndex)
                    setConfirmDelete(false)
                }}
                onClose={() => setConfirmDelete(false)}
            />
        </div>
    )
}
