import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconLayout, IconPlus, IconArrowRight, IconCopy } from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'
import { Template } from '@/api/template.service'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TemplateSliderProps {
    templates: Template[]
    isLoading: boolean
    isNewUser: boolean
}

export const TemplateSlider = ({ templates, isLoading, isNewUser }: TemplateSliderProps) => {
    const navigate = useNavigate()

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-hidden py-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[200px] w-[280px] md:w-[320px] flex-shrink-0 rounded-xl" />
                ))}
            </div>
        )
    }

    // Determine what to show: User templates OR Global inspiration
    const hasTemplates = templates.length > 0

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold tracking-tight">
                    {hasTemplates ? "Your Recent Work" : "Get Started with Inspiration"}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary">
                    View All Templates <IconArrowRight size={14} className="ml-2" />
                </Button>
            </div>

            <div className="relative group">
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory no-scrollbar custom-scrollbar scroll-smooth">
                    {/* CTA Card for New Users / Quick Create */}
                    <Card
                        className={cn(
                            "w-[260px] md:w-[300px] flex-shrink-0 snap-start border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer group/cta bg-primary/5 dark:bg-primary/10",
                            isNewUser && "border-primary/40 bg-primary/10"
                        )}
                        onClick={() => navigate(`${Routes.TEMPLATES}?create=true`)}
                    >
                        <CardContent className="h-[200px] flex flex-col items-center justify-center text-center p-6 bg-transparent">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover/cta:scale-110 transition-transform">
                                <IconPlus className="text-primary font-bold" size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-1">
                                {isNewUser ? "Create Your First" : "Create New"}
                            </h3>
                            <p className="text-[11px] text-muted-foreground mb-4">
                                {isNewUser
                                    ? "Start your digital signage journey with a beautiful layout."
                                    : "Design a custom layout from scratch for your screens."}
                            </p>
                            <Button size="sm" variant="outline" className="gap-2 group-hover/cta:bg-primary group-hover/cta:text-primary-foreground transition-all">
                                Open Editor <IconArrowRight size={14} />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Template Cards */}
                    {templates.map((template) => (
                        <Card
                            key={template.id || template._id}
                            className="w-[260px] md:w-[300px] flex-shrink-0 snap-start overflow-hidden hover:shadow-lg transition-all cursor-pointer group/card border-primary/5"
                            onClick={() => navigate(`${Routes.TEMPLATES}?id=${template.id || template._id}`)}
                        >
                            <CardContent className="p-0 h-[200px] flex flex-col">
                                {/* Preview Area */}
                                <div className="flex-1 bg-gradient-to-br from-muted/50 to-muted relative flex items-center justify-center overflow-hidden">
                                    <IconLayout size={48} className="text-primary/20 group-hover/card:scale-110 transition-transform duration-500" />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" className="scale-90 group-hover/card:scale-100 transition-transform">
                                            <IconCopy size={14} className="mr-2" /> Use This
                                        </Button>
                                    </div>

                                    {template.isPublic && (
                                        <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            Global
                                        </div>
                                    )}
                                </div>
                                {/* Info Area */}
                                <div className="p-4 bg-background border-t">
                                    <h3 className="font-semibold text-sm truncate group-hover/card:text-primary transition-colors">{template.name}</h3>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{template.resolution}</p>
                                        <p className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium">{template.zones?.length || 0} Zones</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Final spacer for padding-right simulation */}
                    <div className="w-1 flex-shrink-0" />
                </div>
            </div>
        </div>
    )
}
