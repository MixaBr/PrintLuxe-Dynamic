
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
const MATCH_THRESHOLD = 0.75; // A reasonable default threshold for similarity.
const MATCH_COUNT = 5;       // Return top 5 most relevant chunks.

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

        // Perform a generic search across all documents without filtering by metadata.
        const { data: documents, error } = await supabase.rpc(MATCH_FUNCTION, {
            query_embedding: embedding,
            match_threshold: MATCH_THRESHOLD,
            match_count: MATCH_COUNT,
            filter_metadata: {}, // Empty filter searches all documents
        });

        if (error) {
            console.error('Ошибка при поиске в базе знаний:', error);
            return 'Произошла ошибка при поиске в базе знаний.';
        }

        if (!documents || documents.length === 0) {
            console.log(`Found 0 relevant documents.`);
            console.log(`============================================`);
            // Generic "not found" message is more appropriate now.
            return 'К сожалению, я не нашел точной информации по вашему запросу во внутренней базе знаний. Попробуйте переформулировать вопрос.';
        }
        
        console.log(`Found ${documents.length} relevant documents. (Logging details below)`);
        documents.forEach((doc: any, index: number) => {
            console.log(`  [Doc ${index + 1}] Similarity: ${doc.similarity}, Source: ${doc.metadata?.source_filename || 'N/A'}`);
        });

        // Simplified context string, as we no longer have specific metadata like manufacturer.
        const contextText = documents
            .map((doc: any) => `Источник: ${doc.metadata?.source_filename || 'Неизвестно'}\nСодержание: ${doc.content}`)
            .join('\n\n---\n\n');

        console.log('KNOWLEDGE BASE SEARCH: Final Context', contextText);
        return contextText;
    }
);
