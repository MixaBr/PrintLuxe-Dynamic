
import HomePageClient from '@/components/layout/HomePageClient';
import { getHomePageData } from '@/lib/slide-data';
import { getFeaturedProducts } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch page structure and featured product IDs
  const homePageData = await getHomePageData();

  // Fetch the actual product data based on the IDs
  const featuredProducts = await getFeaturedProducts(homePageData.featured.ids);

  return <HomePageClient homePageData={homePageData} featuredProducts={featuredProducts} isAuthenticated={!!user} />;
}
