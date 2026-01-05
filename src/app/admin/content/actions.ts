
/**
 * @fileOverview Server actions for the content management page.
 * Implements a robust, batch-oriented processing pipeline for PDF and HTML files.
 */
'use server';

import { createAdminClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import pdf from 'pdf-parse';
import * as cheerio from 'cheerio';
import { ai, textEmbeddingGecko } from '@/ai/genkit';

const CHUNK_SIZE = 500; // Characters per chunk
const CHUNK_OVERLAP = 50; // Characters to overlap between chunks

interface Chunk {
    content: string; // For HTML, this will be the HTML content of the chunk
    text_content: string; // This will be the plain text version for embedding
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
    details?: { chunk: Omit<Chunk, 'text_content'>, error: string }[];
}

/**
 * Recursively splits a text into semantic chunks.
 * Starts by splitting into paragraphs, then sentences, then by sliding window as a fallback.
 * @param text The text to split.
 * @param filename The name of the source file.
 * @param chunkNumber The starting chunk number.
 * @returns An array of text chunks.
 */
function recursiveSplitText(text: string, filename: string, chunkNumber: number = 1): Chunk[] {
    const chunks: Chunk[] = [];
    const sanitizedText = text.replace(/\s\s+/g, ' ').trim();

    if (sanitizedText.length === 0) {
        return [];
    }

    // 1. If the text is smaller than the chunk size, it's a perfect chunk.
    if (sanitizedText.length <= CHUNK_SIZE) {
        chunks.push({
            content: sanitizedText,
            text_content: sanitizedText,
            metadata: {
                source_filename: filename,
                chunk_number: chunkNumber,
            },
        });
        return chunks;
    }

    // 2. Try splitting by paragraphs (double newlines).
    const paragraphs = sanitizedText.split(/(\r\n|\n){2,}/);
    if (paragraphs.length > 1) {
        let currentChunkNumber = chunkNumber;
        for (const p of paragraphs) {
            const paragraphChunks = recursiveSplitText(p, filename, currentChunkNumber);
            chunks.push(...paragraphChunks);
            currentChunkNumber += paragraphChunks.length;
        }
        return chunks;
    }

    // 3. If no paragraphs, try splitting by sentences.
    const sentences = sanitizedText.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 1) {
        let currentChunkNumber = chunkNumber;
        let tempChunk = '';
        for (const sentence of sentences) {
            if ((tempChunk + sentence).length > CHUNK_SIZE) {
                if (tempChunk) {
                     chunks.push({
                        content: tempChunk,
                        text_content: tempChunk,
                        metadata: { source_filename: filename, chunk_number: currentChunkNumber++ },
                    });
                }
                tempChunk = sentence;
            } else {
                tempChunk += sentence;
            }
        }
        if (tempChunk) { // Add the last remaining part
            chunks.push({
                content: tempChunk,
                text_content: tempChunk,
                metadata: { source_filename: filename, chunk_number: currentChunkNumber++ },
            });
        }

        // If after sentence splitting, some chunks are still too big, recurse on them
        const finalChunks: Chunk[] = [];
        let finalChunkNumber = chunkNumber;
        for (const chunk of chunks) {
            const subChunks = recursiveSplitText(chunk.text_content, filename, finalChunkNumber);
            finalChunks.push(...subChunks);
            finalChunkNumber += subChunks.length;
        }
        return finalChunks;
    }

    // 4. Fallback to the original sliding window method if no other splits are possible.
    let index = 0;
    while (index < sanitizedText.length) {
        const end = index + CHUNK_SIZE;
        const chunkContent = sanitizedText.substring(index, end);
        chunks.push({
            content: chunkContent,
            text_content: chunkContent,
            metadata: {
                source_filename: filename,
                chunk_number: chunkNumber++,
            },
        });
        index += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}


/**
 * Splits an HTML content into semantic chunks.
 * @param html The full HTML content as a string.
 * @param filename The name of the source file for metadata.
 * @returns An array of HTML chunks.
 */
function splitHtmlIntoChunks(html: string, filename: string): Chunk[] {
    const $ = cheerio.load(html);
    const chunks: Chunk[] = [];
    let chunkNumber = 1;

    // Process semantic blocks. You can extend this selector.
    $('p, h1, h2, h3, h4, li, pre, table').each((_, element) => {
        const $element = $(element);
        const htmlContent = $element.html();
        const textContent = $element.text();

        if (textContent.trim().length > 10 && htmlContent) { // Ignore very short or empty tags
            chunks.push({
                content: `<div>${htmlContent}</div>`, // Wrap in a div to maintain context
                text_content: textContent,
                metadata: {
                    source_filename: filename,
                    chunk_number: chunkNumber++,
                }
            });
        }
    });

    return chunks;
}

/**
 * Receives a file (PDF or HTML), parses it, splits it into chunks, and processes them
 * in batches to generate and store embeddings. This function is designed to be
 * robust and avoid server timeouts.
 * @param prevState - The previous state from useFormState.
 * @param formData - The form data containing the uploaded file.
 * @returns An ActionResult object detailing the outcome.
 */
export async function processAndEmbedFile(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const file = formData.get('file') as File;
    const clearKB = formData.get('clear_kb') === 'true';


    if (!file || file.size === 0) {
        return { successfulCount: 0, failedCount: 0, message: 'Файл не найден или пуст.' };
    }
    
    if (clearKB) {
        console.log('Clearing knowledge base before embedding...');
        const supabase = createAdminClient();
        const { error } = await supabase.from('manual_knowledge').delete().gt('id', 0);
        if (error) {
             return { successfulCount: 0, failedCount: 0, message: `Ошибка очистки базы знаний: ${error.message}` };
        }
        console.log('Knowledge base cleared successfully.');
    }


    try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        let chunks: Chunk[];

        // 1. Parse file based on its type and split into chunks
        if (file.type === 'application/pdf') {
            const pdfData = await pdf(fileBuffer);
            if (!pdfData.text) {
                 return { successfulCount: 0, failedCount: 0, message: `Не удалось извлечь текст из PDF файла ${file.name}.` };
            }
            chunks = recursiveSplitText(pdfData.text, file.name);
        } else if (file.type === 'text/html') {
            const htmlContent = fileBuffer.toString('utf-8');
            chunks = splitHtmlIntoChunks(htmlContent, file.name);
        } else {
            return { successfulCount: 0, failedCount: 0, message: `Неподдерживаемый тип файла: ${file.type}.` };
        }
        
        if (chunks.length === 0) {
             return { successfulCount: 0, failedCount: 0, message: 'Не удалось создать фрагменты из файла.' };
        }
        
        const supabase = createAdminClient();
        let totalSuccess = 0;
        let totalFailed = 0;
        const failedChunksDetails: ActionResult['details'] = [];

        // 2. Process chunks one by one to avoid rate limiting
        for (const chunk of chunks) {
            try {
                console.log(`[Embedding Start] Processing chunk #${chunk.metadata.chunk_number} for ${file.name}`);
                
                const embeddingResponse = await ai.embed({
                    embedder: textEmbeddingGecko,
                    content: chunk.text_content,
                });
                
                const embedding = embeddingResponse[0]?.embedding;

                if (!embedding) {
                    throw new Error(`Не удалось сгенерировать эмбеддинг для фрагмента №${chunk.metadata.chunk_number}`);
                }

                const { error: insertError } = await supabase
                    .from('manual_knowledge')
                    .insert({
                        content: chunk.content,
                        metadata: chunk.metadata,
                        embedding: embedding,
                    });

                if (insertError) {
                    throw new Error(`Ошибка при сохранении в базу данных: ${insertError.message}`);
                }
                
                totalSuccess++;

            } catch (chunkError: any) {
                console.error(`[Embedding Failed] Chunk #${chunk.metadata.chunk_number} Error Details:`, JSON.stringify(chunkError, null, 2));
                totalFailed++;
                const { text_content, ...chunkForDetails } = chunk;
                const errorMessage = chunkError.cause?.message || chunkError.message || 'Неизвестная ошибка при обработке фрагмента.';
                failedChunksDetails.push({
                    chunk: chunkForDetails,
                    error: errorMessage,
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
