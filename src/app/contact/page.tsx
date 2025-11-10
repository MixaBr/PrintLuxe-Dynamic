
import { getContactPageData } from '@/lib/contact-data';
import ContactPageClient from '@/components/layout/ContactPageClient';

export default async function ContactPage() {
  const contactData = await getContactPageData();
  
  return <ContactPageClient contactData={contactData} />;
}
