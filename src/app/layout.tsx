
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { getAppBackground } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { FirebaseAnalyticsProvider } from '@/components/providers/FirebaseAnalyticsProvider';
import { RecaptchaProvider } from '@/components/providers/RecaptchaProvider';
import { getRunningLineText } from '@/lib/settings-data';

export const metadata: Metadata = {
  title: 'PrintLux | Ремонт принтеров, запасные части и расходные материалы EPSON в Минске',
  description: 'Профессиональный ремонт принтеров, МФУ, запасные части и расходные материалы EPSON в Минске. Быстро, качественно, с гарантией. Работаем со всеми популярными марками: HP, Canon, Epson, Samsung, Brother.',
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
  
  let runningLineText: string | { error: string } | null = null;
  try {
    runningLineText = await getRunningLineText();
  } catch (error) {
    console.error('Error fetching running line text:', error);
    runningLineText = { error: 'Failed to load running line text' };
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
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          @media (min-width: 768px) {
            .animate-marquee {
              animation-duration: 60s; /* Slower on larger screens */
            }
          }
        `}</style>
      </head>
      <body className="font-body antialiased">
        <FirebaseAnalyticsProvider>
          <RecaptchaProvider>
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
            {/* СТРУКТУРА "КАБИНЫ" */}
            <div className="min-h-screen w-full flex flex-col relative z-10">
              <Header isAuthenticated={!!user} userRole={userRole} runningLineText={runningLineText} />
              {/* ОСНОВНАЯ ОБЛАСТЬ С ПРОКРУТКОЙ */}
              <main className="flex-grow">
                {children}
              </main>
            </div>
            {/* ИЗМЕНЕНО: Футер удален из глобального макета */}
            <Toaster />
          </RecaptchaProvider>
        </FirebaseAnalyticsProvider>
      </body>
    </html>
  );
}
