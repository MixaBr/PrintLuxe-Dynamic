
/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 * This tool is now configurable via the `app_config` table in Supabase.
 * It now extracts both manufacturer and model for precise, filtered searches.
 * If no information is found, it provides helpful external links, also configured in the database.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

const MATCH_FUNCTION = 'match_manual_knowledge';

// Helper to get search configuration from the database
async function getSearchConfig() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', [
            'bot_kb_match_threshold', 
            'bot_kb_match_count', 
            'bot_prompt_extract_model',
            'bot_kb_not_found_generic',
            'bot_kb_not_found_specific',
            'bot_kb_link_epson',
            'bot_kb_link_canon',
            'bot_kb_link_hp'
        ]);

    if (error) {
        console.error("Error fetching knowledge base config:", error.message);
        // Return safe defaults if DB query fails
        return { 
            matchThreshold: 0.7, 
            matchCount: 5, 
            extractModelPrompt: '',
            notFoundGeneric: 'Не удалось найти информацию. Уточните производителя.',
            notFoundSpecific: 'Не удалось найти информацию по {{manufacturer}}.',
            links: {}
        };
    }

    const config = data.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string | null>);
    
    const matchThreshold = parseFloat(config.bot_kb_match_threshold || '0.7');
    const matchCount = parseInt(config.bot_kb_match_count || '5', 10);

    return {
        matchThreshold: isNaN(matchThreshold) ? 0.7 : matchThreshold,
        matchCount: isNaN(matchCount) ? 5 : matchCount,
        extractModelPrompt: config.bot_prompt_extract_model || '',
        notFoundGeneric: config.bot_kb_not_found_generic || 'К сожалению, я не нашел информации по вашему запросу. Попробуйте переформулировать его или указать производителя. Вот полезные ресурсы:\n{{links}}',
        notFoundSpecific: config.bot_kb_not_found_specific || 'К сожалению, по вашему запросу для {{manufacturer}} ничего не найдено. Попробуйте поискать на официальном сайте: \n{{link}}',
        links: {
            epson: config.bot_kb_link_epson,
            canon: config.bot_kb_link_canon,
            hp: config.bot_kb_link_hp,
        }
    };
}


export const knowledgeBaseTool = ai.defineTool(
    {
        name: 'knowledgeBaseTool',
        description: 'Use this tool to answer user questions about product specifications, troubleshooting, repairs, or user manuals. The tool searches the knowledge base for relevant information.',
        inputSchema: z.object({
            query: z.string().describe('The user question to search for in the knowledge base.'),
        }),
        outputSchema: z.string().describe('A string containing the most relevant context from the knowledge base, or a helpful message with links if no information was found.'),
    },
    async ({ query }, context: any) => {
        console.log(`======== KNOWLEDGE BASE TOOL CALLED ========`);
        console.log(`Searching for: "${query}"`);

        const { matchThreshold, matchCount, extractModelPrompt, notFoundGeneric, notFoundSpecific, links } = await getSearchConfig();
        
        let filterMetadata: Record<string, any> = {};
        let extractedManufacturer: string | null = null;

        if (extractModelPrompt) {
            try {
                const modelExtractionLlmResponse = await ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    prompt: extractModelPrompt.replace('{{query}}', query),
                });

                let jsonString = modelExtractionLlmResponse.text.trim().replace(/```json/g, '').replace(/```/g, '');
                const extractedData = JSON.parse(jsonString);

                if (extractedData.manufacturer) {
                    extractedManufacturer = extractedData.manufacturer.toLowerCase();
                    // Important: The filter key must match the key in the metadata JSON.
                    // Let's assume the key is `manufacturer`.
                    filterMetadata.manufacturer = extractedManufacturer;
                }
                if (extractedData.model) {
                     // The key `device_models` is used here for filtering
                     // Convert to uppercase to match database rule
                    filterMetadata.device_models = [extractedData.model.toUpperCase()];
                }

                console.log(`Extracted metadata for filtering:`, filterMetadata);

            } catch (e: any) {
                console.error('Error parsing metadata extraction response:', e.message);
            }
        }
        
        console.log(`Query is being processed. Proceeding with vector search.`);
        console.log(`Using search config: threshold=${matchThreshold}, count=${matchCount}`);
        console.log(`Using filter: ${JSON.stringify(filterMetadata)}`);

        const embeddingResponse = await ai.embed({
            embedder: textEmbeddingGecko,
            content: query,
        });

        const embedding = embeddingResponse[0]?.embedding;

        if (!embedding) {
            return 'Произошла ошибка при создании эмбеддинга для вашего запроса.';
        }

        const supabase = createAdminClient();

        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            filter_metadata: filterMetadata,
            is_array_contains: true
        });

        if (error) {
            console.error('Ошибка при поиске в базе знаний:', error);
            return 'Произошла ошибка при поиске в базе знаний.';
        }

        if (!documents || documents.length === 0) {
            console.log(`Found 0 relevant documents.`);
            console.log(`============================================`);

            if (extractedManufacturer && links[extractedManufacturer as keyof typeof links]) {
                const specificLink = `- ${extractedManufacturer.toUpperCase()}: ${links[extractedManufacturer as keyof typeof links]}`;
                return notFoundSpecific
                    .replace('{{manufacturer}}', extractedManufacturer)
                    .replace('{{link}}', specificLink);
            } else {
                 const allLinks = Object.entries(links)
                    .filter(([_, url]) => url)
                    .map(([name, url]) => `- ${name.toUpperCase()}: ${url}`)
                    .join('\n');
                return notFoundGeneric.replace('{{links}}', allLinks);
            }
        }
        
        console.log(`Found ${documents.length} relevant documents. (Logging details below)`);
        documents.forEach((doc: any, index: number) => {
            console.log(`  [Doc ${index + 1}] Similarity: ${doc.similarity}, Filename: ${doc.metadata?.source_filename || 'N/A'}`);
        });

        const contextText = documents
            .map((doc: any) => `- Источник: ${doc.metadata?.source_filename || 'Неизвестно'} (Производитель: ${doc.metadata?.manufacturer || 'N/A'}, Модели: ${doc.metadata?.device_models?.join(', ') || 'N/A'})\n  Содержание: ${doc.content}`)
            .join('\n\n');

        console.log('KNOWLEDGE BASE SEARCH: Final Context', contextText);
        return contextText;
    }
);
