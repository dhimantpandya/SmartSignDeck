import { Button } from '@/components/custom/button'
import { Label } from '@/components/ui/label'
import { IconTrash, IconPlus, IconUserCircle } from '@tabler/icons-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AudienceRule {
    ageRange: string
    gender: string
    content: any
}

interface AudienceRulesProps {
    rules: AudienceRule[]
    activeTab: string
    onAddRule: () => void
    onRemoveRule: (index: number) => void
    onUpdateRule: (index: number, field: keyof AudienceRule, value: string) => void
    onTabChange: (value: string) => void
}

export default function AudienceRules({
    rules,
    activeTab,
    onAddRule,
    onRemoveRule,
    onUpdateRule,
    onTabChange
}: AudienceRulesProps) {
    const currentRuleIndex = activeTab.startsWith('audience-') ? parseInt(activeTab.split('-')[1]) : -1

    return (
        <div className='flex flex-col flex-1 overflow-hidden'>
            <div className='flex items-center justify-between mb-2'>
                <h4 className='text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2'>
                    <IconUserCircle size={16} /> Audience Rules
                </h4>
                <Button size="sm" variant="outline" onClick={onAddRule}>
                    <IconPlus size={16} className='mr-2' /> Add Rule
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                <TabsList className='w-full justify-start overflow-x-auto flex-shrink-0'>
                    <TabsTrigger value='default'>Default</TabsTrigger>
                    {rules.map((r, i) => (
                        <TabsTrigger key={i} value={`audience-${i}`}>
                            Rule {i + 1} ({r.gender || 'Any'}, {r.ageRange || 'Any'})
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {currentRuleIndex !== -1 && rules[currentRuleIndex] && (
                <div className='mt-4 mb-2 grid gap-4 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1'>
                    <div className='grid gap-1'>
                        <Label className="text-xs">Age Range</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={rules[currentRuleIndex].ageRange}
                            onChange={(e) => onUpdateRule(currentRuleIndex, 'ageRange', e.target.value)}
                        >
                            <option value="">Any Age</option>
                            <option value="0-10">0-10</option>
                            <option value="11-20">11-20</option>
                            <option value="21-30">21-30</option>
                            <option value="31-50">31-50</option>
                            <option value="51-100">51+</option>
                        </select>
                    </div>
                    <div className='grid gap-1'>
                        <Label className="text-xs">Gender</Label>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={rules[currentRuleIndex].gender}
                            onChange={(e) => onUpdateRule(currentRuleIndex, 'gender', e.target.value)}
                        >
                            <option value="">Any Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
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
