/**
 * @fileOverview A Genkit tool for searching the knowledge base.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { embed } from '@genkit-ai/ai';
import { z } from 'zod';

// This is the SQL function we created in Supabase
const MATCH_FUNCTION = 'match_manual_knowledge';

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
        console.log(`Executing knowledgeBaseTool with query: "${query}"`);

        // 1. Generate an embedding for the user's query.
        const embeddings = await embed({
            embedder: textEmbeddingGecko,
            content: [query], // The 'embed' function now expects an array.
        });

        const embedding = embeddings[0]?.embedding; // Extract the first embedding from the array.

        if (!embedding) {
            return 'Произошла ошибка при создании эмбеддинга для вашего запроса.';
        }

        const supabase = createAdminClient();

        // 2. Call the Supabase RPC function to find matching documents.
        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: 0.7, // Similarity threshold (adjust as needed)
            match_count: 5,       // Number of documents to return
        });

        if (error) {
            console.error('Error searching knowledge base:', error);
            // Return an error message that the main flow can handle.
            return 'Произошла ошибка при поиске в базе знаний.';
        }

        if (!documents || documents.length === 0) {
            return 'В базе знаний не найдено релевантной информации по вашему вопросу.';
        }
        
        console.log(`Found ${documents.length} relevant documents.`);

        // 3. Format the found documents into a single context string for the LLM.
        // This is not a user-facing message, but context for the next AI step.
        const contextText = documents
            .map((doc: any) => `- Источник: ${doc.metadata?.source_filename || 'Неизвестно'}\n  Содержание: ${doc.content}`)
            .join('\n\n');

        // Return only the raw context.
        return contextText;
    }
);
