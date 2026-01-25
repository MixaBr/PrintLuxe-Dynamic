
'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { indexDocumentsFromDb } from '@/app/admin/content/actions';
import { Database, Loader2 } from 'lucide-react';

export function DatabaseIndexer() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleIndexing = () => {
        startTransition(async () => {
            toast({ title: 'Начало индексации', description: 'Обрабатываем документы из базы данных...' });
            const result = await indexDocumentsFromDb();

            if (result.failedCount > 0) {
                toast({
                    variant: 'destructive',
                    title: 'Индексация завершена с ошибками',
                    description: result.message,
                });
            } else {
                toast({
                    title: 'Индексация завершена успешно',
                    description: result.message,
                });
            }
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 text-center">
             <p className="text-sm text-muted-foreground">
               Нажмите эту кнопку, чтобы прочитать все документы из таблицы `documents` в базе данных,
               разбить их на фрагменты и сохранить в базу знаний для использования AI-ассистентом.
               Этот процесс следует запускать каждый раз после изменения текстов юридических документов.
            </p>
            <Button onClick={handleIndexing} disabled={isPending} size="lg">
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Индексация...
                    </>
                ) : (
                    <>
                        <Database className="mr-2 h-4 w-4" />
                        Запустить индексацию документов из БД
                    </>
                )}
            </Button>
        </div>
    );
}
