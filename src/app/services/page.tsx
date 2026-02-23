
import { getServicesPageData } from '@/lib/services-data';
import ServicesPageClient from './ServicesPageClient';

// Use Incremental Static Regeneration to update content without a full rebuild.
// The page will be regenerated at most once every 60 seconds.
export const revalidate = 60;

export default async function ServicesPage() {
  const servicesData = await getServicesPageData();
  
  return <ServicesPageClient servicesData={servicesData} />;
}
