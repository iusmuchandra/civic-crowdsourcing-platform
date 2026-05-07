import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import { BottomNav } from '@/components/ui/BottomNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Civic Voice — Report. Rate. Resolve.',
  description: 'A civic crowdsourcing platform where citizens report infrastructure issues and collectively demand action from officials.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#2563eb',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <head>
        <script
          async
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&loading=async`}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <main className="pb-16 min-h-screen">
            {children}
          </main>
          <BottomNav />
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
