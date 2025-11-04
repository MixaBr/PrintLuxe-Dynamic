
import HomePageClient from '@/components/layout/HomePageClient';
import { getHomePageData } from '@/lib/slide-data';
import { getFeaturedProducts } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Fetch page structure and featured product IDs
  const homePageData = await getHomePageData();

  // Fetch the actual product data based on the IDs,
  // providing the auth status so the server can prepare the correct price.
  const featuredProducts = await getFeaturedProducts(homePageData.featured.ids, isAuthenticated);

  return <HomePageClient homePageData={homePageData} featuredProducts={featuredProducts} />;
}
