const CACHE_NAME = 'budget-tracker-cache';
const DATA_CACHE_NAME = 'data-cache';

const FILES_TO_CACHE = [
	'/',
	'/index.html',
	'/manifest.json',
	'/css/styles.css',
	'/js/index.js',
	'/js/idb.js',
	'/icons/icon-72x72.png',
	'/icons/icon-96x96.png',
	'/icons/icon-128x128.png',
	'/icons/icon-144x144.png',
	'/icons/icon-192x192.png',
];

// Install the service worker
self.addEventListener('install', function (evt) {
	evt.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('Your files were pre-cached successfully!');
			return cache.addAll(FILES_TO_CACHE);
		})
	);

	self.skipWaiting();
});

// Activate the service worker and remove old data from the cache
self.addEventListener('activate', function (evt) {
	evt.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
						console.log('Removing old cache data', key);
						return caches.delete(key);
					}
				})
			);
		})
	);

	self.clients.claim();
});

// Intercept fetch requests
self.addEventListener('fetch', (evt) => {
	if (evt.request.url.includes('/api')) {
		evt.respondWith(
			caches.open(DATA_CACHE_NAME).then((cache) => {
				return fetch(evt.request)
					.then((response) => {
						// If the response was good, clone it and store it in the cache.
						if (response.status === 200) {
							cache.put(evt.request.url, response.clone());
						}

						return response;
					})
					.catch((err) => {
						// Network request failed, try to get it from the cache.
						return cache.match(evt.request);
					});
			})
		);
		return;
	}

	evt.respondWith(
		caches.match(evt.request).then((response) => {
			return response || fetch(evt.request);
		})
	);
});
