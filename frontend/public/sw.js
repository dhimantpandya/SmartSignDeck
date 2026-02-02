const CACHE_NAME = 'smart-sign-deck-v1';
const MEDIA_CACHE_NAME = 'smart-sign-media-v1';

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== MEDIA_CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Special handling for media (images/videos)
    if (url.origin.includes('cloudinary.com') || request.destination === 'image' || request.destination === 'video') {
        event.respondWith(
            caches.open(MEDIA_CACHE_NAME).then((cache) => {
                return cache.match(request).then((response) => {
                    return response || fetch(request).then((networkResponse) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Default stale-while-revalidate for application files
    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request);
        })
    );
});
