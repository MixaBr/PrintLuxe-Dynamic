
/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 * This tool is now configurable via the `app_config` table in Supabase.
 * It also handles short/ambiguous queries by generating clarifying questions.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

// This is the SQL function we created in Supabase
const MATCH_FUNCTION = 'match_manual_knowledge';
const SHORT_QUERY_WORD_COUNT = 3; // Queries with fewer words will trigger question generation

// Helper to get search configuration from the database
async function getSearchConfig() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['bot_kb_match_threshold', 'bot_kb_match_count', 'bot_kb_clarifying_prompt', 'bot_prompt_extract_model']);

    if (error) {
        console.error("Error fetching knowledge base config:", error.message);
        // Return safe defaults in case of DB error
        return {
            matchThreshold: 0.8,
            matchCount: 5,
            clarifyingPrompt: '',
            extractModelPrompt: ''
        };
    }

    const config = data.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string | null>);
    
    const matchThreshold = parseFloat(config.bot_kb_match_threshold || '0.8');
    const matchCount = parseInt(config.bot_kb_match_count || '5', 10);
    const clarifyingPrompt = config.bot_kb_clarifying_prompt || '';
    const extractModelPrompt = config.bot_prompt_extract_model || '';

    return {
        matchThreshold: isNaN(matchThreshold) ? 0.8 : matchThreshold,
        matchCount: isNaN(matchCount) ? 5 : matchCount,
        clarifyingPrompt,
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
        outputSchema: z.string().describe('A string containing the most relevant context from the knowledge base, clarifying questions for an ambiguous query, or a message indicating no relevant information was found.'),
    },
    async ({ query }, context) => {
        console.log(`======== KNOWLEDGE BASE TOOL CALLED ========`);
        console.log(`Searching for: "${query}"`);

        const { matchThreshold, matchCount, clarifyingPrompt, extractModelPrompt } = await getSearchConfig();
        const words = query.trim().split(/\s+/);

        // 1. Handle short/ambiguous queries by generating clarifying questions
        if (words.length < SHORT_QUERY_WORD_COUNT) {
            console.log(`Query is short. Generating clarifying questions.`);

            if (!clarifyingPrompt) {
                 console.warn('Clarifying prompt is not configured in app_config. Skipping question generation.');
                 // Fallback to direct search
            } else {
                const finalClarifyingPrompt = clarifyingPrompt.replace('{{query}}', query);

                const llmResponse = await ai.generate({
                    model: 'googleai/gemini-2.5-flash',
                    prompt: finalClarifyingPrompt,
                });

                return llmResponse.text;
            }
        }

        // 2. Extract device model from query for filtering
        let filterMetadata = {};
        if (extractModelPrompt) {
            const modelExtractionLlmResponse = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                prompt: extractModelPrompt.replace('{{query}}', query),
            });
            const extractedModel = modelExtractionLlmResponse.text.trim();
            
            if (extractedModel && extractedModel.toLowerCase() !== 'null') {
                console.log(`Extracted device model for filtering: "${extractedModel}"`);
                filterMetadata = { device_model: extractedModel }; // Use the new, precise filter
            } else {
                console.log('No specific device model found in query.');
            }
        }

        // 3. Proceed with vector search for detailed queries
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

        // The RPC function is now called with the filter object
        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            filter_metadata: filterMetadata
        });

        if (error) {
            console.error('Error searching knowledge base:', error);
            return 'Произошла ошибка при поиске в базе знаний.';
        }

        if (!documents || documents.length === 0) {
            console.log(`Found 0 relevant documents.`);
            console.log(`============================================`);
            return 'В базе знаний не найдено релевантной информации по вашему вопросу.';
        }
        
        console.log(`Found ${documents.length} relevant documents. (Logging details below)`);
        console.log(`================= FOUND DOCUMENTS (DEBUG) =================`);
        documents.forEach((doc: any) => {
            console.log({
                id: doc.id,
                similarity: doc.similarity,
                metadata: doc.metadata,
                content_preview: doc.content.substring(0, 100) + '...'
            });
        });
        console.log(`===========================================================`);

        const contextText = documents
            .map((doc: any) => `- Источник: ${doc.metadata?.source_filename || 'Неизвестно'} (Модель: ${doc.metadata?.device_model || 'N/A'})\n  Содержание: ${doc.content}`)
            .join('\n\n');

        return contextText;
    }
);
