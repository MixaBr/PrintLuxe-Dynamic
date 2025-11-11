'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { RecaptchaContext } from '@/context/RecaptchaContext';

interface RecaptchaProviderProps {
    children: React.ReactNode;
}

// Объявляем тип для window, чтобы TypeScript не ругался
declare global {
    interface Window {
        onRecaptchaLoadCallback: () => void;
    }
}

export const RecaptchaProvider: React.FC<RecaptchaProviderProps> = ({ children }) => {
    const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);

    useEffect(() => {
        // Назначаем глобальную функцию, которую вызовет скрипт reCAPTCHA
        window.onRecaptchaLoadCallback = () => {
            console.log('reCAPTCHA API is fully loaded and ready.');
            setIsRecaptchaReady(true);
        };

        // Очистка при размонтировании компонента
        return () => {
            // @ts-ignore
            delete window.onRecaptchaLoadCallback;
        };
    }, []);

    return (
        <RecaptchaContext.Provider value={{ isRecaptchaReady }}>
            <Script 
                id="recaptcha-script-loader"
                src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadCallback&render=explicit"
                async 
                defer 
            />
            {children}
        </RecaptchaContext.Provider>
    );
};
