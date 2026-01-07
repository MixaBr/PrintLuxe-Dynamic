
/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 * This tool is now configurable via the `app_config` table in Supabase.
 * It now extracts both manufacturer and model for precise, filtered searches.
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
        .in('key', ['bot_kb_match_threshold', 'bot_kb_match_count', 'bot_prompt_extract_model']);

    if (error) {
        console.error("Error fetching knowledge base config:", error.message);
        // Return safe defaults if DB query fails
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
        outputSchema: z.string().describe('A string containing the most relevant context from the knowledge base, or a message indicating that no information was found.'),
    },
    async ({ query }, context: any) => {
        console.log(`======== KNOWLEDGE BASE TOOL CALLED ========`);
        console.log(`Searching for: "${query}"`);

        const { matchThreshold, matchCount, extractModelPrompt } = await getSearchConfig();
        
        let filterMetadata: Record<string, any> = {};

        if (extractModelPrompt) {
            try {
                const modelExtractionLlmResponse = await ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    prompt: extractModelPrompt.replace('{{query}}', query),
                });

                // Attempt to parse the JSON response from the model
                let jsonString = modelExtractionLlmResponse.text.trim();
                // Clean up potential markdown formatting
                jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
                
                const extractedData = JSON.parse(jsonString);

                if (extractedData.manufacturer) {
                    filterMetadata.manufacturer = extractedData.manufacturer;
                }
                if (extractedData.model) {
                    filterMetadata.device_models = [extractedData.model];
                }

                console.log(`Extracted metadata for filtering:`, filterMetadata);

            } catch (e: any) {
                console.error('Error parsing metadata extraction response:', e.message);
                // Proceed without filter if extraction fails
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

        if (!embedding) {
            return 'Произошла ошибка при создании эмбеддинга для вашего запроса.';
        }

        const supabase = createAdminClient();

        // Perform the RPC call to the match_manual_knowledge function
        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            filter_metadata: filterMetadata,
            is_array_contains: true // New parameter to control jsonb operator
        });


        if (error) {
            console.error('Ошибка при поиске в базе знаний:', error);
            return 'Произошла ошибка при поиске в базе знаний.';
        }

        if (!documents || documents.length === 0) {
            console.log(`Found 0 relevant documents.`);
            console.log(`============================================`);
            return 'К сожалению, я не нашел информации по вашему запросу. Попробуйте переформулировать его или указать модель устройства.';
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
