
import HomePageClient from '@/components/layout/HomePageClient';
import { getHomePageData } from '@/lib/slide-data';
import { getFeaturedProducts } from '@/lib/data';

export default async function Home() {
  // Fetch page structure and featured product IDs
  const homePageData = await getHomePageData();

  // Fetch the actual product data based on the IDs
  const featuredProducts = await getFeaturedProducts(homePageData.featured.ids);

  return <HomePageClient homePageData={homePageData} featuredProducts={featuredProducts} />;
}
