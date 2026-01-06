
import { getContactPageData } from '@/lib/contact-data';
import ContactPageClient from '@/components/layout/ContactPageClient';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const contactData = await getContactPageData();
  
  return <ContactPageClient contactData={contactData} />;
}
