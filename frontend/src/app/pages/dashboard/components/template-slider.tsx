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

// Cinematic 3-Item Layout (A B C)
// We want B to be the hero, A and C to be clear supporting items.
const SIDE_CARD_WIDTH = 320;
const CENTER_CARD_WIDTH = 520;
const GAP = 24;
const VIEWPORT_WIDTH = SIDE_CARD_WIDTH + GAP + CENTER_CARD_WIDTH + GAP + SIDE_CARD_WIDTH;

export const TemplateSlider = ({ templates, isLoading }: TemplateSliderProps) => {
    const navigate = useNavigate()
    const [isPaused, setIsPaused] = useState(false)
    const timeoutRef = useRef<any>(null)

    // Ensure we ALWAYS have at least 10 items to display
    const displayItems = useMemo(() => {
        const items = templates && templates.length > 0 ? templates : INSPIRATION_ITEMS;
        return items.slice(0, 10); // Keep it clean with 10 items
    }, [templates]);

    const isShowingInspiration = !templates || templates.length === 0;

    // Combined list: Item, Item, CTA, Item...
    const baseItems = useMemo(() => {
        const items = [...displayItems];
        // Insert CTA at a balanced position (index 2)
        if (items.length >= 2) {
            items.splice(2, 0, { isCTA: true } as any);
        } else {
            items.push({ isCTA: true } as any);
        }
        return items;
    }, [displayItems]);

    // Triple buffer for infinite seamless looping
    const infiniteItems = useMemo(() => [...baseItems, ...baseItems, ...baseItems], [baseItems]);

    // Start at the middle set of items
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

    // Infinite loop jump logic (seamless)
    useEffect(() => {
        if (activeIndex >= baseItems.length * 2) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(activeIndex - baseItems.length);
            }, 550); // Slightly faster than the transition duration
            return () => clearTimeout(timer);
        }
        if (activeIndex < baseItems.length) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(activeIndex + baseItems.length);
            }, 550);
            return () => clearTimeout(timer);
        }
    }, [activeIndex, baseItems.length]);

    useEffect(() => {
        if (!isPaused && !isLoading) {
            timeoutRef.current = setInterval(handleNext, 4500);
        }
        return () => {
            if (timeoutRef.current) clearInterval(timeoutRef.current);
        };
    }, [isPaused, handleNext, isLoading]);

    if (isLoading) {
        return (
            <div className="flex gap-4 items-center justify-center py-8 h-[360px] w-full overflow-hidden">
                <Skeleton className="h-[220px] w-[300px] rounded-2xl opacity-20 flex-shrink-0" />
                <Skeleton className="h-[300px] w-[480px] rounded-2xl opacity-60 flex-shrink-0" />
                <Skeleton className="h-[220px] w-[300px] rounded-2xl opacity-20 flex-shrink-0" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tight text-foreground/90">
                        {isShowingInspiration ? "Explore Inspiration" : "Recent Work"}
                    </h2>
                    {isShowingInspiration && (
                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full border border-primary/20 shadow-sm uppercase tracking-widest animate-pulse">
                            <IconSparkles size={10} />
                            Premium Selection
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-md hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background" onClick={handlePrev}>
                            <IconChevronLeft size={20} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-md hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background" onClick={handleNext}>
                            <IconChevronRight size={20} />
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary font-bold transition-colors text-xs uppercase tracking-tighter">
                        Full Catalog <IconArrowRight size={14} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* Main Stage Area */}
            <div
                className="relative h-[360px] w-full group/main overflow-hidden flex items-center justify-center select-none bg-transparent"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Viewport Mask for exactly 3 items */}
                <div className="relative h-full flex items-center justify-center overflow-visible" style={{ width: `${VIEWPORT_WIDTH}px` }}>
                    <div
                        className={cn(
                            "flex items-center h-full absolute transition-all duration-700 ease-in-out",
                            !isTransitioning && "transition-none"
                        )}
                        style={{
                            gap: `${GAP}px`,
                            // Shift to keep active item B in the perfectly centered spot
                            transform: `translateX(calc(-${activeIndex * (SIDE_CARD_WIDTH + GAP)}px + ${(SIDE_CARD_WIDTH + GAP) / 2}px + ${GAP / 2}px))`
                        }}
                    >
                        {infiniteItems.map((item: any, idx) => {
                            const isFocused = idx === activeIndex;
                            const isVisible = Math.abs(idx - activeIndex) <= 1; // Only A, B, C are visible
                            const id = item.id || item._id || `item-${idx}`;
                            const isCTA = 'isCTA' in item;

                            // Dynamic Dimensions for cinematic feel
                            const width = isFocused ? CENTER_CARD_WIDTH : SIDE_CARD_WIDTH;
                            const height = isFocused ? 320 : 220;

                            if (isCTA) {
                                return (
                                    <Card
                                        key={`cta-${idx}`}
                                        className={cn(
                                            "flex-shrink-0 transition-all duration-700 cursor-pointer border-2 border-dashed relative overflow-hidden",
                                            isFocused
                                                ? "z-30 border-primary bg-primary/5 shadow-2x-strong ring-8 ring-primary/5"
                                                : "z-10 border-primary/20 bg-primary/5 opacity-100 grayscale-[20%]"
                                        )}
                                        style={{ width: `${width}px`, height: `${height}px` }}
                                        onClick={() => isFocused ? navigate(`${Routes.TEMPLATES}?create=true`) : setActiveIndex(idx)}
                                    >
                                        <CardContent className="h-full flex flex-col items-center justify-center text-center p-12 bg-transparent">
                                            <div className={cn(
                                                "rounded-full bg-primary/20 flex items-center justify-center transition-all duration-700 shadow-inner",
                                                isFocused ? "h-20 w-20 mb-8 scale-110" : "h-14 w-14 mb-4"
                                            )}>
                                                <IconPlus className="text-primary font-black" size={isFocused ? 40 : 28} />
                                            </div>
                                            <h3 className={cn("font-black text-primary transition-all uppercase tracking-tighter", isFocused ? "text-3xl mb-3" : "text-xl mb-1")}>Create New</h3>
                                            {isFocused && (
                                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
                                                    <p className="text-[14px] text-muted-foreground mb-8 leading-relaxed max-w-[280px] font-medium">
                                                        Start with a blank canvas and build your brand's next digital experience.
                                                    </p>
                                                    <Button size="lg" variant="default" className="gap-2 px-10 shadow-2xl hover:scale-105 transition-transform font-black bg-primary text-white border-0 py-6 rounded-xl">
                                                        Open Creative Studio <IconArrowRight size={18} />
                                                    </Button>
                                                </div>
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
                                const zoneMedia = screen.defaultContent ? Object.values(screen.defaultContent)[0] as any : null;
                                if (zoneMedia?.media?.[0]?.url) {
                                    previewUrl = zoneMedia.media[0].url;
                                    previewType = zoneMedia.media[0].type || 'image';
                                }
                            }

                            return (
                                <Card
                                    key={`${id}-${idx}`}
                                    className={cn(
                                        "flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none relative group/card shadow-2xl",
                                        isFocused ? "z-30 shadow-[0_40px_80px_-12px_rgba(0,0,0,0.5)]" : "z-10 grayscale-0 brightness-100",
                                        !isVisible && "opacity-0" // Hide items beyond A, B, C for focus
                                    )}
                                    style={{ width: `${width}px`, height: `${height}px` }}
                                    onClick={() => isFocused ? (isInspiration ? navigate(Routes.TEMPLATES) : navigate(`${Routes.TEMPLATES}?id=${id}`)) : setActiveIndex(idx)}
                                >
                                    <CardContent className="p-0 h-full flex flex-col relative overflow-hidden bg-muted">
                                        {previewUrl ? (
                                            previewType === 'video' ? (
                                                <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop />
                                            ) : (
                                                <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover/card:scale-110" />
                                            )
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 transition-colors group-hover/card:bg-muted">
                                                <IconLayout size={80} className="text-primary/10" />
                                            </div>
                                        )}

                                        {/* Overlay - High contrast on B, subtle on A/C */}
                                        <div className={cn(
                                            "absolute inset-0 transition-all duration-700",
                                            isFocused
                                                ? "bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-100"
                                                : "bg-black/20 opacity-30 group-hover/card:opacity-50"
                                        )} />

                                        {/* Hero Label (Category) */}
                                        <div className={cn(
                                            "absolute top-6 left-6 z-20 transition-all duration-700",
                                            isFocused ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                                        )}>
                                            <div className="bg-primary/90 backdrop-blur-md shadow-2xl text-white text-[11px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em]">
                                                {category}
                                            </div>
                                        </div>

                                        {/* Cinematic Meta Data - B ONLY */}
                                        <div className={cn(
                                            "mt-auto p-8 relative z-10 transition-all duration-700 flex flex-col gap-4",
                                            isFocused ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                                        )}>
                                            <h3 className="text-white font-black text-3xl leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight">{name}</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-2xl px-3 py-1.5 rounded-lg border border-white/20 shadow-xl">
                                                    <span className="text-white font-black text-[11px] tracking-wide uppercase">{resolution}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-2xl px-3 py-1.5 rounded-lg border border-white/20 shadow-xl">
                                                    <span className="text-white font-black text-[11px] uppercase tracking-wide">{zones} Multi-Zones</span>
                                                </div>
                                            </div>

                                            <Button variant="default" size="lg" className="w-fit mt-4 gap-3 font-black text-xs uppercase tracking-tighter shadow-2x-strong hover:scale-110 transition-transform bg-white text-black border-0 py-6 px-8 rounded-xl">
                                                <Eye size={18} /> Explore Theme
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stage Controls */}
            <div className="flex justify-center items-center gap-4 pt-2">
                <div className="flex bg-muted/20 rounded-full p-2 gap-2 backdrop-blur-xl border border-white/5 shadow-inner">
                    {baseItems.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "transition-all duration-700 rounded-full",
                                (activeIndex % baseItems.length) === idx
                                    ? "w-12 h-2 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.6)]"
                                    : "w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/50"
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
