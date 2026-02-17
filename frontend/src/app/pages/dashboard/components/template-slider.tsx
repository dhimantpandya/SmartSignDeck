import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconLayout, IconPlus, IconArrowRight, IconEye as Eye, IconSparkles, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { INSPIRATION_ITEMS, type InspirationItem } from './inspiration-data'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface TemplateSliderProps {
    templates: any[]
    isLoading: boolean
    isNewUser: boolean
}

// Dimensions for the Cinematic 3-Item Layout (A B C)
// B is the center, A/C are sides. Total width should fit dashboard.
const SIDE_CARD_WIDTH = 280;
const CENTER_CARD_WIDTH = 420;
const GAP = 32;
const TOTAL_VIEWPORT_WIDTH = SIDE_CARD_WIDTH + GAP + CENTER_CARD_WIDTH + GAP + SIDE_CARD_WIDTH;

export const TemplateSlider = ({ templates, isLoading }: TemplateSliderProps) => {
    const navigate = useNavigate()
    const [isPaused, setIsPaused] = useState(false)
    const timeoutRef = useRef<any>(null)

    const displayItems = templates.length > 0 ? templates : INSPIRATION_ITEMS;
    const isShowingInspiration = templates.length === 0;

    // Combined list with CTA precisely at index 2 (between items)
    const baseItems = useMemo(() => [
        ...displayItems.slice(0, 2),
        { isCTA: true },
        ...displayItems.slice(2)
    ], [displayItems]);

    // Triple buffer for infinite seamless looping
    const infiniteItems = useMemo(() => [...baseItems, ...baseItems, ...baseItems], [baseItems]);

    // Start at the middle set of items, centered on the first real item or CTA
    const [activeIndex, setActiveIndex] = useState(baseItems.length);
    const [isTransitioning, setIsTransitioning] = useState(true);

    const handleNext = useCallback(() => {
        setIsTransitioning(true);
        setActiveIndex((prev) => prev + 1);
    }, []);

    const handlePrev = useCallback(() => {
        setIsTransitioning(true);
        setActiveIndex((prev) => prev - 1);
    }, []);

    // Infinite loop jump logic
    useEffect(() => {
        if (activeIndex >= baseItems.length * 2) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(activeIndex - baseItems.length);
            }, 600);
            return () => clearTimeout(timer);
        }
        if (activeIndex < baseItems.length) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(activeIndex + baseItems.length);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [activeIndex, baseItems.length]);

    useEffect(() => {
        if (!isPaused) {
            timeoutRef.current = setInterval(handleNext, 4500); // 4.5s for cinematic feel
        }
        return () => {
            if (timeoutRef.current) clearInterval(timeoutRef.current);
        };
    }, [isPaused, handleNext]);

    if (isLoading) {
        return (
            <div className="flex gap-4 items-center justify-center py-4 h-[300px]">
                <Skeleton className="h-[200px] w-[280px] rounded-xl opacity-50" />
                <Skeleton className="h-[250px] w-[380px] rounded-xl" />
                <Skeleton className="h-[200px] w-[280px] rounded-xl opacity-50" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground/90">
                        {isShowingInspiration ? "Explore Inspiration" : "Recent Work"}
                    </h2>
                    {isShowingInspiration && (
                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-extrabold px-3 py-1 rounded-full border border-primary/20 shadow-sm uppercase tracking-wider">
                            <IconSparkles size={10} />
                            Premium Catalog
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all border-muted-foreground/20" onClick={handlePrev}>
                            <IconChevronLeft size={18} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all border-muted-foreground/20" onClick={handleNext}>
                            <IconChevronRight size={18} />
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary font-semibold transition-colors">
                        Catalog <IconArrowRight size={14} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* Cinematic Carousel Guard */}
            <div
                className="relative h-[340px] w-full group/main overflow-hidden flex items-center justify-center select-none"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Fixed Viewport exactly for 3 items (A B C) */}
                <div className="relative h-full flex items-center justify-center" style={{ width: `${TOTAL_VIEWPORT_WIDTH}px` }}>
                    <div
                        className={cn(
                            "flex items-center h-full absolute transition-all duration-700 ease-in-out",
                            !isTransitioning && "transition-none"
                        )}
                        style={{
                            gap: `${GAP}px`,
                            // Center B item: Shift left by activeIndex * (fixed step)
                            // The step is effectively (SIDE_CARD_WIDTH + GAP) if items were uniform, but they aren't.
                            // We use a simplified uniform step for calculations since they are positioned sequentially.
                            transform: `translateX(calc(-${activeIndex * (SIDE_CARD_WIDTH + GAP)}px + ${(SIDE_CARD_WIDTH + GAP) / 2}px + ${GAP / 2}px))`
                        }}
                    >
                        {infiniteItems.map((item: any, idx) => {
                            const isFocused = idx === activeIndex;
                            const id = item.id || item._id || `slider-item-${idx}`;
                            const isCTA = 'isCTA' in item;

                            // Scale and Size Logic
                            const width = isFocused ? CENTER_CARD_WIDTH : SIDE_CARD_WIDTH;
                            const height = isFocused ? 280 : 200;

                            if (isCTA) {
                                return (
                                    <Card
                                        key={`cta-${idx}`}
                                        className={cn(
                                            "flex-shrink-0 transition-all duration-700 cursor-pointer border-2 border-dashed relative overflow-hidden",
                                            isFocused
                                                ? "z-30 border-primary bg-primary/5 shadow-2xl ring-4 ring-primary/10"
                                                : "z-10 border-primary/20 bg-primary/5 opacity-100 hover:border-primary/40"
                                        )}
                                        style={{ width: `${width}px`, height: `${height}px` }}
                                        onClick={() => isFocused ? navigate(`${Routes.TEMPLATES}?create=true`) : setActiveIndex(idx)}
                                    >
                                        <CardContent className="h-full flex flex-col items-center justify-center text-center p-8 bg-transparent">
                                            <div className={cn(
                                                "rounded-full bg-primary/20 flex items-center justify-center transition-all duration-700",
                                                isFocused ? "h-16 w-16 mb-6 scale-110" : "h-12 w-12 mb-4"
                                            )}>
                                                <IconPlus className="text-primary font-bold" size={isFocused ? 32 : 24} />
                                            </div>
                                            <h3 className={cn("font-bold text-primary transition-all", isFocused ? "text-2xl mb-2" : "text-lg mb-1")}>Create New</h3>
                                            {isFocused && (
                                                <>
                                                    <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed max-w-[240px] animate-in fade-in slide-in-from-bottom-2">
                                                        Start with a blank canvas and build your brand's unique digital signage.
                                                    </p>
                                                    <Button size="default" variant="default" className="gap-2 px-8 shadow-xl animate-in fade-in zoom-in-95 hover:scale-105 transition-transform font-bold">
                                                        Open Studio <IconArrowRight size={16} />
                                                    </Button>
                                                </>
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
                            let zones = 4;
                            let category = '';

                            if (isInspiration) {
                                const insp = item as InspirationItem;
                                previewUrl = insp.previewUrl;
                                previewType = insp.previewType;
                                name = insp.name;
                                resolution = insp.resolution;
                                category = insp.category;
                            } else {
                                const screen = item;
                                const template = item.templateId;
                                if (!template) return null;
                                name = template.name;
                                resolution = template.resolution;
                                category = screen.name;
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
                                    key={`${id}-${idx}`}
                                    className={cn(
                                        "flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none relative group/card shadow-xl",
                                        isFocused ? "z-30 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)]" : "z-10 brightness-100"
                                    )}
                                    style={{ width: `${width}px`, height: `${height}px` }}
                                    onClick={() => isFocused ? (isInspiration ? navigate(Routes.TEMPLATES) : navigate(`${Routes.TEMPLATES}?id=${id}`)) : setActiveIndex(idx)}
                                >
                                    <CardContent className="p-0 h-full flex flex-col relative overflow-hidden bg-muted">
                                        {previewUrl ? (
                                            previewType === 'video' ? (
                                                <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop />
                                            ) : (
                                                <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110" />
                                            )
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <IconLayout size={64} className="text-primary/5" />
                                            </div>
                                        )}

                                        {/* Cinematic Contrast Overlay */}
                                        <div className={cn(
                                            "absolute inset-0 transition-opacity duration-700",
                                            isFocused
                                                ? "bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100"
                                                : "bg-black/20 opacity-40 group-hover/card:opacity-60"
                                        )} />

                                        {/* Info Badge (Category) - Smaller and top-left */}
                                        <div className={cn(
                                            "absolute top-4 left-4 z-20 transition-all duration-700",
                                            isFocused ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                                        )}>
                                            <div className="bg-primary shadow-lg text-white text-[9px] px-2.5 py-1 rounded-sm font-black uppercase tracking-widest">
                                                {category}
                                            </div>
                                        </div>

                                        {/* Focused Info (Title, Resolution, Zones) - Only for B */}
                                        <div className={cn(
                                            "mt-auto p-6 relative z-10 transition-all duration-700 flex flex-col gap-3",
                                            isFocused ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                                        )}>
                                            <h3 className="text-white font-black text-xl leading-tight drop-shadow-2xl">{name}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xl px-2.5 py-1 rounded border border-white/20">
                                                    <span className="text-white font-black text-[10px] tracking-tight uppercase">{resolution}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xl px-2.5 py-1 rounded border border-white/20">
                                                    <span className="text-white font-black text-[10px] uppercase">{zones} Zones</span>
                                                </div>
                                            </div>

                                            <Button variant="secondary" size="sm" className="w-fit mt-2 gap-2 font-black text-[11px] uppercase tracking-tighter shadow-2xl hover:scale-105 transition-transform bg-white text-black border-0">
                                                <Eye size={14} /> Preview
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="flex justify-center items-center gap-3 py-1">
                <div className="flex bg-muted/30 rounded-full p-1 gap-1.5 backdrop-blur-sm border border-muted-foreground/10">
                    {baseItems.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "transition-all duration-500 rounded-full",
                                (activeIndex % baseItems.length) === idx
                                    ? "w-8 h-1.5 bg-primary"
                                    : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            )}
                            onClick={() => {
                                setIsTransitioning(true);
                                setActiveIndex(baseItems.length + idx);
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
