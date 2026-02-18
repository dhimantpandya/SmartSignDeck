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
        previewUrl: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Corporate'
    },
    {
        id: 'insp-2',
        name: 'High-Street Fashion',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1441984906356-d007dca2f5a8?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Retail'
    },
    {
        id: 'insp-3',
        name: 'Modern Italian Bistro',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Hospitality'
    },
    {
        id: 'insp-4',
        name: 'Global Arrival Gates',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Travel'
    },
    {
        id: 'insp-5',
        name: 'Elite Training Hub',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Health'
    },
    {
        id: 'insp-6',
        name: 'Grand Resort Lobby',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Hotel'
    },
    {
        id: 'insp-7',
        name: 'Innovation Tech Park',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Education'
    },
    {
        id: 'insp-8',
        name: 'Skyline Penthouse',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Real Estate'
    },
    {
        id: 'insp-9',
        name: 'Luxury Fragrance Ad',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Fashion'
    },
    {
        id: 'insp-10',
        name: 'Elite Sport Complex',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Health'
    }
];
