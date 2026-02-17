import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconLayout, IconPlus, IconArrowRight, IconEye as Eye, IconSparkles, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { INSPIRATION_ITEMS, type InspirationItem } from './inspiration-data'
import { useState, useEffect, useRef, useCallback } from 'react'

interface TemplateSliderProps {
    templates: any[]
    isLoading: boolean
    isNewUser: boolean
}

export const TemplateSlider = ({ templates, isLoading }: TemplateSliderProps) => {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(1)
    const [isPaused, setIsPaused] = useState(false)
    const timeoutRef = useRef<any>(null)

    const displayItems = templates.length > 0 ? templates : INSPIRATION_ITEMS;
    const isShowingInspiration = templates.length === 0;

    const combinedItems = [
        ...displayItems.slice(0, 1),
        { isCTA: true },
        ...displayItems.slice(1)
    ];

    const nextSlide = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % combinedItems.length);
    }, [combinedItems.length]);

    const prevSlide = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);
    }, [combinedItems.length]);

    useEffect(() => {
        if (!isPaused) {
            timeoutRef.current = setInterval(nextSlide, 3000);
        }
        return () => {
            if (timeoutRef.current) clearInterval(timeoutRef.current);
        };
    }, [isPaused, nextSlide]);

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-hidden py-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[200px] w-[280px] md:w-[320px] flex-shrink-0 rounded-xl" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
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
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={prevSlide}>
                            <IconChevronLeft size={16} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={nextSlide}>
                            <IconChevronRight size={16} />
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary">
                        View All <IconArrowRight size={14} className="ml-2" />
                    </Button>
                </div>
            </div>

            <div
                className="relative h-[280px] flex items-center justify-center overflow-hidden w-full group/main"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div
                    className="flex gap-4 transition-transform duration-700 ease-out"
                    style={{
                        transform: `translateX(calc(-${activeIndex * (300 + 16)}px))`
                    }}
                >
                    {combinedItems.map((item: any, idx) => {
                        const isFocused = idx === activeIndex;
                        const id = item.id || item._id || `slider-item-${idx}`;

                        if (item.isCTA) {
                            return (
                                <Card
                                    key="cta-card"
                                    className={cn(
                                        "w-[300px] h-[220px] flex-shrink-0 transition-all duration-700 cursor-pointer border-2 border-dashed",
                                        isFocused
                                            ? "scale-110 z-20 border-primary/50 bg-primary/10 shadow-xl opacity-100"
                                            : "scale-90 z-10 border-primary/20 bg-primary/5 opacity-50 blur-[1px] hover:blur-0"
                                    )}
                                    onClick={() => isFocused ? navigate(`${Routes.TEMPLATES}?create=true`) : setActiveIndex(idx)}
                                >
                                    <CardContent className="h-full flex flex-col items-center justify-center text-center p-6 bg-transparent">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                            <IconPlus className="text-primary font-bold" size={24} />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">Create New</h3>
                                        <p className="text-[11px] text-muted-foreground mb-4">
                                            Design a custom layout from scratch.
                                        </p>
                                        {isFocused && (
                                            <Button size="sm" variant="default" className="gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                                                Open Editor <IconArrowRight size={14} />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        }

                        const isInspiration = 'previewUrl' in item;
                        let previewUrl = '';
                        let previewType: string = 'none';
                        let name = '';
                        let resolution = '';
                        let zones = 0;
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
                            screenName = screen.name;
                            if (screen.defaultContent) {
                                Object.values(screen.defaultContent).forEach((zone: any) => {
                                    if (previewUrl) return;
                                    if (zone.media?.[0]?.url) {
                                        previewUrl = zone.media[0].url;
                                        previewType = zone.media[0].type || 'image';
                                    }
                                });
                            }
                        }

                        return (
                            <Card
                                key={id}
                                className={cn(
                                    "w-[300px] h-[220px] flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none",
                                    isFocused
                                        ? "scale-110 z-20 shadow-2xl opacity-100"
                                        : "scale-90 z-10 opacity-50 blur-[1px] hover:blur-0 grayscale-[50%] hover:grayscale-0 shadow-lg"
                                )}
                                onClick={() => isFocused ? (isInspiration ? navigate(Routes.TEMPLATES) : navigate(`${Routes.TEMPLATES}?id=${id}`)) : setActiveIndex(idx)}
                            >
                                <CardContent className="p-0 h-full flex flex-col relative">
                                    {previewUrl ? (
                                        previewType === 'video' ? (
                                            <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop />
                                        ) : (
                                            <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                            <IconLayout size={48} className="text-primary/20" />
                                        </div>
                                    )}

                                    <div className={cn(
                                        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500",
                                        isFocused ? "opacity-100" : "opacity-60"
                                    )} />

                                    <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                        {screenName}
                                    </div>

                                    <div className="mt-auto p-5 relative z-10">
                                        <h3 className="text-white font-bold text-sm leading-tight drop-shadow-md">{name}</h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-white/60 text-[10px] uppercase font-medium">{resolution}</span>
                                            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
                                            <span className="text-white/60 text-[10px] font-medium">{zones} Zones</span>
                                        </div>
                                    </div>

                                    {isFocused && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 opacity-0 hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="sm" className="gap-2 shadow-xl backdrop-blur-md">
                                                <Eye size={14} /> Preview Layout
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center gap-2 pb-2">
                {combinedItems.map((_, idx) => (
                    <button
                        key={idx}
                        className={cn(
                            "h-1.5 transition-all rounded-full",
                            idx === activeIndex ? "w-8 bg-primary" : "w-1.5 bg-primary/20 hover:bg-primary/40"
                        )}
                        onClick={() => setActiveIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
}
