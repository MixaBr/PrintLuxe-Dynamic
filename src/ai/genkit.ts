import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.ASSISTANT_API_KEY,
    }),
  ],
});

export const textEmbeddingGecko = googleAI.model('text-embedding-004');
