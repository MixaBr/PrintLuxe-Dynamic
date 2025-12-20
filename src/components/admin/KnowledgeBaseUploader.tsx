
'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import pdf from 'pdf-parse';
import { embedAndStoreChunks } from '@/app/admin/content/actions';

// Polyfill for Buffer used by pdf-parse in the browser
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
    (window as any).Buffer = require('buffer/').Buffer;
}


const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB
const CHUNK_SIZE = 500; // Characters per chunk
const CHUNK_OVERLAP = 50; // Characters to overlap between chunks


export function KnowledgeBaseUploader() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    const handleFilesChange = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const filesArray = Array.from(newFiles).filter(file => file.type === 'application/pdf');

        if (filesArray.length === 0) {
            toast({ variant: "destructive", title: "Ошибка", description: `Можно загружать только PDF файлы.` });
            return;
        }

        if (files.length + filesArray.length > MAX_FILES) {
            toast({ variant: "destructive", title: "Ошибка", description: `Можно загрузить не более ${MAX_FILES} файлов за раз.` });
            return;
        }

        const combinedSize = files.reduce((acc, f) => acc + f.size, 0) + filesArray.reduce((acc, f) => acc + f.size, 0);
        if (combinedSize > MAX_TOTAL_SIZE) {
            toast({ variant: "destructive", title: "Ошибка", description: `Общий размер файлов не должен превышать 50 МБ.` });
            return;
        }

        setFiles(prevFiles => [...prevFiles, ...filesArray]);
    };

    const removeFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const processPdfToText = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async () => {
                try {
                    const buffer = Buffer.from(reader.result as ArrayBuffer);
                    const data = await pdf(buffer);
                    resolve(data.text);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
        });
    }

    const splitTextIntoChunks = (text: string, filename: string) => {
        const chunks = [];
        let index = 0;
        let chunkNumber = 1;
        while (index < text.length) {
            const chunk = text.substring(index, index + CHUNK_SIZE);
            chunks.push({
                content: chunk,
                metadata: {
                    source_filename: filename,
                    chunk_number: chunkNumber++,
                }
            });
            index += CHUNK_SIZE - CHUNK_OVERLAP;
        }
        return chunks;
    }


    const handleProcessFiles = async () => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'Нет файлов', description: 'Пожалуйста, выберите файлы для обработки.' });
            return;
        }
        
        startTransition(async () => {
            try {
                toast({ title: 'Начало обработки...', description: `Обрабатывается ${files.length} файлов.` });

                let allChunks = [];
                for (const file of files) {
                    const text = await processPdfToText(file);
                    const chunks = splitTextIntoChunks(text, file.name);
                    allChunks.push(...chunks);
                }

                if(allChunks.length === 0) {
                    toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось извлечь текст из файлов.' });
                    return;
                }

                toast({ title: 'Текст извлечен', description: `Создано ${allChunks.length} фрагментов. Отправка на сервер...` });

                const result = await embedAndStoreChunks(allChunks);

                if (result.error) {
                    throw new Error(result.error);
                }

                toast({ title: 'Успех!', description: result.success });
                setFiles([]);


            } catch(error: any) {
                toast({ variant: 'destructive', title: 'Ошибка обработки', description: error.message });
            }
        });
    }

    return (
        <div className="space-y-4">
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative flex flex-col justify-center w-full min-h-[12rem] border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    "border-muted-foreground/50 hover:border-primary hover:bg-primary/5",
                    isDragging && "border-primary bg-primary/10"
                )}
            >
                <Input
                    id="file-upload"
                    name="file"
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="application/pdf"
                    onChange={(e) => handleFilesChange(e.target.files)}
                    disabled={isPending}
                />
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="text-lg font-semibold">
                        <span className="text-primary">Нажмите, чтобы выбрать</span> или перетащите файлы
                    </p>
                    <p className="text-sm text-muted-foreground">Только PDF. До ${MAX_FILES} файлов, общий размер до 50 МБ.</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium">Выбранные файлы (${files.length}):</h4>
                    <div className="w-full rounded-md border">
                        <ScrollArea className="h-48 w-full">
                            <div className='p-2 space-y-2'>
                                {files.map((file, index) => (
                                    <div key={index} className="relative flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileIcon className="h-5 w-5 flex-shrink-0" />
                                            <span className="text-sm truncate font-medium">{file.name}</span>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:bg-destructive/20"
                                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                            disabled={isPending}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                     <div className='flex justify-between text-sm text-muted-foreground mt-1'>
                        <span>Всего файлов: ${files.length} / ${MAX_FILES}</span>
                        <span>Общий размер: ${(totalSize / 1024 / 1024).toFixed(2)} / 50.00 МБ</span>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleProcessFiles} disabled={isPending || files.length === 0} size="lg">
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Обработка...
                        </>
                    ) : 'Обработать и добавить в БЗ'}
                </Button>
            </div>
        </div>
    )
}
