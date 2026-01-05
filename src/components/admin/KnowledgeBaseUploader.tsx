
'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UploadCloud, File as FileIcon, X, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { processAndEmbedFile, type ActionResult } from '@/app/admin/content/actions';
import { clearKnowledgeBase } from '@/app/admin/settings/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB per file
const ACCEPTED_FILE_TYPES = ['application/pdf', 'text/html'];

const initialState: ActionResult = {
    successfulCount: 0,
    failedCount: 0,
    message: ''
};

export function KnowledgeBaseUploader() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [clearKB, setClearKB] = useState(false);
    
    // State to hold results for each processed file
    const [processResults, setProcessResults] = useState<({ fileName: string } & ActionResult)[]>([]);

    const handleFilesChange = (newFiles: FileList | null) => {
        if (!newFiles) return;

        let addedFiles: File[] = [];
        let errorOccurred = false;

        for (const file of Array.from(newFiles)) {
            if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                toast({ variant: "destructive", title: "Неверный тип файла", description: `"${file.name}" имеет недопустимый тип. Разрешены PDF и HTML.` });
                errorOccurred = true;
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast({ variant: "destructive", title: "Файл слишком большой", description: `"${file.name}" превышает лимит в 25 МБ.` });
                errorOccurred = true;
                continue;
            }
            addedFiles.push(file);
        }

        if (files.length + addedFiles.length > MAX_FILES) {
            toast({ variant: "destructive", title: "Слишком много файлов", description: `Можно выбрать не более ${MAX_FILES} файлов.` });
            return;
        }

        setFiles(prevFiles => [...prevFiles, ...addedFiles]);
        if (errorOccurred && fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const removeFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };
    
    const handleProcessFiles = () => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'Нет файлов', description: 'Пожалуйста, выберите файлы для обработки.' });
            return;
        }

        startTransition(async () => {
            setProcessResults([]); // Clear previous results
            const results: ({ fileName: string } & ActionResult)[] = [];
            
            for (const file of files) {
                toast({ title: `Начало обработки файла: ${file.name}` });
                const formData = new FormData();
                formData.append('file', file);
                 if (clearKB) {
                    formData.append('clear_kb', 'true');
                }

                
                // We are not using useFormState here to handle multiple calls in a loop
                const result = await processAndEmbedFile(initialState, formData);

                if (result.failedCount > 0) {
                     toast({ variant: 'destructive', title: `Ошибки в файле ${file.name}`, description: result.message });
                     console.error(`Ошибки обработки файла ${file.name}:`, result.details);
                } else {
                     toast({ title: 'Успех!', description: result.message });
                }
                
                results.push({ fileName: file.name, ...result });
                setProcessResults([...results]); // Update state after each file
            }
            
            setFiles([]); // Clear file list after processing is done
            setClearKB(false);
        });
    }

    const handleClearKnowledgeBase = () => {
        startTransition(async () => {
            const result = await clearKnowledgeBase();
             if (result.success) {
                toast({ title: 'Успех!', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Ошибка', description: result.message });
            }
        });
    }

    return (
        <div className="space-y-6">
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
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="application/pdf,text/html"
                    onChange={(e) => handleFilesChange(e.target.files)}
                    disabled={isPending}
                />
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="text-lg font-semibold">
                        <span className="text-primary">Нажмите, чтобы выбрать</span> или перетащите файлы
                    </p>
                    <p className="text-sm text-muted-foreground">PDF и HTML. До ${MAX_FILES} файлов, каждый до 25 МБ.</p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium">Выбранные файлы ({files.length}):</h4>
                    <div className="w-full rounded-md border">
                        <ScrollArea className="h-48 w-full">
                            <div className='p-2 space-y-2'>
                                {files.map((file, index) => (
                                    <div key={file.name + index} className="relative flex items-center justify-between p-2 bg-muted/50 rounded-md">
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
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="clear-kb" checked={clearKB} onCheckedChange={(checked) => setClearKB(!!checked)} disabled={files.length === 0} />
                    <Label htmlFor="clear-kb" className={cn(files.length === 0 && 'text-muted-foreground')}>Очистить базу знаний перед загрузкой</Label>
                </div>
                <div className='flex items-center gap-2'>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isPending}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Очистить БЗ
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Вы уверены, что хотите очистить Базу Знаний?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие приведет к полному удалению всех загруженных ранее документов и их фрагментов. Восстановить их будет невозможно.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearKnowledgeBase} disabled={isPending}>
                                 {isPending ? 'Очистка...' : 'Да, очистить'}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

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
            
             {processResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Результаты обработки</CardTitle>
                        <CardDescription>Отчет о последней сессии загрузки файлов.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-60">
                            <div className="space-y-2">
                                {processResults.map((result, index) => (
                                    <div key={index} className={cn(
                                        "flex items-start gap-4 p-3 rounded-lg",
                                        result.failedCount > 0 ? "bg-destructive/10" : "bg-green-500/10"
                                    )}>
                                        {result.failedCount > 0 
                                            ? <AlertCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                                            : <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                        }
                                        <div>
                                            <p className="font-semibold text-sm">{result.fileName}</p>
                                            <p className="text-xs">{result.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

        </div>
    )
}

    