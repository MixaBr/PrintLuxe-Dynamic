'use client';

import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LegalDocActionsProps {
  docTitle: string;
  docContent: string;
}

export default function LegalDocActions({ docTitle, docContent }: LegalDocActionsProps) {
  const handleDownload = () => {
    // Создаем blob из markdown контента
    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    // Создаем URL для blob
    const url = URL.createObjectURL(blob);
    // Создаем временный элемент ссылки
    const link = document.createElement('a');
    link.href = url;
    // Очищаем название для имени файла
    const fileName = `${docTitle.replace(/[^a-z0-9а-яё\s]/gi, '').replace(/\s+/g, '_').toLowerCase()}_договор.txt`;
    link.download = fileName;
    // Добавляем в тело, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Освобождаем URL для экономии памяти
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        Скачать договор
      </Button>
      <Button asChild variant="outline" className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
        <Link href="/legal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться
        </Link>
      </Button>
    </div>
  );
}
