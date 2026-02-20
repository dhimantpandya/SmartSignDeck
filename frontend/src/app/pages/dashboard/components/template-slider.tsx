import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
import { IconArrowRight, IconEye as Eye, IconSparkles, IconChevronLeft, IconChevronRight, IconDeviceTv } from '@tabler/icons-react'
import { Routes } from '@/utilities/routes'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { INSPIRATION_ITEMS } from './inspiration-data'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'

const VITE_API_URL = import.meta.env.VITE_API_URL || '';

const getFullUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Handle relative paths from backend
    const base = VITE_API_URL.replace(/\/v1\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface TemplateSliderProps {
    templates?: any[]
    isLoading: boolean
    isNewUser: boolean
}

// --- ROBUST PREVIEW COMPONENT ---
const SmartPreview = ({ url, type, name }: { url: string; type?: 'image' | 'video'; name: string }) => {
    const [hasError, setHasError] = useState(false);

    // If explicitly video or looks like video, render video
    const isVideo = type === 'video' || (url && url.match(/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i));

    if (isVideo && url) {
        return (
            <video
                key={url} // Force re-mount if URL changes
                src={getFullUrl(url)}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onError={() => {
                    console.error("Video preview failed to load:", url);
                    setHasError(true);
                }}
            />
        );
    }

    // Fallback placeholder if broken or missing
    if (!url || hasError) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40">
                <IconDeviceTv size={40} className="text-primary/10 mb-2" />
                <span className="text-[10px] font-bold uppercase text-white/20 tracking-wider">Preview Available Soon</span>
            </div>
        );
    }

    return (
        <img
            src={getFullUrl(url)}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] group-hover/card:scale-110"
            onError={() => setHasError(true)}
        />
    );
};

