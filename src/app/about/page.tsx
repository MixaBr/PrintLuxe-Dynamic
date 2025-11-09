
import { getAboutPageData } from '@/lib/about-data';
import AboutPageClient from '@/components/layout/AboutPageClient';

export default async function AboutPage() {
  const aboutData = await getAboutPageData();
  
  return <AboutPageClient aboutData={aboutData} />;
}
