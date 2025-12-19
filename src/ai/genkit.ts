import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This is a workaround for a bug in Genkit where the `custom` property
// is not passed to the tool executor. This plugin intercepts the call
// and manually injects the custom data.
const customDataPlugin: Plugin = {
    name: 'customDataPlugin',
    async onGenerate(req, next) {
        const customData = req.config?.custom;
        if (customData) {
            req.tools?.forEach(tool => {
                const originalExecute = tool.execute.bind(tool);
                tool.execute = (input: any) => originalExecute(input, { custom: customData });
            });
        }
        return next(req);
    },
};


export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.ASSISTANT_API_KEY}), customDataPlugin],
  model: 'googleai/gemini-2.5-flash',
});

    