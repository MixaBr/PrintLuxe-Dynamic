
/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 * This tool is now configurable via the `app_config` table in Supabase.
 * It now extracts both manufacturer and model for precise, filtered searches.
 * If no information is found, it provides helpful links to external resources.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

const MATCH_FUNCTION = 'match_manual_knowledge';

async function getSearchConfig() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['bot_kb_match_threshold', 'bot_kb_match_count', 'bot_prompt_extract_model']);

    if (error) {
        console.error("Error fetching knowledge base config:", error.message);
        return { matchThreshold: 0.7, matchCount: 5, extractModelPrompt: '' };
    }

    const config = data.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string | null>);
    
    const matchThreshold = parseFloat(config.bot_kb_match_threshold || '0.7');
    const matchCount = parseInt(config.bot_kb_match_count || '5', 10);
    const extractModelPrompt = config.bot_prompt_extract_model || '';

    return {
        matchThreshold: isNaN(matchThreshold) ? 0.7 : matchThreshold,
        matchCount: isNaN(matchCount) ? 5 : matchCount,
        extractModelPrompt
    };
}

export const knowledgeBaseTool = ai.defineTool(
    {
        name: 'knowledgeBaseTool',
        description: 'Use this tool to answer user questions about product specifications, troubleshooting, repairs, or user manuals. The tool searches the knowledge base for relevant information.',
        inputSchema: z.object({
            query: z.string().describe('The user question to search for in the knowledge base.'),
        }),
        outputSchema: z.string().describe('A string containing the most relevant context from the knowledge base or a helpful message with external links if no information was found.'),
    },
    async ({ query }, context: any) => {
        console.log(`======== KNOWLEDGE BASE TOOL CALLED ========`);
        console.log(`Searching for: "${query}"`);

        const { matchThreshold, matchCount, extractModelPrompt } = await getSearchConfig();
        let filterMetadata: Record<string, any> = {};
        let extractedManufacturer: string | null = null;

        if (extractModelPrompt) {
            try {
                const modelExtractionLlmResponse = await ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    prompt: extractModelPrompt.replace('{{query}}', query),
                });

                let jsonString = modelExtractionLlmResponse.text.trim();
                jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
                
                const extractedData = JSON.parse(jsonString);

                if (extractedData.manufacturer) {
                    extractedManufacturer = extractedData.manufacturer;
                    filterMetadata.manufacturer = extractedManufacturer;
                }
                if (extractedData.model) {
                    filterMetadata.device_models = [extractedData.model];
                }

                console.log(`Extracted metadata for filtering:`, filterMetadata);

            } catch (e: any) {
                console.error('Error parsing metadata extraction response:', e.message);
            }
        }

        console.log(`Query is detailed enough. Proceeding with vector search.`);
        console.log(`Using search config: threshold=${matchThreshold}, count=${matchCount}`);
        console.log(`Using filter: ${JSON.stringify(filterMetadata)}`);

        const embeddingResponse = await ai.embed({
            embedder: textEmbeddingGecko,
            content: query,
        });

        const embedding = embeddingResponse[0]?.embedding;
        if (!embedding) return 'Произошла ошибка при создании эмбеддинга для вашего запроса.';

        const supabase = createAdminClient();
        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            filter_metadata: filterMetadata,
            is_array_contains: true 
        });

        if (error) {
            console.error('Error searching knowledge base:', error);
            return 'Произошла ошибка при поиске в базе знаний.';
        }

        if (!documents || documents.length === 0) {
            console.log(`Found 0 relevant documents.`);
            console.log(`============================================`);
            
            const links = {
                EPSON: 'https://EPSON.SN',
                CANON: 'https://ij.manual.canon/ij/webmanual/WebPortal/PTL/ptl-top.html?lng=ru',
                HP: 'https://support.hp.com/kz-ru'
            };

            let response = "К сожалению, я не нашел точной информации по вашему запросу в своей базе знаний. ";

            if (extractedManufacturer) {
                const upperMan = extractedManufacturer.toUpperCase();
                if (upperMan in links) {
                    response += `Однако, вы можете найти официальные руководства для ${extractedManufacturer} по ссылке: ${links[upperMan as keyof typeof links]}`;
                } else {
                    response += `Попробуйте поискать на официальном сайте производителя ${extractedManufacturer}.`;
                }
            } else {
                 response += "Не могли бы вы уточнить производителя вашего устройства (например, Epson, Canon, HP)?\n\nВозможно, вы найдете ответ в официальных руководствах:\n"
                + `  - Для EPSON: ${links.EPSON}\n`
                + `  - Для CANON: ${links.CANON}\n`
                + `  - Для HP: ${links.HP}`;
            }

            return response;
        }
        
        console.log(`Found ${documents.length} relevant documents. (Logging details below)`);
        const contextText = documents
            .map((doc: any) => `- Источник: ${doc.metadata?.source_filename || 'Неизвестно'} (Производитель: ${doc.metadata?.manufacturer || 'N/A'}, Модели: ${doc.metadata?.device_models?.join(', ') || 'N/A'})\n  Содержание: ${doc.content}`)
            .join('\n\n');

        console.log('KNOWLEDGE BASE SEARCH: Final Context', contextText);
        return contextText;
    }
);
