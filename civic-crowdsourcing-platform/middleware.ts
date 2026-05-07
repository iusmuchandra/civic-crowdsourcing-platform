import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'te', 'hi', 'es'],
  defaultLocale: 'en',
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
