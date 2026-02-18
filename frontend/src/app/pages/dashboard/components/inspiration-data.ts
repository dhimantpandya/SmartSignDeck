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
        previewUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Corporate'
    },
    {
        id: 'insp-2',
        name: 'High-Street Fashion',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Retail'
    },
    {
        id: 'insp-3',
        name: 'Modern Italian Bistro',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Hospitality'
    },
    {
        id: 'insp-4',
        name: 'Global Arrival Gates',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1495791185843-c73f2269f669?auto=format&fit=crop&q=95&w=1600',
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
        previewUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Hotel'
    },
    {
        id: 'insp-7',
        name: 'Innovation Tech Park',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=95&w=1600',
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
        previewUrl: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Fashion'
    },
    {
        id: 'insp-10',
        name: 'Elite Sport Complex',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f2?auto=format&fit=crop&q=95&w=1600',
        previewType: 'image',
        category: 'Health'
    }
];
