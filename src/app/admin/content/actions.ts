/**
 * @fileOverview Server actions for the content management page.
 * Implements a robust, batch-oriented processing pipeline for PDF files.
 */
'use server';

import { ai, textEmbeddingGecko } from '@/ai/genkit';
import { createAdminClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import pdf from 'pdf-parse';

// These polyfills are necessary for pdf-parse to work in the Next.js Edge/Serverless environment.
if (typeof (global as any).Buffer === 'undefined') {
    (global as any).Buffer = require('buffer/').Buffer;
}
if (typeof (global as any).btoa === 'undefined') {
    (global as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

const CHUNK_SIZE = 500; // Characters per chunk
const CHUNK_OVERLAP = 50; // Characters to overlap between chunks
const BATCH_SIZE = 20;  // Number of chunks to process per server request

interface Chunk {
    content: string;
    metadata: {
        source_filename: string;
        chunk_number: number;
    }
}

/**
 * Defines the unified return structure for the processAndEmbedFile function.
 */
export interface ActionResult {
    successfulCount: number;
    failedCount: number;
    message: string;
    details?: { chunk: Chunk, error: string }[];
}

/**
 * Splits a long text into smaller, overlapping chunks.
 * @param text The full text content.
 * @param filename The name of the source file for metadata.
 * @returns An array of text chunks.
 */
function splitTextIntoChunks(text: string, filename: string): Chunk[] {
    const chunks: Chunk[] = [];
    let index = 0;
    let chunkNumber = 1;
    while (index < text.length) {
        const end = index + CHUNK_SIZE;
        const chunkContent = text.substring(index, end);
        chunks.push({
            content: chunkContent,
            metadata: {
                source_filename: filename,
                chunk_number: chunkNumber++,
            }
        });
        index += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
}


/**
 * Receives a PDF file, parses it, splits it into chunks, and processes them
 * in batches to generate and store embeddings. This function is designed to
 * be robust and avoid server timeouts.
 * @param prevState - The previous state from useFormState.
 * @param formData - The form data containing the uploaded file.
 * @returns An ActionResult object detailing the outcome.
 */
export async function processAndEmbedFile(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
        return { successfulCount: 0, failedCount: 0, message: 'Файл не найден или пуст.' };
    }

    try {
        // 1. Parse PDF to text on the server
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdf(fileBuffer);
        
        if (!pdfData.text) {
             return { successfulCount: 0, failedCount: 0, message: `Не удалось извлечь текст из файла ${file.name}.` };
        }

        // 2. Split text into chunks
        const chunks = splitTextIntoChunks(pdfData.text, file.name);
        
        if (chunks.length === 0) {
             return { successfulCount: 0, failedCount: 0, message: 'Не удалось создать фрагменты из текста.' };
        }
        
        const supabase = createAdminClient();
        let totalSuccess = 0;
        let totalFailed = 0;
        const failedChunksDetails: { chunk: Chunk, error: string }[] = [];

        // 3. Process chunks in batches
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            
            try {
                // 3a. Generate embeddings for the current batch
                const embeddingsResponse = await ai.embed({
                    embedder: textEmbeddingGecko,
                    content: batch.map(chunk => ({ content: chunk.content })),
                });

                if (embeddingsResponse.length !== batch.length) {
                    throw new Error("Количество полученных вложений не соответствует количеству фрагментов в пакете.");
                }

                // 3b. Prepare data for insertion
                const dataToInsert = batch.map((chunk, index) => ({
                    content: chunk.content,
                    metadata: chunk.metadata,
                    embedding: embeddingsResponse[index].embedding,
                }));

                // 3c. Insert the batch into the database
                const { error: insertError } = await supabase
                    .from('manual_knowledge')
                    .insert(dataToInsert);

                if (insertError) {
                    // If the whole batch fails, log it and move to the next
                    throw new Error(`Ошибка при сохранении пакета в базу данных: ${insertError.message}`);
                }
                
                totalSuccess += batch.length;

            } catch (batchError: any) {
                totalFailed += batch.length;
                // Add all chunks from the failed batch to the details
                batch.forEach(chunk => {
                    failedChunksDetails.push({
                        chunk: chunk,
                        error: batchError.message || 'Неизвестная ошибка при обработке пакета.',
                    });
                });
            }
        }
        
        if (totalSuccess > 0) {
            revalidatePath('/admin/content');
        }

        let message: string;
        if (totalFailed === 0) {
            message = `Успешно обработано и сохранено ${totalSuccess} фрагментов из файла ${file.name}.`;
        } else {
            message = `Обработка файла ${file.name} завершена. Успешно: ${totalSuccess}, Ошибки: ${totalFailed}.`;
        }

        return {
            successfulCount: totalSuccess,
            failedCount: totalFailed,
            message: message,
            details: failedChunksDetails
        };

    } catch (error: any) {
        return {
            successfulCount: 0,
            failedCount: 0,
            message: `Критическая ошибка при обработке файла ${file.name}: ${error.message}`
        };
    }
}