import { templateService } from '@/api/template.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const TemplateSlider = ({ templates, isLoading }: TemplateSliderProps) => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isPaused, setIsPaused] = useState(false)

    // --- RESPONSIVE DIMENSIONS ---
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    const CARD_WIDTH = isMobile ? 280 : (isTablet ? 300 : 340);
    const GAP = isMobile ? 16 : 24;
    const STEP = CARD_WIDTH + GAP;

    const bootstrapMutation = useMutation({
        mutationFn: (name: string) => templateService.bootstrapFromInspiration(name),
        onSuccess: () => {
            toast({
                title: "Template Group Created",
                description: "We've created a new group and 3 templates based on this inspiration. Redirecting to templates...",
            });
            queryClient.invalidateQueries({ queryKey: ['template-groups'] });
            setTimeout(() => navigate(Routes.TEMPLATES), 1500);
        },
        onError: (err: any) => {
            toast({
                title: "Bootstrap Failed",
                description: err.response?.data?.message || "Something went wrong while creating your templates.",
                variant: "destructive",
            });
        }
    });

    const [isHoveringCenter, setIsHoveringCenter] = useState(false)
    const timeoutRef = useRef<any>(null)

    // Default to 'showcase' only if user has 3+ screens, otherwise 'inspiration'
    const [sliderMode, setSliderMode] = useState<'inspiration' | 'showcase'>(
        templates && templates.length >= 3 ? 'showcase' : 'inspiration'
    );

    // Sync initial state if data loads later
    useEffect(() => {
        if (templates && templates.length >= 3) {
            // Auto-switch to showcase once data loads IF they have enough screens
            // but only if they haven't manually switched to inspiration already.
            // For now, let's keep it simple: if sliderMode is inspiration and they have 3+ screens, 
            // maybe we want to show their work. But the user complained about it jumping, 
            // so let's ONLY set it on the very first load or if they were empty before.
        } else if (templates && templates.length < 3) {
            // Force inspiration if they drop below 3 (e.g. deletion)
            setSliderMode('inspiration');
        }
    }, [templates]);


    // Determine items based on mode
    const baseItems: any[] = useMemo(() => {
        if (sliderMode === 'inspiration') {
            return INSPIRATION_ITEMS.slice(0, 10);
        }
        return templates && templates.length > 0 ? templates : [];
    }, [sliderMode, templates]);

    // Derived state for display
    const isShowingInspiration = sliderMode === 'inspiration';
    const isEmptyShowcase = sliderMode === 'showcase' && baseItems.length === 0;

    // Triple buffer for infinite loop (only if we have items)
    const infiniteItems = useMemo(() => {
        if (baseItems.length === 0) return [];
        // If we have very few items, triple buffering might still be small, 
        // but let's stick to the pattern.
        return [...baseItems, ...baseItems, ...baseItems];
    }, [baseItems]);

    // Start at middle set if we have items
    const [activeIndex, setActiveIndex] = useState(0);

    // Reset index when items change drastically (e.g. mode switch)
    useEffect(() => {
        if (baseItems.length > 0) {
            setActiveIndex(baseItems.length);
        } else {
            setActiveIndex(0);
        }
    }, [baseItems.length, sliderMode]);


    const [isTransitioning, setIsTransitioning] = useState(true);

    const handleNext = useCallback(() => {
        if (isEmptyShowcase) return;
        setIsTransitioning(true);
        setActiveIndex((prev) => prev + 1);
    }, [isEmptyShowcase]);

    const handlePrev = useCallback(() => {
        if (isEmptyShowcase) return;
        setIsTransitioning(true);
        setActiveIndex((prev) => prev - 1);
    }, [isEmptyShowcase]);

    // Seamless jump
    useEffect(() => {
        if (isEmptyShowcase || baseItems.length === 0) return;

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
    }, [activeIndex, baseItems.length, isEmptyShowcase]);

    useEffect(() => {
        if (!isPaused && !isLoading && !isEmptyShowcase && baseItems.length > 0) {
            timeoutRef.current = setInterval(handleNext, 4500);
        }
        return () => {
            if (timeoutRef.current) clearInterval(timeoutRef.current);
        };
    }, [isPaused, handleNext, isLoading, isEmptyShowcase, baseItems.length]);

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 gap-4">
                <div className="flex flex-col gap-1">
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
                        {!isShowingInspiration && (
                            <div className="flex items-center gap-2 bg-muted text-muted-foreground text-[9px] font-black px-3 py-1 rounded-full border border-border shadow-sm uppercase tracking-widest">
                                <IconDeviceTv size={10} />
                                {baseItems.length} Items
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2 relative group-toggle">
                        <span
                            className={cn("text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors",
                                sliderMode === 'showcase' ? "text-muted-foreground" : "text-primary"
                            )}
                            onClick={() => setSliderMode('inspiration')}
                        >
                            Inspiration
                        </span>

                        <div className="relative flex items-center group/lock">
                            <Switch
                                checked={sliderMode === 'showcase'}
                                onCheckedChange={(checked) => {
                                    if (checked && (!templates || templates.length < 3)) {
                                        toast({
                                            title: "Section Locked",
                                            description: `You need at least 3 screens to unlock 'My Work'. You currently have ${templates?.length || 0}.`,
                                        });
                                        return;
                                    }
                                    setSliderMode(checked ? 'showcase' : 'inspiration');
                                }}
                                className="data-[state=checked]:bg-primary"
                                disabled={!templates || templates.length < 3}
                            />
                            {(!templates || templates.length < 3) && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-3 py-1.5 rounded-md opacity-0 group-hover/lock:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none uppercase font-bold tracking-wider border border-white/10 shadow-xl translate-y-2 group-hover/lock:translate-y-0 z-[100]">
                                    <div className="relative">
                                        Create 3 screens to access My Work
                                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <span
                            className={cn("text-xs font-bold uppercase tracking-wider transition-colors",
                                (!templates || templates.length < 3) ? "text-muted-foreground/40 cursor-not-allowed" :
                                    (sliderMode === 'inspiration' ? "text-muted-foreground cursor-pointer" : "text-primary")
                            )}
                            onClick={() => {
                                if (templates && templates.length >= 3) {
                                    setSliderMode('showcase');
                                }
                            }}
                        >
                            My Work {(!templates || templates.length < 3) && "🔒"}
                        </span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => navigate(isShowingInspiration ? Routes.TEMPLATES : Routes.SCREENS)} className="hidden sm:flex text-muted-foreground hover:text-primary font-bold transition-colors text-[10px] uppercase tracking-tighter">
                        {isShowingInspiration ? "View Catalog" : "Manage Screens"} <IconArrowRight size={12} className="ml-2" />
                    </Button>
                </div>
            </div>

            <div
                className={cn(
                    "relative w-full group/main flex items-center justify-center select-none bg-transparent transition-all duration-300",
                    isMobile ? "h-[300px]" : "h-[380px]"
                )}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => { setIsPaused(false); setIsHoveringCenter(false); }}
            >
                {/* Empty State for My Work */}
                {isEmptyShowcase && (
                    <div className="flex flex-col items-center justify-center w-full h-full space-y-4 bg-muted/5 rounded-xl border-2 border-dashed border-muted">
                        <div className="p-4 bg-muted rounded-full">
                            <IconDeviceTv size={48} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-muted-foreground">No Active Screens Yet</h3>
                        <Button onClick={() => navigate(`${Routes.SCREENS}?create=true`)} variant="outline" className="gap-2">
                            Add Your First Screen <IconArrowRight size={14} />
                        </Button>
                    </div>
                )}


                {/* Manual Navigation Overlay (Left) */}
                {!isEmptyShowcase && (
                    <div className="absolute left-6 z-50 transition-all duration-300 opacity-0 group-hover/main:opacity-100 -translate-x-4 group-hover/main:translate-x-0">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background/80 backdrop-blur-xl" onClick={handlePrev}>
                            <IconChevronLeft size={24} />
                        </Button>
                    </div>
                )}

                {/* Manual Navigation Overlay (Right) */}
                {!isEmptyShowcase && (
                    <div className="absolute right-6 z-50 transition-all duration-300 opacity-0 group-hover/main:opacity-100 translate-x-4 group-hover/main:translate-x-0">
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all border-muted-foreground/10 bg-background/80 backdrop-blur-xl" onClick={handleNext}>
                            <IconChevronRight size={24} />
                        </Button>
                    </div>
                )}

                {/* Viewport - Shift container so activeIndex-th item is perfectly centered */}
                {!isEmptyShowcase && (
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

                            // Smart Preview Resolution
                            let previewUrl = item.previewUrl;
                            let previewType = item.previewType || 'image';

                            // If it's a screen, try to get template preview or search ALL zones for media
                            if (!isShowingInspiration) {
                                previewUrl = item.templateId?.previewUrl;

                                // Fallback: Search ALL zones for any available media
                                if (!previewUrl && item.defaultContent) {
                                    const zonesWithMedia = Object.values(item.defaultContent).filter((c: any) =>
                                        (c.playlist && c.playlist.length > 0) || c.src
                                    );

                                    if (zonesWithMedia.length > 0) {
                                        const firstZone: any = zonesWithMedia[0];
                                        if (firstZone.playlist?.[0]?.url) {
                                            previewUrl = firstZone.playlist[0].url;
                                            previewType = firstZone.playlist[0].type || 'image';
                                        } else if (firstZone.src) {
                                            previewUrl = firstZone.src;
                                            previewType = 'image';
                                        }
                                    }
                                }
                            }

                            const name = item.name || (item.templateId?.name) || 'Untitled Work';
                            const category = item.category || (item.templateId?.category || (isShowingInspiration ? 'Inspiration' : 'Screen'));
                            const resolution = item.resolution || (item.templateId?.resolution || '1920x1080');
                            const zones = item.zones || (item.templateId?.zones?.length || (item.templateId?.numberOfZones) || 1);

                            return (
                                <Card
                                    key={`${id}-${idx}`}
                                    className={cn(
                                        "flex-shrink-0 transition-all duration-700 cursor-pointer overflow-hidden border-none relative group/card rounded-[1.5rem] bg-muted shadow-lg",
                                        isFocused
                                            ? cn("z-30 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)]", isMobile ? "scale-[1.15]" : "scale-[1.25]")
                                            : "z-10 scale-100"
                                    )}
                                    style={{ width: `${CARD_WIDTH}px`, height: isMobile ? '180px' : '240px' }}
                                    onMouseEnter={() => isFocused && setIsHoveringCenter(true)}
                                    onMouseLeave={() => isFocused && setIsHoveringCenter(false)}
                                    onClick={() => {
                                        if (isFocused) {
                                            if (isShowingInspiration) {
                                                navigate(Routes.TEMPLATES);
                                            } else {
                                                navigate(`${Routes.SCREENS}/${item.id || item._id}`);
                                            }
                                        } else {
                                            setActiveIndex(idx);
                                        }
                                    }}
                                >
                                    <CardContent className="p-0 h-full flex flex-col relative overflow-hidden">
                                        <SmartPreview url={previewUrl} type={previewType} name={name} />

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
                                                        <span className="text-white font-black text-[8px] uppercase">{zones} {zones === 1 ? 'Zone' : 'Zones'}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="w-full h-8 gap-2 font-black text-[9px] uppercase tracking-tighter shadow-2xl bg-white text-black border-0 rounded-lg hover:scale-[1.02] transition-transform"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isShowingInspiration) {
                                                            bootstrapMutation.mutate(name);
                                                        } else {
                                                            navigate(`${Routes.SCREENS}/${item.id || item._id}`);
                                                        }
                                                    }}
                                                    loading={bootstrapMutation.isPending}
                                                >
                                                    <Eye size={12} /> {isShowingInspiration ? 'Preview Concept' : 'View Screen Details'}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Minimal Track */}
            {!isEmptyShowcase && (
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
            )}
        </div>
    );
}
