module.exports = {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|webp|ico|ttf|woff2?)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
};
