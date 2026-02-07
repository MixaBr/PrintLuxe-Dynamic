
import HomePageClient from '@/components/layout/HomePageClient';
import { getHomePageData, type HomePageData } from '@/lib/slide-data';
import { getFeaturedProducts } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { getRecentNews } from '@/lib/news-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const homePageData = await getHomePageData();
    const recentNews = await getRecentNews(10);
    
    if (!homePageData || !homePageData.featured || !homePageData.featured.ids) {
        throw new Error("Не удалось загрузить структуру главной страницы.");
    }

    const featuredProductsData = await getFeaturedProducts(homePageData.featured.ids, user);

    const featuredProducts = featuredProductsData.map(p => ({ ...p, description: p.name }));

    return <HomePageClient homePageData={homePageData} featuredProducts={featuredProducts} recentNews={recentNews} />;

  } catch (error) {
    console.error("Ошибка при загрузке данных для главной страницы:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Произошла непредвиденная ошибка.';
    
    const fallbackData: HomePageData = {
        hero: { title: 'Сервис в ремонте', subtitle: 'Мы скоро вернемся' },
        featured: { title: 'Популярные товары', subtitle: 'Раздел временно недоступен', ids: [] },
        services: { title: 'Наши услуги', subtitle: 'Раздел временно недоступен', list: [] },
        benefits: { title: 'Наши преимущества', subtitle: 'Раздел временно недоступен', list: [] },
    };

    return (
      <HomePageClient
        homePageData={fallbackData}
        featuredProducts={[]}
        recentNews={[]}
        error={errorMessage}
      />
    );
  }
}
