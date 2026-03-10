
import { getFaqPageData } from '@/lib/faq-data';
import FaqPageClient from './FaqPageClient';

export const revalidate = 0;

export default async function FaqPage() {
  const faqData = await getFaqPageData();
  
  return <FaqPageClient faqData={faqData} />;
}
