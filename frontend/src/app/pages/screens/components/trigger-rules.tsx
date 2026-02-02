import { Button } from '@/components/custom/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { IconTrash, IconPlus, IconCloudBolt } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TriggerRule {
    type: 'weather' | 'api' | 'daypart'
    condition: string
    content: any
}

interface TriggerRulesProps {
    rules: TriggerRule[]
    activeTab: string
    onAddRule: () => void
    onRemoveRule: (index: number) => void
    onUpdateRule: (index: number, field: keyof TriggerRule, value: string) => void
    onTabChange: (value: string) => void
}

export default function TriggerRules({
    rules,
    activeTab,
    onAddRule,
    onRemoveRule,
    onUpdateRule,
    onTabChange
}: TriggerRulesProps) {
    const currentRuleIndex = activeTab.startsWith('trigger-') ? parseInt(activeTab.split('-')[1]) : -1

    return (
        <div className='flex flex-col flex-1 overflow-hidden'>
            <div className='flex items-center justify-between mb-2'>
                <h4 className='text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2'>
                    <IconCloudBolt size={16} /> Trigger Rules
                </h4>
                <Button size="sm" variant="outline" onClick={onAddRule}>
                    <IconPlus size={16} className='mr-2' /> Add Rule
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className='w-full justify-start overflow-x-auto flex-shrink-0'>
                    <TabsTrigger value='default'>Default</TabsTrigger>
                    {rules.map((r, i) => (
                        <TabsTrigger key={i} value={`trigger-${i}`}>
                            Rule {i + 1} ({r.type}: {r.condition})
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {currentRuleIndex !== -1 && rules[currentRuleIndex] && (
                <div className='mt-4 mb-2 grid gap-4 rounded-lg bg-orange-500/10 border border-orange-500/20 p-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1'>
                    <div className='grid gap-1'>
                        <Label className="text-xs">Trigger Type</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={rules[currentRuleIndex].type}
                            onChange={(e) => onUpdateRule(currentRuleIndex, 'type', e.target.value as any)}
                        >
                            <option value="weather">Weather Condition</option>
                            <option value="daypart">Daypart (Morning/Night)</option>
                            <option value="api">Generic Webhook/API</option>
                        </select>
                    </div>
                    <div className='grid gap-1'>
                        <Label className="text-xs">Condition (Value)</Label>
                        {rules[currentRuleIndex].type === 'weather' ? (
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={rules[currentRuleIndex].condition}
                                onChange={(e) => onUpdateRule(currentRuleIndex, 'condition', e.target.value)}
                            >
                                <option value="">Select Condition</option>
                                <option value="Clear">Clear/Sunny</option>
                                <option value="Rain">Rainy</option>
                                <option value="Clouds">Cloudy</option>
                                <option value="Snow">Snowy</option>
                            </select>
                        ) : rules[currentRuleIndex].type === 'daypart' ? (
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={rules[currentRuleIndex].condition}
                                onChange={(e) => onUpdateRule(currentRuleIndex, 'condition', e.target.value)}
                            >
                                <option value="">Select Daypart</option>
                                <option value="morning">Morning (5am-12pm)</option>
                                <option value="afternoon">Afternoon (12pm-5pm)</option>
                                <option value="evening">Evening (5pm-9pm)</option>
                                <option value="night">Night (9pm-5am)</option>
                            </select>
                        ) : (
                            <Input
                                placeholder="e.g. holiday_mode_on"
                                value={rules[currentRuleIndex].condition}
                                onChange={(e) => onUpdateRule(currentRuleIndex, 'condition', e.target.value)}
                            />
                        )}
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className='sm:col-span-2 w-fit'
                        onClick={() => onRemoveRule(currentRuleIndex)}
                    >
                        <IconTrash size={16} className='mr-2' /> Delete Rule
                    </Button>
                </div>
            )}
        </div>
    )
}
