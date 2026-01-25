
/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 * This tool is now generalized to search across all indexed documents,
 * making it suitable for both technical manuals and legal documents.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

const MATCH_FUNCTION = 'match_manual_knowledge';

export const knowledgeBaseTool = ai.defineTool(
    {
        name: 'knowledgeBaseTool',
        description: 'Searches the internal knowledge base for technical information about product specifications, troubleshooting, and repairs. Use this for specific technical questions about devices.',
        inputSchema: z.object({
            query: z.string().describe('The user question to search for in the knowledge base.'),
        }),
        outputSchema: z.string().describe('A string containing the most relevant context from the knowledge base, or a message if no information was found.'),
    },
    async ({ query }) => {
        console.log(`======== KNOWLEDGE BASE TOOL CALLED ========`);
        console.log(`Searching for: "${query}"`);

        const embeddingResponse = await ai.embed({
            embedder: textEmbeddingGecko,
            content: query,
        });

        const embedding = embeddingResponse[0]?.embedding;

        if (!embedding) {
            return 'Произошла ошибка при обработке вашего запроса для поиска.';
        }

        const supabase = createAdminClient();

        // Get search settings from the app_config table
        let matchThreshold = 0.75; // Default fallback value
        let matchCount = 5;       // Default fallback value

        const { data: settings, error: settingsError } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['bot_kb_match_threshold', 'bot_kb_match_count']);

        if (settingsError) {
            console.error('Error fetching search settings from app_config:', settingsError);
            // Continue with default settings in case of an error
        } else if (settings) {
            const thresholdSetting = settings.find(s => s.key === 'bot_kb_match_threshold');
            const countSetting = settings.find(s => s.key === 'bot_kb_match_count');

            if (thresholdSetting && !isNaN(parseFloat(thresholdSetting.value))) {
                matchThreshold = parseFloat(thresholdSetting.value);
            }
            if (countSetting && !isNaN(parseInt(countSetting.value, 10))) {
                matchCount = parseInt(countSetting.value, 10);
            }
        }
        
        console.log(`Using search params: threshold=${matchThreshold}, count=${matchCount}`);

        // Define the search function to avoid code duplication
        const doSearch = async () => {
            return await supabase.rpc(MATCH_FUNCTION, {
                query_embedding: embedding,
                match_threshold: matchThreshold,
                match_count: matchCount,
                filter_metadata: {},
            });
        };

        let { data: documents, error } = await doSearch();

        // If the first attempt fails, wait 1 second and try again
        if (error) {
            console.warn('Initial knowledge base search failed. Retrying in 1 second...', error);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const retryResult = await doSearch();
            documents = retryResult.data;
            error = retryResult.error;
        }

        if (error) {
            console.error('Knowledge base search failed after retry:', error);
            return 'К сожалению, в данный момент база знаний недоступна. Пожалуйста, повторите ваш запрос немного позже.';
        }

        if (!documents || documents.length === 0) {
            console.log(`Found 0 relevant documents.`);
            console.log(`============================================`);
            return 'К сожалению, я не нашел точной информации по вашему запросу во внутренней базе знаний. Попробуйте переформулировать вопрос.';
        }
        
        console.log(`Found ${documents.length} relevant documents. (Logging details below)`);
        documents.forEach((doc: any, index: number) => {
            console.log(`  [Doc ${index + 1}] Similarity: ${doc.similarity}, Source: ${doc.metadata?.source_filename || 'N/A'}`);
        });

        const contextText = documents
            .map((doc: any) => `Источник: ${doc.metadata?.source_filename || 'Неизвестно'}\nСодержание: ${doc.content}`)
            .join('\n\n---\n\n');

        console.log('KNOWLEDGE BASE SEARCH: Final Context', contextText);
        return contextText;
    }
);
