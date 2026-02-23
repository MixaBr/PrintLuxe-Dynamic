
import { getFaqPageData } from '@/lib/faq-data';
import FaqPageClient from './FaqPageClient';

// Use Incremental Static Regeneration to update content without a full rebuild.
// The page will be regenerated at most once every 60 seconds.
export const revalidate = 60;

export default async function FaqPage() {
  const faqData = await getFaqPageData();
  
  return <FaqPageClient faqData={faqData} />;
}
