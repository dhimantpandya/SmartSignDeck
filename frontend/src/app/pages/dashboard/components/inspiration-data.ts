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
        name: 'Modern Corporate Lobby',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Corporate'
    },
    {
        id: 'insp-2',
        name: 'Vibrant Retail Promo',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Retail'
    },
    {
        id: 'insp-3',
        name: 'Digital Cafe Menu',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Hospitality'
    },
    {
        id: 'insp-4',
        name: 'Airport Arrival Board',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Travel'
    },
    {
        id: 'insp-5',
        name: 'Fitness Center Schedule',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Health'
    },
    {
        id: 'insp-6',
        name: 'Luxury Hotel Welcome',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Hotel'
    },
    {
        id: 'insp-7',
        name: 'Smart Campus Map',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1523050335392-93851179ae09?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Education'
    },
    {
        id: 'insp-8',
        name: 'Real Estate Gallery',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Property'
    },
    {
        id: 'insp-9',
        name: 'Fashion Boutique Lookbook',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Fashion'
    },
    {
        id: 'insp-10',
        name: 'Tech Conference Agenda',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1540575861501-7ad0582371f1?auto=format&fit=crop&q=95&w=1200',
        previewType: 'image',
        category: 'Events'
    }
];
