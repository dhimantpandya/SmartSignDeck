import { Button } from '@/components/custom/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconTrash, IconPlus } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Schedule {
    name: string
    startTime: string
    endTime: string
    content: any
}

interface ScheduleManagerProps {
    schedules: Schedule[]
    activeTab: string
    onAddSchedule: () => void
    onRemoveSchedule: (index: number) => void
    onUpdateSchedule: (index: number, field: keyof Schedule, value: string) => void
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
                <div className='mt-4 mb-2 grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-3 animate-in fade-in slide-in-from-top-1'>
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
                    <Button
                        variant="destructive"
                        size="sm"
                        className='sm:col-span-3 w-fit'
                        onClick={() => onRemoveSchedule(currentScheduleIndex)}
                    >
                        <IconTrash size={16} className='mr-2' /> Delete Slot
                    </Button>
                </div>
            )}
        </div>
    )
}
