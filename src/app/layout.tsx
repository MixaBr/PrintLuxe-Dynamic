import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { getAppBackground } from '@/lib/data';

export const metadata: Metadata = {
  title: 'PrintLuxe Dynamic',
  description: 'Качественные услуги печати и дизайна',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const backgroundUrl = await getAppBackground();

  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        {backgroundUrl && (
          <video
            className="fixed -z-10 w-full h-full object-cover"
            src={backgroundUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
