'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Define the props interface for clarity and type safety
interface RecaptchaWidgetProps {
  onVerified: (isSuccess: boolean) => void;
}

export function RecaptchaWidget({ onVerified }: RecaptchaWidgetProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

  // This effect will watch for when it's time to render the widget
  useEffect(() => {
    // Render only if the script is loaded and the container is in the DOM
    if (isRecaptchaReady && recaptchaRef.current) {
      // Ensure we don't render the widget twice in the same container
      if (recaptchaRef.current.innerHTML === '') {
        (window as any).grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
          // When the user passes the check, call the function passed from the parent
          callback: () => onVerified(true),
          // When the check expires, notify the parent
          'expired-callback': () => onVerified(false),
        });
      }
    }
  }, [isRecaptchaReady, onVerified]);

  return (
    <>
      {/* Load the script with the correct parameters for manual rendering */}
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        async
        defer
        // When the script loads, set the readiness flag
        onLoad={() => setIsRecaptchaReady(true)}
      />
      {/* This div will be the "canvas" for our widget */}
      <div ref={recaptchaRef}></div>
    </>
  );
}
