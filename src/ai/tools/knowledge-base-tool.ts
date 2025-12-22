/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 * This tool is now configurable via the `app_config` table in Supabase.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { z } from 'zod';

// This is the SQL function we created in Supabase
const MATCH_FUNCTION = 'match_manual_knowledge';

// Helper to get search configuration from the database
async function getSearchConfig() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['bot_kb_match_threshold', 'bot_kb_match_count']);

    if (error) {
        console.error("Error fetching knowledge base config:", error.message);
        // Return safe defaults in case of DB error
        return {
            matchThreshold: 0.5,
            matchCount: 5,
        };
    }

    const config = data.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {} as Record<string, string | null>);
    
    const matchThreshold = parseFloat(config.bot_kb_match_threshold || '0.5');
    const matchCount = parseInt(config.bot_kb_match_count || '5', 10);

    return {
        matchThreshold: isNaN(matchThreshold) ? 0.5 : matchThreshold,
        matchCount: isNaN(matchCount) ? 5 : matchCount,
    };
}


export const knowledgeBaseTool = ai.defineTool(
    {
        name: 'knowledgeBaseTool',
        description: 'Use this tool to answer user questions about product specifications, troubleshooting, repairs, or user manuals. The tool searches the knowledge base for relevant information.',
        inputSchema: z.object({
            query: z.string().describe('The user question to search for in the knowledge base.'),
        }),
        // The output is now the raw context for the expert prompt.
        outputSchema: z.string().describe('A string containing the most relevant context from the knowledge base, or a message indicating no relevant information was found.'),
    },
    async ({ query }) => {
        console.log(`======== KNOWLEDGE BASE TOOL CALLED ========`);
        console.log(`Searching for: "${query}"`);

        // 1. Get search configuration from the database
        const { matchThreshold, matchCount } = await getSearchConfig();
        console.log(`Using search config: threshold=${matchThreshold}, count=${matchCount}`);

        // 2. Generate an embedding for the user's query.
        const embeddings = await ai.embed({
            embedder: textEmbeddingGecko,
            content: query,
        });

        const embedding = embeddings[0]?.embedding;

        if (!embedding) {
            return 'Произошла ошибка при создании эмбеддинга для вашего запроса.';
        }

        const supabase = createAdminClient();

        // 3. Call the Supabase RPC function with configurable parameters.
        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
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
        // New detailed logging block
        console.log(`================= FOUND DOCUMENTS (DEBUG) =================`);
        documents.forEach((doc: any) => {
            console.log({
                id: doc.id, // The record ID from Supabase
                similarity: doc.similarity, // The relevance score
                metadata: doc.metadata,
                content_preview: doc.content.substring(0, 100) + '...' // A short preview
            });
        });
        console.log(`===========================================================`);


        // 4. Format the found documents into a single context string for the LLM.
        const contextText = documents
            .map((doc: any) => `- Источник: ${doc.metadata?.source_filename || 'Неизвестно'}\n  Содержание: ${doc.content}`)
            .join('\n\n');

        return contextText;
    }
);
