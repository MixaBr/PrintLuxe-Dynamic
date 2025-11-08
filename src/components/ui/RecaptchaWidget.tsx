'use client';

import { useEffect, useRef, useContext } from 'react';
import { RecaptchaContext } from '@/context/RecaptchaContext';

interface RecaptchaWidgetProps {
  onVerified: (isSuccess: boolean) => void;
}

export function RecaptchaWidget({ onVerified }: RecaptchaWidgetProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { isRecaptchaReady } = useContext(RecaptchaContext);

  useEffect(() => {
    if (isRecaptchaReady && recaptchaRef.current) {
      if (recaptchaRef.current.innerHTML === '') {
        try {
          (window as any).grecaptcha.render(recaptchaRef.current, {
            sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
            callback: () => onVerified(true),
            'expired-callback': () => onVerified(false),
          });
        } catch (error) {
          console.error("Error rendering reCAPTCHA:", error);
        }
      }
    }
  }, [isRecaptchaReady, onVerified]);

  return <div ref={recaptchaRef}></div>;
}
