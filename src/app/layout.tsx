
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { getAppBackground } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { FirebaseAnalyticsProvider } from '@/components/providers/FirebaseAnalyticsProvider';
import { RecaptchaProvider } from '@/components/providers/RecaptchaProvider'; // Import the new provider

export const metadata: Metadata = {
  title: 'PrintLux Dynamic',
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

  let userRole: string | null = null;
  if (user) {
    const { data: roleData } = await supabase
      .from('role_users')
      .select('role')
      .eq('user_id', user.id)
      .single();
    userRole = roleData?.role || 'buyer';
  }

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
        <FirebaseAnalyticsProvider>
          <RecaptchaProvider> {/* Wrap with RecaptchaProvider */}
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
              <Header isAuthenticated={!!user} userRole={userRole} />
              <main className="h-full overflow-hidden">{children}</main>
            </div>
            <Toaster />
          </RecaptchaProvider>
        </FirebaseAnalyticsProvider>
      </body>
    </html>
  );
}
