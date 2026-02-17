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
        previewUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Corporate'
    },
    {
        id: 'insp-2',
        name: 'Vibrant Retail Promo',
        resolution: '1080x1920',
        zones: 3,
        previewUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Retail'
    },
    {
        id: 'insp-3',
        name: 'Digital Cafe Menu',
        resolution: '1920x1080',
        zones: 5,
        previewUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Hospitality'
    },
    {
        id: 'insp-4',
        name: 'Airport Arrival Board',
        resolution: '1920x1080',
        zones: 2,
        previewUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Travel'
    },
    {
        id: 'insp-5',
        name: 'Fitness Center Schedule',
        resolution: '1080x1920',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Health'
    },
    {
        id: 'insp-6',
        name: 'Luxury Hotel Welcome',
        resolution: '1920x1080',
        zones: 3,
        previewUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Hotel'
    },
    {
        id: 'insp-7',
        name: 'Smart Campus Map',
        resolution: '1920x1080',
        zones: 6,
        previewUrl: 'https://images.unsplash.com/photo-1523050335392-93851179ae09?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Education'
    },
    {
        id: 'insp-8',
        name: 'Real Estate Gallery',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Property'
    },
    {
        id: 'insp-9',
        name: 'Fashion Boutique Lookbook',
        resolution: '1080x1920',
        zones: 3,
        previewUrl: 'https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Fashion'
    },
    {
        id: 'insp-10',
        name: 'Tech Conference Agenda',
        resolution: '1920x1080',
        zones: 5,
        previewUrl: 'https://images.unsplash.com/photo-1540575861501-7ad0582371f1?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Events'
    },
    {
        id: 'insp-11',
        name: 'Organic Grocery Deals',
        resolution: '1920x1080',
        zones: 3,
        previewUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Grocery'
    },
    {
        id: 'insp-12',
        name: 'Dental Clinic Info',
        resolution: '1920x1080',
        zones: 2,
        previewUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Medical'
    },
    {
        id: 'insp-13',
        name: 'Car Showroom Specs',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Automotive'
    },
    {
        id: 'insp-14',
        name: 'Nightlife DJ Event',
        resolution: '1920x1080',
        zones: 3,
        previewUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Entertainment'
    },
    {
        id: 'insp-15',
        name: 'Co-working Rules',
        resolution: '1080x1920',
        zones: 2,
        previewUrl: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Workspace'
    },
    {
        id: 'insp-16',
        name: 'Stadium Live Feed',
        resolution: '1920x1080',
        zones: 4,
        previewUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Sports'
    },
    {
        id: 'insp-17',
        name: 'Art Gallery Intro',
        resolution: '1920x1080',
        zones: 1,
        previewUrl: 'https://images.unsplash.com/photo-1493306462972-72ce4824236a?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Culture'
    },
    {
        id: 'insp-18',
        name: 'Pharma Lab Updates',
        resolution: '1920x1080',
        zones: 5,
        previewUrl: 'https://images.unsplash.com/photo-1579154271797-00c3065da513?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Science'
    },
    {
        id: 'insp-19',
        name: 'Bakery Morning Fresh',
        resolution: '1080x1920',
        zones: 2,
        previewUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Bakery'
    },
    {
        id: 'insp-20',
        name: 'Luxury Spa Menu',
        resolution: '1920x1080',
        zones: 3,
        previewUrl: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=90&w=1200',
        previewType: 'image',
        category: 'Wellness'
    }
];
