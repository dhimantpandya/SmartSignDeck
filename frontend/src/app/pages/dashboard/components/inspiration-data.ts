export interface InspirationItem {
    id: string;
    name: string;
    resolution: string;
    zones: number;
    previewUrl: string;
    previewType: 'image' | 'video';
    category: string;
}

export const INSPIRATION_ITEMS: InspirationItem[] = [
    {
        id: 'insp-1',
        name: 'Executive Boardroom',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Corporate'
    },
    {
        id: 'insp-2',
        name: 'Luxury Fashion Promo',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Retail'
    },
    {
        id: 'insp-3',
        name: 'Gourmet Bistro Menu',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Hospitality'
    },
    {
        id: 'insp-4',
        name: 'Global Flight Board',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1464037862814-11756441214d?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Travel'
    },
    {
        id: 'insp-5',
        name: 'Elite Gym Schedule',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Health'
    },
    {
        id: 'insp-6',
        name: 'Grand Lobby Welcome',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Hotel'
    },
    {
        id: 'insp-7',
        name: 'University Campus Wayfinding',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1541339907198-e08756edd53f?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Education'
    },
    {
        id: 'insp-8',
        name: 'Penthouse Showcase',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Property'
    },
    {
        id: 'insp-9',
        name: 'High-End Fragrance Display',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Fashion'
    },
    {
        id: 'insp-10',
        name: 'Global Tech Expo',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1505373630572-2d1330ba58ba?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Events'
    }
];
