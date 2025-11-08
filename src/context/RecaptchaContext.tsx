"use client";

import { createContext } from 'react';

interface RecaptchaContextType {
    isRecaptchaReady: boolean;
}

export const RecaptchaContext = createContext<RecaptchaContextType>({ isRecaptchaReady: false });
