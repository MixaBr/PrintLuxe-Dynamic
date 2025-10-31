import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { getAppBackground } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'PrintLuxe Dynamic',
  description: 'Качественные услуги печати и дизайна',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let backgroundUrl;
  try {
    backgroundUrl = await getAppBackground();
  } catch (error) {
    console.error("Failed to fetch app background, proceeding without it:", error);
    backgroundUrl = null;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <body className="font-body antialiased h-screen w-screen overflow-hidden">
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
        <div className="h-full w-full grid grid-rows-[auto_1fr] relative z-10">
          <Header isAuthenticated={!!user} />
          <main className="h-full overflow-y-auto">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
