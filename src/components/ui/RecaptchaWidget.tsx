'use client';

import { useEffect, useRef, useContext } from 'react';
import { RecaptchaContext } from '@/context/RecaptchaContext';

interface RecaptchaWidgetProps {
    onVerified: (isVerified: boolean) => void;
}

export function RecaptchaWidget({ onVerified }: RecaptchaWidgetProps) {
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const { isRecaptchaReady } = useContext(RecaptchaContext);

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    useEffect(() => {
        // Если скрипт не готов, ключ отсутствует или контейнер не смонтирован - ничего не делаем
        if (!isRecaptchaReady || !siteKey || !recaptchaRef.current) {
            return;
        }

        // Если виджет уже отрисован, не делаем этого повторно
        if (widgetIdRef.current !== null) {
            return;
        }

        console.log("Attempting to render reCAPTCHA...");
        try {
            widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
                'sitekey': siteKey,
                'callback': (token: string) => {
                    onVerified(true);
                },
                'expired-callback': () => {
                    onVerified(false);
                },
                'error-callback': () => {
                    onVerified(false);
                }
            });
            console.log("reCAPTCHA rendered successfully with widget ID:", widgetIdRef.current);
        } catch (error) {
            console.error("Fatal error rendering reCAPTCHA:", error);
        }

        // Функция очистки для сброса виджета при размонтировании компонента
        return () => {
            if (window.grecaptcha && widgetIdRef.current !== null) {
                // Этот блок может быть не всегда нужен, но полезен для сложных SPA
                // window.grecaptcha.reset(widgetIdRef.current);
            }
        };

    }, [isRecaptchaReady, siteKey, onVerified]);
    
    // Сброс состояния верификации, если форма была успешно отправлена или произошла ошибка
    // Это управляется через ключ `key` на стороне родительского компонента
    useEffect(() => {
        onVerified(false);
    }, []);


    if (!siteKey) {
        return <p className="text-destructive text-sm text-center">Ключ reCAPTCHA не настроен.</p>;
    }

    return <div ref={recaptchaRef} className="flex justify-center w-full"></div>;
}
