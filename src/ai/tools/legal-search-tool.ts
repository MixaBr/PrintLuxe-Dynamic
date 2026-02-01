'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/service';
import { textEmbeddingGecko } from '@/ai/genkit';

export const legalSearchTool = ai.defineTool(
    {
        name: 'legalSearchTool',
        description: 'Searches the knowledge base for legal information like warranty, returns, and terms of service.',
        inputSchema: z.object({
            query: z.string().describe('The full, original user query for legal questions.'),
        }),
        outputSchema: z.string().describe('A formatted string containing the context for the final answer, or a message indicating no results were found.'),
    },
    async (input) => {
        console.log('======== LEGAL SEARCH TOOL CALLED ========');
        console.log(`Searching for: "${input.query}"`);

        const supabase = createAdminClient();

        const filter_metadata = {
            category: 'legal'
        };
        console.log('Applied category filter: legal');

        const { data: config, error: configError } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['bot_kb_match_count', 'bot_kb_match_threshold']);

        if (configError) {
            console.error('Error fetching search parameters:', configError);
            return 'Произошла ошибка при получении параметров поиска.';
        }
        
        const match_threshold = parseFloat(config.find(c => c.key === 'bot_kb_match_threshold')?.value || '0.5');
        const match_count = parseInt(config.find(c => c.key === 'bot_kb_match_count')?.value || '5', 10);

        console.log(`Using search params: threshold=${match_threshold}, count=${match_count}`);

        const embeddingResponse = await ai.embed({
            embedder: textEmbeddingGecko,
            content: input.query,
        });

        const { data: documents, error: matchError } = await supabase.rpc('match_manual_knowledge', {
            query_embedding: embeddingResponse[0].embedding,
            match_threshold,
            match_count,
            filter_metadata,
            is_array_contains: false
        });

        if (matchError) {
            console.error('Error matching documents:', matchError);
            return `Произошла ошибка при поиске в базе знаний: ${matchError.message}`;
        }

        if (!documents || documents.length === 0) {
            console.log('No relevant documents found.');
            return 'К сожалению, по вашему запросу не найдено ни одного юридического документа в базе знаний. Попробуйте переформулировать вопрос.';
        }

        console.log(`Found ${documents.length} relevant documents.`);
        documents.forEach((doc: any, index: number) => {
            console.log(`  [Doc ${index + 1}] Similarity: ${doc.similarity}, Source: ${doc.metadata?.source_filename || 'N/A'}`);
        });

        const contextText = documents
            .map((doc: any) => `Источник: ${doc.metadata?.source_filename || 'Не указан'}\nСодержимое: ${doc.content}`)
            .join('\n\n---\n\n');
        
        console.log('KNOWLEDGE BASE SEARCH: Final Context', contextText);
        return contextText;
    }
);