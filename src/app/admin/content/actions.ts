/**
 * @fileOverview Server actions for the content management page.
 */
'use server';

import { embed } from 'genkit';
import { textEmbeddingGecko } from '@/ai/genkit';
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
 * Processes text chunks, generates embeddings for them, and stores them in the database.
 * @param chunks - An array of text chunks with metadata.
 * @returns An object indicating success or failure.
 */
export async function embedAndStoreChunks(chunks: Chunk[]) {
    if (!chunks || chunks.length === 0) {
        return { error: 'Нет фрагментов для обработки.' };
    }

    try {
        // 1. Generate embeddings for all chunks in parallel.
        const embeddings = await embed({
            embedder: textEmbeddingGecko,
            content: chunks.map(chunk => chunk.content),
        });

        if (embeddings.length !== chunks.length) {
            throw new Error('Количество сгенерированных вложений не соответствует количеству фрагментов.');
        }

        // 2. Prepare data for Supabase insertion.
        const dataToInsert = chunks.map((chunk, index) => ({
            content: chunk.content,
            metadata: chunk.metadata,
            embedding: embeddings[index],
        }));

        // 3. Insert data into the database.
        const supabase = createAdminClient();
        const { error: insertError } = await supabase
            .from('manual_knowledge')
            .insert(dataToInsert);

        if (insertError) {
            throw new Error(`Ошибка при сохранении в базу данных: ${insertError.message}`);
        }

        // 4. Revalidate path to reflect changes if needed.
        revalidatePath('/admin/content');

        return { success: `Успешно обработано и сохранено ${chunks.length} фрагментов.` };

    } catch (error: any) {
        console.error('Ошибка при обработке и сохранении фрагментов:', error);
        return { error: error.message || 'Произошла неизвестная ошибка на сервере.' };
    }
}
