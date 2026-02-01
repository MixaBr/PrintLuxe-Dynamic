'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/service';
import { textEmbeddingGecko } from '@/ai/genkit';

const KNOWN_MANUFACTURERS = ['epson', 'canon', 'hp', 'brother', 'kyocera', 'xerox'];

function extractTechnicalFilters(query: string): { manufacturer: string | null; models: string[] } {
    const lowerCaseQuery = query.toLowerCase();
    const manufacturer = KNOWN_MANUFACTURERS.find(m => lowerCaseQuery.includes(m)) || null;
    const modelRegex = /([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)/g;
    const models = lowerCaseQuery.match(modelRegex) || [];
    const filteredModels = models.filter(model => 
        model.length > 2 &&
        !KNOWN_MANUFACTURERS.includes(model)
    );
    return { manufacturer, models: filteredModels };
}

function cleanQueryForEmbedding(query: string, manufacturer: string | null, models: string[]): string {
    let cleanedQuery = query.toLowerCase();
    if (manufacturer) {
        cleanedQuery = cleanedQuery.replace(new RegExp(manufacturer, 'gi'), '');
    }
    models.forEach(model => {
        cleanedQuery = cleanedQuery.replace(new RegExp(model, 'gi'), '');
    });
    // Убираем лишние пробелы, которые могли остаться после замены
    return cleanedQuery.replace(/\s+/g, ' ').trim();
}

export const technicalSearchTool = ai.defineTool(
    {
        name: 'technicalSearchTool',
        description: 'Searches the knowledge base for technical information like product specs, troubleshooting, repairs, and parts.',
        inputSchema: z.object({
            query: z.string().describe('The full, original user query for technical questions.'),
        }),
        outputSchema: z.string().describe('A formatted string containing the context for the final answer, or a message indicating no results were found.'),
    },
    async (input) => {
        console.log('======== TECHNICAL SEARCH TOOL CALLED ========');
        console.log(`Original query: "${input.query}"`);

        const supabase = createAdminClient();

        const { manufacturer, models } = extractTechnicalFilters(input.query);
        
        const filter_metadata: any = {
            category: 'technical'
        };
        if (manufacturer) {
            filter_metadata.manufacturer = manufacturer;
            console.log(`Applied manufacturer filter: ${manufacturer}`);
        }
        if (models.length > 0) {
            filter_metadata.device_models = models;
            console.log(`Applied device models filter: ${models.join(', ')}`);
        }

        const cleanedQuery = cleanQueryForEmbedding(input.query, manufacturer, models);
        console.log(`Cleaned query for embedding: "${cleanedQuery}"`);

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
            content: cleanedQuery, // Используем очищенный запрос
        });

        const { data: documents, error: matchError } = await supabase.rpc('match_manual_knowledge', {
            query_embedding: embeddingResponse[0].embedding,
            match_threshold,
            match_count,
            filter_metadata,
            is_array_contains: true
        });

        if (matchError) {
            console.error('Error matching documents:', matchError);
            return `Произошла ошибка при поиске в базе знаний: ${matchError.message}`;
        }

        if (!documents || documents.length === 0) {
            console.log('No relevant documents found.');
            return 'К сожалению, по вашему запросу не найдено ни одного документа в базе знаний. Попробуйте переформулировать вопрос.';
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