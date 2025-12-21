
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

interface Chunk {
    content: string;
    metadata: {
        source_filename: string;
        chunk_number: number;
    }
}

/**
 * Processes a batch of text chunks, generates embeddings for them in parallel, 
 * and stores them in the database.
 * @param chunks - An array of text chunks with metadata (a single batch).
 * @returns An object indicating the outcome of the operation, including details on any failures.
 */
export async function embedAndStoreChunks(chunks: Chunk[]) {
    if (!chunks || chunks.length === 0) {
        return { error: 'Нет фрагментов для обработки.' };
    }

    try {
        const supabase = createAdminClient();

        // 1. Generate embeddings for all chunks in the batch in parallel.
        const embeddings = await ai.embed({
            embedder: textEmbeddingGecko,
            content: chunks.map(chunk => chunk.content),
        });

        // 2. Prepare data for Supabase insertion, matching chunks with their embeddings.
        const dataToInsert = chunks.map((chunk, i) => ({
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: embeddings[i].embedding,
        }));

        // 3. Insert all prepared data into the database in a single request.
        const { error: insertError } = await supabase
            .from('manual_knowledge')
            .insert(dataToInsert);

        if (insertError) {
            throw new Error(`Ошибка при сохранении в базу данных: ${insertError.message}`);
        }

        // Revalidate path to reflect changes.
        revalidatePath('/admin/content');

        return { successCount: chunks.length };

    } catch (error: any) {
        const errorMessage = `Ошибка при обработке пакета: ${error.message}`;
        console.error(errorMessage, { chunksCount: chunks.length });
        return {
            error: errorMessage,
            details: chunks.map(chunk => ({ chunk, error: error.message }))
        };
    }
}
