
'use client';

import type { ContactPageData } from '@/lib/contact-data';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { ViberIcon } from '../icons/ViberIcon';


interface SidebarProps {
  contactData: ContactPageData;
}

export function Sidebar({ contactData }: SidebarProps) {
  return (
    <div className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-white mt-auto">
          <h3 className="text-lg font-bold mb-4 flex-shrink-0">Контакты</h3>
          <div className="space-y-3 text-sm overflow-y-auto">
            {contactData.address && (
                <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{contactData.address}</span>
                </div>
            )}
            {(contactData.phone_1 || contactData.phone_2) && (
                <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                        {contactData.phone_1 && <span>{contactData.phone_1}</span>}
                        {contactData.phone_2 && <span>{contactData.phone_2}</span>}
                    </div>
                </div>
            )}
            {contactData.email_main && (
                <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <a href={`mailto:${contactData.email_main}`} className="break-all hover:underline">{contactData.email_main}</a>
                </div>
            )}
            {(contactData.telegram_link || contactData.viber_link) && (
              <div className="flex items-start gap-3">
                  <svg
                    viewBox="0 0 50.8 50.8"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    >
                    <path
                        d="M22.754 9.128h19.843c1.413 0 2.382 1.113 2.382 2.381v14.553c.031 1.397-.959 2.38-2.382 2.38h-4.762v4.499l-6.615-4.498h-8.466c-1.39.002-2.4-1.04-2.381-2.381V11.509c0-1.12.766-2.38 2.38-2.38zm-8.626 10.054H8.202c-1.375 0-2.381 1.021-2.381 2.382v13.493c0 1.492 1.204 2.382 2.381 2.382h3.969v4.233l6.085-4.233h7.937c1.225 0 2.382-.954 2.382-2.382v-.529"
                        style={{
                        opacity: 1,
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: 3.175,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeMiterlimit: 0,
                        strokeDasharray: "none",
                        }}
                    />
                    </svg>
                  <div className="flex items-center gap-4">
                      {contactData.telegram_link && (
                          <Link href={contactData.telegram_link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                              <span className="sr-only">Telegram</span>
                          </Link>
                      )}
                      {contactData.viber_link && (
                          <Link href={contactData.viber_link} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition">
                              <ViberIcon className="w-6 h-6"/>
                              <span className="sr-only">Viber</span>
                          </Link>
                      )}
                  </div>
              </div>
            )}
            {contactData.working_hours && (
                <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className='whitespace-pre-wrap'>{contactData.working_hours}</div>
                </div>
            )}
          </div>
    </div>
  );
}
