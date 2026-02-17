import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconLayout, IconArrowRight, IconEye as Eye, IconSparkles, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { INSPIRATION_ITEMS } from './inspiration-data'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface TemplateSliderProps {
    templates: any[]
    isLoading: boolean
    isNewUser: boolean
}

// Polished Cinematic Geometry (Smaller, more "settled" look)
const CARD_WIDTH = 340; // Reduced from 400
const GAP = 24; // Reduced from 32
const STEP = CARD_WIDTH + GAP;

export const TemplateSlider = ({ templates, isLoading }: TemplateSliderProps) => {
    const navigate = useNavigate()
    const [isPaused, setIsPaused] = useState(false)
    const [isHoveringCenter, setIsHoveringCenter] = useState(false)
    const timeoutRef = useRef<any>(null)

    // Inspiration Items Only (CTA removed per request)
    const baseItems = useMemo(() => {
        const items = templates && templates.length > 0 ? templates : INSPIRATION_ITEMS;
        return items.slice(0, 10);
    }, [templates]);

    const isShowingInspiration = !templates || templates.length === 0;

    // Triple buffer for infinite loop
    const infiniteItems = useMemo(() => [...baseItems, ...baseItems, ...baseItems], [baseItems]);

    // Start at middle set
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

    // Seamless jump
    useEffect(() => {
        if (activeIndex >= baseItems.length * 2) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(activeIndex - baseItems.length);
            }, 650);
            return () => clearTimeout(timer);
        }
        if (activeIndex < baseItems.length) {
            const timer = setTimeout(() => {
                setIsTransitioning(false);
                setActiveIndex(activeIndex + baseItems.length);
            }, 650);
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
            <div className="flex gap-6 items-center justify-center h-[380px] w-full overflow-hidden">
                <Skeleton className="h-[220px] w-[300px] rounded-3xl opacity-20" />
                <Skeleton className="h-[300px] w-[420px] rounded-3xl opacity-60" />
                <Skeleton className="h-[220px] w-[300px] rounded-3xl opacity-20" />
            </div>
        )
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black tracking-tight text-foreground/80 uppercase">
                        {isShowingInspiration ? "Explore Inspiration" : "Recent Showcase"}
                    </h2>
                    {isShowingInspiration && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary text-[9px] font-black px-3 py-1 rounded-full border border-primary/10 shadow-sm uppercase tracking-widest">
                            <IconSparkles size={10} />
                            Premium Selection
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary font-bold transition-colors text-[10px] uppercase tracking-tighter">
                        View Catalog <IconArrowRight size={12} className="ml-2" />
                    </Button>
                </div>
            </div>

            <div
                className="relative w-full group/main flex items-center justify-center select-none bg-transparent h-[380px]"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => { setIsPaused(false); setIsHoveringCenter(false); }}
            >
                {/* Manual Navigation Overlay (Left) */}
                <div className="absolute left-6 z-50 transition-all duration-300 opacity-0 group-hover/main:opacity-100 -translate-x-4 group-hover/main:translate-x-0">
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background/80 backdrop-blur-xl" onClick={handlePrev}>
                        <IconChevronLeft size={24} />
                    </Button>
                </div>

                {/* Manual Navigation Overlay (Right) */}
                <div className="absolute right-6 z-50 transition-all duration-300 opacity-0 group-hover/main:opacity-100 translate-x-4 group-hover/main:translate-x-0">
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background/80 backdrop-blur-xl" onClick={handleNext}>
                        <IconChevronRight size={24} />
                    </Button>
                </div>

                {/* Viewport - Shift container so activeIndex-th item is perfectly centered */}
                <div
                    className={cn(
                        "flex absolute items-center transition-transform duration-700 ease-in-out",
                        !isTransitioning && "transition-none"
                    )}
                    style={{
                        gap: `${GAP}px`,
                        transform: `translateX(calc(50% - ${activeIndex * STEP + CARD_WIDTH / 2}px))`
                    }}
                >
                    {infiniteItems.map((item: any, idx) => {
                        const isFocused = idx === activeIndex;
                        const isVisible = Math.abs(idx - activeIndex) <= 2;
                        const id = item.id || item._id || `item-${idx}`;

                        if (!isVisible) return <div key={`spacer-${idx}`} style={{ width: CARD_WIDTH }} className="flex-shrink-0" />;

                        const previewUrl = item.previewUrl || (item.templateId?.previewUrl);
                        const name = item.name || (item.templateId?.name);
                        const category = item.category || (item.templateId?.category || 'Theme');
                        const resolution = item.resolution || (item.templateId?.resolution || '1920x1080');
                        const zones = 4;

                        return (
                            <Card
                                key={`${id}-${idx}`}
                                className={cn(
                                    "flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none relative group/card rounded-[1.5rem] bg-muted shadow-lg",
                                    isFocused ? "z-30 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] scale-[1.25]" : "z-10 scale-100"
                                )}
                                style={{ width: `${CARD_WIDTH}px`, height: `240px` }}
                                onMouseEnter={() => isFocused && setIsHoveringCenter(true)}
                                onMouseLeave={() => isFocused && setIsHoveringCenter(false)}
                                onClick={() => isFocused ? navigate(Routes.TEMPLATES) : setActiveIndex(idx)}
                            >
                                <CardContent className="p-0 h-full flex flex-col relative overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] group-hover/card:scale-110" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                            <IconLayout size={40} className="text-primary/10" />
                                        </div>
                                    )}

                                    {/* Content Overlay */}
                                    <div className={cn(
                                        "absolute inset-0 transition-all duration-700",
                                        isFocused
                                            ? "bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100"
                                            : "bg-black/10 opacity-30 group-hover/card:opacity-50"
                                    )} />

                                    {/* Persistent Name Label (Always on center focus) */}
                                    <div className={cn(
                                        "absolute inset-0 p-6 flex flex-col justify-end transition-all duration-500",
                                        isFocused ? "opacity-100" : "opacity-0"
                                    )}>
                                        <div className={cn(
                                            "transition-all duration-500 transform",
                                            isHoveringCenter ? "-translate-y-24" : "translate-y-0"
                                        )}>
                                            <div className="inline-block bg-primary px-2 py-0.5 rounded-[4px] text-[8px] font-black text-white uppercase tracking-widest mb-2 shadow-lg">
                                                {category}
                                            </div>
                                            <h3 className="text-white font-black text-xl leading-tight drop-shadow-2xl tracking-tight max-w-[80%]">{name}</h3>
                                        </div>
                                    </div>

                                    {/* Hover-Only Metadata (Center card only) */}
                                    {isFocused && (
                                        <div className={cn(
                                            "absolute bottom-0 left-0 w-full p-6 space-y-3 transition-all duration-500 transform",
                                            isHoveringCenter ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/10 backdrop-blur-xl px-2 py-0.5 rounded border border-white/20">
                                                    <span className="text-white font-black text-[8px] uppercase">{resolution}</span>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-xl px-2 py-0.5 rounded border border-white/20">
                                                    <span className="text-white font-black text-[8px] uppercase">{zones} Zones</span>
                                                </div>
                                            </div>
                                            <Button variant="default" size="sm" className="w-full h-8 gap-2 font-black text-[9px] uppercase tracking-tighter shadow-2xl bg-white text-black border-0 rounded-lg hover:scale-[1.02] transition-transform">
                                                <Eye size={12} /> Preview Concept
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Minimal Track */}
            <div className="flex justify-center items-center py-2">
                <div className="flex bg-muted/5 rounded-full p-1.5 gap-2 backdrop-blur-sm border border-muted-foreground/5">
                    {baseItems.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "transition-all duration-500 rounded-full",
                                (activeIndex % baseItems.length) === idx
                                    ? "w-8 h-1 bg-primary/80"
                                    : "w-1 h-1 bg-muted-foreground/10"
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
