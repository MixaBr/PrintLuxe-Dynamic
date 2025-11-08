"use client";

import { useState } from 'react';
import Script from 'next/script';
import { RecaptchaContext } from '@/context/RecaptchaContext';

interface RecaptchaProviderProps {
    children: React.ReactNode;
}

export const RecaptchaProvider: React.FC<RecaptchaProviderProps> = ({ children }) => {
    const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

    return (
        <RecaptchaContext.Provider value={{ isRecaptchaReady }}>
            <Script 
                id="recaptcha-script-loader"
                src="https://www.google.com/recaptcha/api.js?render=explicit"
                onLoad={() => {
                    console.log('reCAPTCHA script has been loaded.');
                    setIsRecaptchaReady(true);
                }}
                onError={(e) => {
                    console.error('Failed to load reCAPTCHA script:', e);
                }}
                async 
                defer 
            />
            {children}
        </RecaptchaContext.Provider>
    );
};
