import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconLayout, IconPlus, IconArrowRight, IconEye as Eye, IconSparkles } from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { INSPIRATION_ITEMS, type InspirationItem } from './inspiration-data'

interface TemplateSliderProps {
    templates: any[] // These are now "Active Screens" with template info
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

    // Use actual templates or fall back to high-quality inspiration items
    const displayItems = templates.length > 0 ? templates : INSPIRATION_ITEMS;
    const isShowingInspiration = templates.length === 0;

    // Create a combined list with the CTA card in the middle (index 1)
    const combinedItems = [...displayItems];
    // Insert "Create New" at index 1 (or end if list is short)
    const ctaIndex = Math.min(1, combinedItems.length);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">
                        {isShowingInspiration ? "Get Started with Inspiration" : "Your Recent Work"}
                    </h2>
                    {isShowingInspiration && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <IconSparkles size={10} />
                            PREMIUM DESIGNS
                        </div>
                    )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary">
                    View All Templates <IconArrowRight size={14} className="ml-2" />
                </Button>
            </div>

            <div className="relative group">
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory no-scrollbar custom-scrollbar scroll-smooth">
                    {/* Render first item if it exists */}
                    {combinedItems.slice(0, ctaIndex).map((item) => renderCard(item))}

                    {/* CTA Card positioned in the middle */}
                    <Card
                        className={cn(
                            "w-[260px] md:w-[300px] flex-shrink-0 snap-start border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer group/cta bg-primary/5 dark:bg-primary/10",
                            (isNewUser || isShowingInspiration) && "border-primary/40 bg-primary/10 ring-4 ring-primary/5"
                        )}
                        onClick={() => navigate(`${Routes.TEMPLATES}?create=true`)}
                    >
                        <CardContent className="h-[200px] flex flex-col items-center justify-center text-center p-6 bg-transparent">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover/cta:scale-110 transition-transform">
                                <IconPlus className="text-primary font-bold" size={24} />
                            </div>
                            <h3 className="font-bold text-lg mb-1">
                                Create New
                            </h3>
                            <p className="text-[11px] text-muted-foreground mb-4">
                                Design a custom layout from scratch for your screens.
                            </p>
                            <Button size="sm" variant="outline" className="gap-2 group-hover/cta:bg-primary group-hover/cta:text-primary-foreground transition-all">
                                Open Editor <IconArrowRight size={14} />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Render remaining items */}
                    {combinedItems.slice(ctaIndex).map((item) => renderCard(item))}

                    {/* Final spacer for padding-right simulation */}
                    <div className="w-1 flex-shrink-0" />
                </div>
            </div>
        </div>
    );

    function renderCard(item: any) {
        const isInspiration = 'previewUrl' in item;
        const id = item.id || item._id;

        // Extract content logic
        let previewUrl = '';
        let previewType: string = 'none';
        let name = '';
        let resolution = '';
        let zones = 0;
        let status = 'none';
        let screenName = '';

        if (isInspiration) {
            const insp = item as InspirationItem;
            previewUrl = insp.previewUrl;
            previewType = insp.previewType;
            name = insp.name;
            resolution = insp.resolution;
            zones = insp.zones;
            screenName = insp.category;
        } else {
            const screen = item;
            const template = item.templateId;
            if (!template) return null;

            name = template.name;
            resolution = template.resolution;
            zones = template.zones?.length || 0;
            status = screen.status;
            screenName = screen.name;

            if (screen.defaultContent) {
                Object.values(screen.defaultContent).forEach((zone: any) => {
                    if (previewUrl) return;
                    if (zone.sourceType === 'playlist' && zone.playlist?.[0]?.url) {
                        previewUrl = zone.playlist[0].url;
                        previewType = zone.playlist[0].type;
                    } else if (zone.media?.[0]?.url) {
                        previewUrl = zone.media[0].url;
                        previewType = zone.media[0].type || 'image';
                    }
                });
            }
        }

        return (
            <Card
                key={id}
                className="w-[260px] md:w-[300px] flex-shrink-0 snap-start overflow-hidden hover:shadow-lg transition-all cursor-pointer group/card border-primary/5"
                onClick={() => isInspiration ? navigate(Routes.TEMPLATES) : navigate(`${Routes.TEMPLATES}?id=${id}`)}
            >
                <CardContent className="p-0 h-[200px] flex flex-col">
                    {/* Preview Area */}
                    <div className="flex-1 bg-gradient-to-br from-muted/50 to-muted relative flex items-center justify-center overflow-hidden">
                        {previewUrl ? (
                            previewType === 'video' ? (
                                <video
                                    src={previewUrl}
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/card:scale-105 transition-transform duration-700"
                                    muted
                                    loop
                                    onMouseOver={(e) => e.currentTarget.play()}
                                    onMouseOut={(e) => {
                                        e.currentTarget.pause();
                                        e.currentTarget.currentTime = 0;
                                    }}
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt={name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/card:scale-105 transition-transform duration-700 font-sans"
                                />
                            )
                        ) : (
                            <IconLayout size={48} className="text-primary/20 group-hover/card:scale-110 transition-transform duration-500" />
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" className="scale-90 group-hover/card:scale-100 transition-transform">
                                <Eye size={14} className="mr-2" /> {isInspiration ? 'Preview Theme' : 'View Layout'}
                            </Button>
                        </div>

                        <div className={cn(
                            "absolute top-3 left-3 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg",
                            isInspiration ? "bg-primary/80" : "bg-black/60"
                        )}>
                            {!isInspiration && (
                                <div className={cn("h-1.5 w-1.5 rounded-full", status === 'online' ? "bg-green-400 animate-pulse" : "bg-white/50")} />
                            )}
                            {screenName}
                        </div>
                    </div>
                    {/* Info Area */}
                    <div className="p-4 bg-background border-t">
                        <h3 className="font-semibold text-sm truncate group-hover/card:text-primary transition-colors">{name}</h3>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{resolution}</p>
                            <p className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium">{zones} Zones</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
}
