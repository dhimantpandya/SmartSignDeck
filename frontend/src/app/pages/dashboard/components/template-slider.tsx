import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconLayout, IconPlus, IconArrowRight, IconEye as Eye, IconSparkles, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
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

// 100% Reliable Cinematic Geometry
const CARD_WIDTH = 400; // Base width for all items
const GAP = 32;
const STEP = CARD_WIDTH + GAP;
const STAGE_HEIGHT = 450;

export const TemplateSlider = ({ templates, isLoading }: TemplateSliderProps) => {
    const navigate = useNavigate()
    const [isPaused, setIsPaused] = useState(false)
    const timeoutRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Ensure we have exactly 10 base items
    const displayItems = useMemo(() => {
        const items = templates && templates.length > 0 ? templates : INSPIRATION_ITEMS;
        return items.slice(0, 10);
    }, [templates]);

    const isShowingInspiration = !templates || templates.length === 0;

    // Combined list: Items + CTA
    const baseItems = useMemo(() => {
        const items = [...displayItems];
        if (items.length >= 2) items.splice(2, 0, { isCTA: true } as any);
        else items.push({ isCTA: true } as any);
        return items;
    }, [displayItems]);

    // Triple buffer for infinite loop
    const infiniteItems = useMemo(() => [...baseItems, ...baseItems, ...baseItems], [baseItems]);

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
            <div className="flex gap-8 items-center justify-center h-[STAGE_HEIGHT] w-full overflow-hidden">
                <Skeleton className="h-[260px] w-[340px] rounded-3xl opacity-20" />
                <Skeleton className="h-[340px] w-[500px] rounded-3xl opacity-60" />
                <Skeleton className="h-[260px] w-[340px] rounded-3xl opacity-20" />
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tighter text-foreground/80 lowercase">
                        {isShowingInspiration ? "Explore Inspiration" : "Recent Work"}
                    </h2>
                    {isShowingInspiration && (
                        <div className="flex items-center gap-2 bg-primary/20 text-primary text-[10px] font-black px-4 py-1.5 rounded-full border border-primary/20 shadow-sm uppercase tracking-[0.2em] animate-pulse">
                            <IconSparkles size={12} />
                            Premium Catalog
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-xl hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background/50 backdrop-blur-md" onClick={handlePrev}>
                            <IconChevronLeft size={24} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-xl hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background/50 backdrop-blur-md" onClick={handleNext}>
                            <IconChevronRight size={24} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stage Guard - Mathematically centered and always visible */}
            <div
                className="relative w-full group/main overflow-hidden flex items-center justify-center select-none bg-transparent h-[450px]"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* The "Film Strip" */}
                <div
                    ref={containerRef}
                    className={cn(
                        "flex absolute items-center transition-transform duration-700 ease-in-out",
                        !isTransitioning && "transition-none"
                    )}
                    style={{
                        gap: `${GAP}px`,
                        // Math: shift container so activeIndex-th item is perfectly centered in the window
                        // (WindowCenter - (itemIndex * step + itemWidth / 2))
                        transform: `translateX(calc(50% - ${activeIndex * STEP + CARD_WIDTH / 2}px))`
                    }}
                >
                    {infiniteItems.map((item: any, idx) => {
                        const isFocused = idx === activeIndex;
                        const isVisible = Math.abs(idx - activeIndex) <= 2; // Keep 5 items rendered for smooth edge transitions
                        const isSide = Math.abs(idx - activeIndex) === 1;
                        const id = item.id || item._id || `item-${idx}`;
                        const isCTA = 'isCTA' in item;

                        if (!isVisible) return <div key={`spacer-${idx}`} style={{ width: CARD_WIDTH }} className="flex-shrink-0" />;

                        if (isCTA) {
                            return (
                                <Card
                                    key={`cta-${idx}`}
                                    className={cn(
                                        "flex-shrink-0 transition-all duration-700 cursor-pointer border-2 border-dashed relative overflow-hidden bg-primary/[0.03]",
                                        isFocused
                                            ? "z-30 border-primary shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] scale-[1.3] ring-[12px] ring-primary/5"
                                            : "z-10 border-primary/20 scale-100 opacity-100 hover:border-primary/40"
                                    )}
                                    style={{ width: `${CARD_WIDTH}px`, height: `280px` }}
                                    onClick={() => isFocused ? navigate(`${Routes.TEMPLATES}?create=true`) : setActiveIndex(idx)}
                                >
                                    <CardContent className="h-full flex flex-col items-center justify-center text-center p-12">
                                        <div className={cn(
                                            "rounded-full bg-primary/20 flex items-center justify-center transition-all duration-700 shadow-inner",
                                            isFocused ? "h-16 w-16 mb-6 scale-110" : "h-12 w-12 mb-4"
                                        )}>
                                            <IconPlus className="text-primary font-black" size={isFocused ? 32 : 20} />
                                        </div>
                                        <h3 className={cn("font-black text-primary transition-all uppercase tracking-tighter", isFocused ? "text-2xl mb-2" : "text-lg mb-1")}>Create New</h3>
                                        {isFocused && (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 flex flex-col items-center">
                                                <p className="text-[12px] text-muted-foreground mb-6 leading-tight max-w-[200px] font-medium">
                                                    Design your next professional display from scratch.
                                                </p>
                                                <Button size="sm" variant="default" className="gap-2 px-6 shadow-2xl font-black bg-primary text-white text-[11px] h-10 rounded-xl">
                                                    Studio Access <IconArrowRight size={14} />
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        }

                        const previewUrl = item.previewUrl || (item.templateId?.previewUrl);
                        const name = item.name || (item.templateId?.name);
                        const category = item.category || (item.templateId?.category || 'Signage');

                        return (
                            <Card
                                key={`${id}-${idx}`}
                                className={cn(
                                    "flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none relative group/card shadow-2xl bg-muted rounded-[2rem]",
                                    isFocused ? "z-30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] scale-[1.3]" : "z-10 scale-100",
                                    isSide ? "brightness-100" : "brightness-100" // Fully bright per request
                                )}
                                style={{ width: `${CARD_WIDTH}px`, height: `280px` }}
                                onClick={() => isFocused ? navigate(Routes.TEMPLATES) : setActiveIndex(idx)}
                            >
                                <CardContent className="p-0 h-full flex flex-col relative overflow-hidden">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] group-hover/card:scale-110" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                            <IconLayout size={80} className="text-primary/10" />
                                        </div>
                                    )}

                                    {/* Cinematic Highlight Overlay */}
                                    <div className={cn(
                                        "absolute inset-0 transition-opacity duration-700",
                                        isFocused
                                            ? "bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-100"
                                            : "bg-black/10 opacity-30 group-hover/card:opacity-50"
                                    )} />

                                    {/* Floating Category (on B only) */}
                                    {isFocused && (
                                        <div className="absolute top-6 left-6 z-20 animate-in fade-in slide-in-from-left-4 duration-700">
                                            <div className="bg-primary shadow-2xl text-white text-[9px] px-3 py-1 rounded-sm font-black uppercase tracking-widest">
                                                {category}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cinematic Info (on B only) */}
                                    <div className={cn(
                                        "mt-auto p-6 relative z-10 transition-all duration-700 flex flex-col gap-3",
                                        isFocused ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                                    )}>
                                        <h3 className="text-white font-black text-2xl leading-tight drop-shadow-2xl tracking-tighter">{name}</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 backdrop-blur-xl px-3 py-1 rounded-lg border border-white/20">
                                                <span className="text-white font-black text-[10px] uppercase tracking-tighter">1920x1080</span>
                                            </div>
                                            <div className="bg-white/20 backdrop-blur-xl px-3 py-1 rounded-lg border border-white/20">
                                                <span className="text-white font-black text-[10px] uppercase tracking-tighter">4 Zones</span>
                                            </div>
                                        </div>
                                        <Button variant="default" size="sm" className="w-fit mt-3 h-10 gap-2 font-black text-[10px] uppercase tracking-tighter shadow-2xl bg-white text-black border-0 px-6 rounded-xl hover:scale-110 active:scale-95 transition-transform">
                                            <Eye size={16} /> Preview Content
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Cinematic Track */}
            <div className="flex justify-center items-center py-4">
                <div className="flex bg-muted/10 rounded-full p-2 gap-2 backdrop-blur-sm border border-muted-foreground/10">
                    {baseItems.map((_, idx) => (
                        <button
                            key={idx}
                            className={cn(
                                "transition-all duration-700 rounded-full",
                                (activeIndex % baseItems.length) === idx
                                    ? "w-12 h-2 bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]"
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
