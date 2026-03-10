
import { getServicesPageData } from '@/lib/services-data';
import ServicesPageClient from './ServicesPageClient';

export const revalidate = 0;

export default async function ServicesPage() {
  const servicesData = await getServicesPageData();
  
  return <ServicesPageClient servicesData={servicesData} />;
}
