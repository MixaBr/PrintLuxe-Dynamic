
/**
 * @fileOverview Server actions for the content management page.
 * Implements a robust, batch-oriented processing pipeline for PDF and HTML files.
 * Now includes logic to extract the manufacturer and multiple device models from filenames.
 */
'use server';

import { createAdminClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import pdf from 'pdf-parse';
import * as cheerio from 'cheerio';
import { ai, textEmbeddingGecko } from '@/ai/genkit';

const CHUNK_SIZE = 500; // Characters per chunk
const CHUNK_OVERLAP = 50; // Characters to overlap between chunks
const BATCH_SIZE = 50; // Number of chunks to process in parallel

interface Chunk {
    content: string; 
    text_content: string; 
    metadata: {
        source_filename: string;
        chunk_number: number;
        manufacturer?: string;
        device_models?: string[];
    }
}

// Defines the base metadata structure before chunk-specific details are added.
type BaseMetadata = Omit<Chunk['metadata'], 'chunk_number'>;

export interface ActionResult {
    successfulCount: number;
    failedCount: number;
    message: string;
    details?: { chunk: Omit<Chunk, 'text_content'>, error: string }[];
}

function extractMetadataFromFilename(filename: string): { manufacturer?: string; models?: string[] } {
    const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
    const parts = nameWithoutExt.split('_').filter(p => p.toLowerCase() !== 'manual' && p.toLowerCase() !== 'series');
    
    if (parts.length === 0) {
        return {};
    }

    const manufacturer = parts[0]; 
    const models = parts.slice(1).filter(part => /\d/.test(part));
    
    return {
        manufacturer: manufacturer,
        models: models.length > 0 ? models : undefined,
    };
}

function recursiveSplitText(text: string, filename: string, metadata: BaseMetadata, chunkNumber: number = 1): Chunk[] {
    const chunks: Chunk[] = [];
    const sanitizedText = text.replace(/\s\s+/g, ' ').trim();

    if (sanitizedText.length === 0) return [];

    if (sanitizedText.length <= CHUNK_SIZE) {
        chunks.push({
            content: sanitizedText,
            text_content: sanitizedText,
            metadata: { ...metadata, chunk_number: chunkNumber },
        });
        return chunks;
    }

    const paragraphs = sanitizedText.split(/(\r\n|\n){2,}/);
    if (paragraphs.length > 1) {
        let currentChunkNumber = chunkNumber;
        for (const p of paragraphs) {
            if (p.trim().length > 0) {
                const paragraphChunks = recursiveSplitText(p, filename, metadata, currentChunkNumber);
                chunks.push(...paragraphChunks);
                currentChunkNumber += paragraphChunks.length;
            }
        }
        if (chunks.length > 0) return chunks;
    }

    const sentences = sanitizedText.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 1) {
        let tempChunk = '';
        const sentenceChunks: string[] = [];
        for (const sentence of sentences) {
            if ((tempChunk + sentence).length > CHUNK_SIZE && tempChunk.length > 0) {
                sentenceChunks.push(tempChunk);
                tempChunk = sentence;
            } else {
                tempChunk += sentence;
            }
        }
        if (tempChunk.length > 0) {
            sentenceChunks.push(tempChunk);
        }

        let currentChunkNumber = chunkNumber;
        for (const sentenceChunk of sentenceChunks) {
             chunks.push({
                content: sentenceChunk,
                text_content: sentenceChunk,
                metadata: { ...metadata, chunk_number: currentChunkNumber++ },
            });
        }
        if (chunks.length > 0) return chunks;
    }

    let index = 0;
    while (index < sanitizedText.length) {
        const end = index + CHUNK_SIZE;
        const chunkContent = sanitizedText.substring(index, end);
        chunks.push({
            content: chunkContent,
            text_content: chunkContent,
            metadata: { ...metadata, chunk_number: chunkNumber++ },
        });
        index += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}

function splitHtmlIntoChunks(html: string, metadata: BaseMetadata): Chunk[] {
    const $ = cheerio.load(html);
    const chunks: Chunk[] = [];
    let chunkNumber = 1;

    $('p, h1, h2, h3, h4, li, pre, table').each((_, element) => {
        const $element = $(element);
        const htmlContent = $element.html();
        const textContent = $element.text();

        if (textContent.trim().length > 10 && htmlContent) {
            chunks.push({
                content: `<div>${htmlContent}</div>`, 
                text_content: textContent,
                metadata: { ...metadata, chunk_number: chunkNumber++ },
            });
        }
    });

    return chunks;
}

export async function processAndEmbedFile(formData: FormData): Promise<ActionResult> {
    const file = formData.get('file') as File;
    const clearKB = formData.get('clear_kb') === 'true';

    if (!file || file.size === 0) {
        return { successfulCount: 0, failedCount: 0, message: 'Файл не найден или пуст.' };
    }
    
    if (clearKB) {
        console.log('Clearing knowledge base via RPC before embedding...');
        const supabase = createAdminClient();
        const { error } = await supabase.rpc('truncate_manual_knowledge');
        if (error) {
             return { successfulCount: 0, failedCount: 0, message: `Ошибка очистки базы знаний: ${error.message}. Убедитесь, что вы создали функцию truncate_manual_knowledge в вашей базе данных.` };
        }
        console.log('Knowledge base cleared successfully via RPC.');
    }

    try {
        const { manufacturer, models } = extractMetadataFromFilename(file.name);
        console.log(`[File Info] Extracted Manufacturer: ${manufacturer || 'N/A'}, Models: ${models?.join(', ') || 'N/A'}`);
        
        const baseMetadata: BaseMetadata = {
            source_filename: file.name,
            manufacturer: manufacturer,
            device_models: models,
        };

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        let chunks: Chunk[];

        if (file.type === 'application/pdf') {
            const pdfData = await pdf(fileBuffer);
            if (!pdfData.text) {
                 return { successfulCount: 0, failedCount: 0, message: `Не удалось извлечь текст из PDF файла ${file.name}.` };
            }
            chunks = recursiveSplitText(pdfData.text, file.name, baseMetadata);
        } else if (file.type === 'text/html') {
            const htmlContent = fileBuffer.toString('utf-8');
            chunks = splitHtmlIntoChunks(htmlContent, baseMetadata);
        } else {
            return { successfulCount: 0, failedCount: 0, message: `Неподдерживаемый тип файла: ${file.type}.` };
        }
        
        if (chunks.length === 0) {
             return { successfulCount: 0, failedCount: 0, message: 'Не удалось создать фрагменты из файла.' };
        }
        console.log(`[Chunking] Created ${chunks.length} chunks from ${file.name}.`);
        
        const supabase = createAdminClient();
        let totalSuccess = 0;
        let totalFailed = 0;
        const failedChunksDetails: ActionResult['details'] = [];

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);
            console.log(`[Batch Start] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)} with ${batch.length} chunks.`);

            try {
                const embeddingPromises = batch.map(chunk => 
                    ai.embed({
                        embedder: textEmbeddingGecko,
                        content: chunk.text_content,
                    }).catch(e => ({ error: e, chunk }))
                );

                const embeddingResults = await Promise.all(embeddingPromises);

                const recordsToInsert: any[] = [];
                const batchFailedChunks: { chunk: Chunk, error: any }[] = [];

                embeddingResults.forEach((result: any, index) => {
                    const chunk = batch[index];
                    if (typeof result === 'object' && result !== null && 'error' in result) {
                        batchFailedChunks.push({ chunk, error: result.error || new Error('Unknown embedding error') });
                    } else if (Array.isArray(result) && result[0]?.embedding) {
                        recordsToInsert.push({
                            content: chunk.content,
                            metadata: chunk.metadata,
                            embedding: result[0].embedding,
                        });
                    } else {
                        batchFailedChunks.push({ chunk, error: new Error('Invalid or empty embedding response') });
                    }
                });

                if (recordsToInsert.length > 0) {
                    const { error: insertError } = await supabase
                        .from('manual_knowledge')
                        .insert(recordsToInsert);

                    if (insertError) {
                        totalFailed += recordsToInsert.length;
                        recordsToInsert.forEach(record => {
                            const { embedding, ...originalChunkData } = record;
                            failedChunksDetails.push({
                                chunk: originalChunkData as Omit<Chunk, 'text_content'>,
                                error: `Ошибка пакетной вставки: ${insertError.message}`,
                            });
                        });
                    } else {
                        totalSuccess += recordsToInsert.length;
                    }
                }

                if (batchFailedChunks.length > 0) {
                    totalFailed += batchFailedChunks.length;
                    batchFailedChunks.forEach(({ chunk, error }) => {
                        const { text_content, ...chunkForDetails } = chunk;
                        const errorMessage = error.cause?.message || error.message || 'Неизвестная ошибка при обработке фрагмента.';
                        failedChunksDetails.push({ chunk: chunkForDetails, error: errorMessage });
                    });
                }

                 console.log(`[Batch End] Finished batch. Current totals - Success: ${totalSuccess}, Failed: ${totalFailed}`);

            } catch (batchError: any) {
                console.error(`[Batch Error] A critical error occurred in a batch:`, batchError);
                const batchFailedCount = batch.length;
                totalFailed += batchFailedCount;
                batch.forEach(chunk => {
                    const { text_content, ...chunkForDetails } = chunk;
                    failedChunksDetails.push({ chunk: chunkForDetails, error: `Критическая ошибка в пакете: ${batchError.message}` });
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
        console.error(`Критическая ошибка при обработке файла ${file.name}:`, error);
        return {
            successfulCount: 0,
            failedCount: 0,
            message: `Критическая ошибка при обработке файла ${file.name}: ${error.message}`
        };
    }
}
