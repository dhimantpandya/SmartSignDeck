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

// Fixed dimensions for perfect 3-item display
const CARD_WIDTH = 340;
const GAP = 24;
const TOTAL_WIDTH = (CARD_WIDTH + GAP) * 3;

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
            timeoutRef.current = setInterval(handleNext, 4000); // Slower glide (4s) for better viewing
        }
        return () => {
            if (timeoutRef.current) clearInterval(timeoutRef.current);
        };
    }, [isPaused, handleNext]);

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-hidden py-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[240px] w-[340px] flex-shrink-0 rounded-xl" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">
                        {isShowingInspiration ? "Explore Inspiration" : "Your Recent Work"}
                    </h2>
                    {isShowingInspiration && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full border border-primary/20 shadow-sm">
                            <IconSparkles size={10} />
                            PREMIUM DESIGNS
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all" onClick={handlePrev}>
                            <IconChevronLeft size={18} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shadow-sm hover:bg-primary hover:text-white transition-all" onClick={handleNext}>
                            <IconChevronRight size={18} />
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(Routes.TEMPLATES)} className="text-muted-foreground hover:text-primary font-medium">
                        View All <IconArrowRight size={14} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* Carousel Perspective Container */}
            <div
                className="relative h-[300px] w-full group/main overflow-hidden flex items-center justify-center bg-transparent"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Fixed Width Mask for exactly 3 items (A B C) */}
                <div className="h-full flex items-center justify-center overflow-visible" style={{ width: `${TOTAL_WIDTH}px` }}>
                    <div
                        className={cn(
                            "flex gap-[24px] absolute items-center h-full",
                            isTransitioning ? "transition-transform duration-700 ease-in-out" : "transition-none"
                        )}
                        style={{
                            // Mathematically centered B item
                            transform: `translateX(calc(-${activeIndex * (CARD_WIDTH + GAP)}px + ${(CARD_WIDTH + GAP) / 2}px))`
                        }}
                    >
                        {infiniteItems.map((item: any, idx) => {
                            const isFocused = idx === activeIndex;
                            const id = item.id || item._id || `slider-item-${idx}`;

                            if (item.isCTA) {
                                return (
                                    <Card
                                        key={`cta-${idx}`}
                                        className={cn(
                                            "w-[340px] h-[240px] flex-shrink-0 transition-all duration-700 cursor-pointer border-2 border-dashed relative overflow-hidden",
                                            isFocused
                                                ? "scale-110 z-20 border-primary shadow-2xl bg-primary/5 opacity-100 ring-2 ring-primary/20"
                                                : "scale-90 z-10 border-primary/20 bg-primary/5 opacity-100" // No grayscale or blur
                                        )}
                                        onClick={() => isFocused ? navigate(`${Routes.TEMPLATES}?create=true`) : setActiveIndex(idx)}
                                    >
                                        <CardContent className="h-full flex flex-col items-center justify-center text-center p-8 bg-transparent">
                                            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-5 shadow-inner">
                                                <IconPlus className="text-primary font-bold" size={28} />
                                            </div>
                                            <h3 className="font-bold text-xl mb-2 text-primary">Create New</h3>
                                            <p className="text-[12px] text-muted-foreground mb-6 leading-relaxed max-w-[200px]">
                                                Design a custom layout from scratch for your screens.
                                            </p>
                                            {isFocused && (
                                                <Button size="sm" variant="default" className="gap-2 px-6 shadow-lg animate-in fade-in slide-in-from-bottom-3 hover:scale-105 transition-transform">
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
                            let zones = 4; // User requested 4 zones specifically
                            let screenName = '';

                            if (isInspiration) {
                                const insp = item as InspirationItem;
                                previewUrl = insp.previewUrl;
                                previewType = insp.previewType;
                                name = insp.name;
                                resolution = insp.resolution;
                                zones = 4;
                                screenName = insp.category;
                            } else {
                                const screen = item;
                                const template = item.templateId;
                                if (!template) return null;
                                name = template.name;
                                resolution = template.resolution;
                                zones = 4;
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
                                    key={`${id}-${idx}`}
                                    className={cn(
                                        "w-[340px] h-[240px] flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none relative group/card",
                                        isFocused
                                            ? "scale-110 z-20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] opacity-100"
                                            : "scale-90 z-10 opacity-100 shadow-xl" // Side items are as bright as B
                                    )}
                                    onClick={() => isFocused ? (isInspiration ? navigate(Routes.TEMPLATES) : navigate(`${Routes.TEMPLATES}?id=${id}`)) : setActiveIndex(idx)}
                                >
                                    <CardContent className="p-0 h-full flex flex-col relative overflow-hidden">
                                        {previewUrl ? (
                                            previewType === 'video' ? (
                                                <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop />
                                            ) : (
                                                <img src={previewUrl} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                                            )
                                        ) : (
                                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                                                <IconLayout size={64} className="text-primary/10" />
                                            </div>
                                        )}

                                        {/* Dynamic Gradient Overlay */}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-700",
                                            isFocused ? "opacity-100" : "opacity-80"
                                        )} />

                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4 bg-primary text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg z-20">
                                            {screenName}
                                        </div>

                                        {/* Main Content Info */}
                                        <div className="mt-auto p-6 relative z-10">
                                            <h3 className="text-white font-bold text-lg leading-tight mb-2 drop-shadow-lg">{name}</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
                                                    <span className="text-white font-bold text-[10px] tracking-tighter uppercase">{resolution}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/20">
                                                    <span className="text-white font-bold text-[10px] uppercase">{zones} Zones</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Overlay */}
                                        {isFocused && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                                <Button variant="secondary" size="default" className="gap-2 px-6 shadow-2xl font-bold text-sm bg-white text-black hover:bg-primary hover:text-white border-0 transition-all transform hover:scale-110">
                                                    <Eye size={18} /> Preview Experience
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Premium Indicator Track */}
            <div className="flex justify-center items-center gap-3 py-2">
                {baseItems.map((_, idx) => (
                    <button
                        key={idx}
                        className={cn(
                            "transition-all duration-500 rounded-full",
                            (activeIndex % baseItems.length) === idx
                                ? "w-10 h-1.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                : "w-2 h-2 bg-primary/20 hover:bg-primary/40"
                        )}
                        onClick={() => {
                            setIsTransitioning(true);
                            setActiveIndex(baseItems.length + idx);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
