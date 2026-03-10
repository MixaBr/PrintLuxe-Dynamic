
import { getFaqPageData } from '@/lib/faq-data';
import FaqPageClient from './FaqPageClient';

export const dynamic = 'force-dynamic';

export default async function FaqPage() {
  const faqData = await getFaqPageData();
  
  return <FaqPageClient faqData={faqData} />;
}
