/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
    ],
  },
};

const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');
module.exports = withNextIntl(nextConfig);
