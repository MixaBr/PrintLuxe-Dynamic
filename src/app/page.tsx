import { getFeaturedProducts } from '@/lib/data';
import HomePageClient from '@/components/layout/HomePageClient';

export default async function Home() {
  // As per our discussion, I will assume a basic Product type for now.
  // This can be replaced with the actual type from your data layer.
  type Product = { id: string; name: string; /* other properties */ };

  let featuredProducts: Product[] = [];
  try {
    // We are calling this function, but the return type might not be what is expected.
    // This is a placeholder for where you would fetch your data.
    featuredProducts = await getFeaturedProducts(4);
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    // Handle the error appropriately
  }

  return <HomePageClient featuredProducts={featuredProducts} />;
}
