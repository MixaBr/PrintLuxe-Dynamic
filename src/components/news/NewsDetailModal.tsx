'use client';

import type { News } from '@/lib/news-data';
import { formatNewsDate } from '@/lib/news-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { marked } from 'marked';

interface NewsDetailModalProps {
  newsItem: News | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsDetailModal({ newsItem, isOpen, onClose }: NewsDetailModalProps) {
  if (!newsItem) return null;

  const getHtmlContent = () => {
    if (!newsItem.content) return { __html: '' };
    const html = marked(newsItem.content);
    return { __html: html as string };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl lg:max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className='p-6 pb-4 flex-shrink-0'>
          <DialogTitle className="font-headline text-2xl lg:text-3xl">{newsItem.title}</DialogTitle>
          {newsItem.published_at && (
            <DialogDescription className="flex items-center gap-2 text-muted-foreground pt-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={newsItem.published_at}>
                {formatNewsDate(newsItem.published_at)}
              </time>
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0">
          <div className="px-6 pb-6">
            {newsItem.featured_image_url && (
              <div className="relative w-full h-64 md:h-80 my-4 rounded-lg overflow-hidden">
                <Image
                  src={newsItem.featured_image_url}
                  alt={newsItem.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1360px) 583px, (min-width: 780px) calc(45.45vw - 33px), calc(100vw - 32px)"
                  priority
                />
              </div>
            )}
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={getHtmlContent()}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
