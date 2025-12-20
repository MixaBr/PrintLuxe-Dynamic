
'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

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
        // Reset file input value to allow re-adding the same file
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

    const handleProcessFiles = async () => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'Нет файлов', description: 'Пожалуйста, выберите файлы для обработки.' });
            return;
        }
        
        startTransition(() => {
            // Placeholder for the actual processing logic
            console.log("Processing files:", files.map(f => f.name));
            toast({ title: 'В разработке', description: 'Функционал обработки файлов будет добавлен на следующем шаге.' });
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
                />
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="text-lg font-semibold">
                        <span className="text-primary">Нажмите, чтобы выбрать</span> или перетащите файлы
                    </p>
                    <p className="text-sm text-muted-foreground">Только PDF. До {MAX_FILES} файлов, общий размер до 50 МБ.</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium">Выбранные файлы ({files.length}):</h4>
                    <div className="w-full rounded-md border">
                        <ScrollArea className="h-48 w-full">
                            <div className='p-2 space-y-2'>
                                {files.map((file, index) => (
                                    <div key={index} className="relative flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileIcon className="h-5 w-5 flex-shrink-0" />
                                            <span className="text-sm truncate font-medium">{file.name}</span>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
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
                        <span>Всего файлов: {files.length} / {MAX_FILES}</span>
                        <span>Общий размер: {(totalSize / 1024 / 1024).toFixed(2)} / 50.00 МБ</span>
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
