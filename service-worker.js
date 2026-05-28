// Service Worker for Mobile Suraksha
const CACHE_NAME = 'mobile-suraksha-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/firebase.js',
    '/manifest.json',
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache opened');
                return cache.addAll(ASSETS_TO_CACHE.filter(url => !url.includes('gstatic')));
            })
            .catch((error) => {
                console.error('Cache installation error:', error);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Claim clients immediately
    return self.clients.claim();
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
    // Skip Firebase API calls
    if (event.request.url.includes('firebaseapp.com') || 
        event.request.url.includes('googleapis.com') ||
        event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache first strategy for static assets
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // If not in cache, try network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page if available
                        return caches.match('/index.html');
                    });
            })
    );
});

// Handle Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-scans') {
        event.waitUntil(syncScans());
    }
});

async function syncScans() {
    try {
        // Sync pending scans
        console.log('Syncing scans...');
        // This would sync any pending scan data when connection is restored
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Handle Push Notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'आपके पास एक नई सूचना है',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%230a5aff;stop-opacity:1" /><stop offset="100%" style="stop-color:%2300d4ff;stop-opacity:1" /></linearGradient></defs><rect width="192" height="192" fill="url(%23grad)" rx="48"/><path d="M96 32 L135 52.5 L135 96 Q135 142.5 96 157.5 Q57 142.5 57 96 L57 52.5 Z" fill="white" opacity="0.95"/><path d="M75 96 L96 120 L135 61" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="%230a5aff" rx="48"/><path d="M96 32 L135 52.5 L135 96 Q135 142.5 96 157.5 Q57 142.5 57 96 L57 52.5 Z" fill="white" opacity="0.95"/></svg>',
            tag: data.tag || 'notification',
            requireInteraction: data.requireInteraction || false,
            actions: [
                {
                    action: 'open',
                    title: 'खोलें'
                },
                {
                    action: 'close',
                    title: 'बंद करें'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification('Mobile Suraksha', options)
        );
    }
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If not open, open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Handle Notification Close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed');
});

// Message Handler for Client Communication
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
    }
});

// Periodic Background Sync (for Android)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'security-check') {
        event.waitUntil(performSecurityCheck());
    }
});

async function performSecurityCheck() {
    try {
        // Perform periodic security check
        console.log('Performing periodic security check...');
        // This would check for any threats and notify user
    } catch (error) {
        console.error('Security check error:', error);
    }
}
