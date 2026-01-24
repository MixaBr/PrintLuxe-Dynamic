
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Metadata } from 'next';
import { supabase as simpleSupabaseClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';


interface LegalDocPageProps {
  params: {
    slug: string;
  };
}

async function getDocumentBySlug(slug: string) {
  // ИСПРАВЛЕНИЕ: Используем правильный, серверный клиент, который не кеширует данные при 'force-dynamic'
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('title, content, published_at, updated_at')
    .eq('slug', slug)
    .single();

  if (error) {
    // RLS скроет документ, если он не опубликован, поэтому ошибка - это нормально
    // Логируем только если это не стандартная ошибка "row not found"
    if (error.code !== 'PGRST116') {
        console.error(`Error fetching document for slug "${slug}":`, error);
    }
    return null;
  }
  return data;
}

export async function generateMetadata({ params }: LegalDocPageProps): Promise<Metadata> {
  const doc = await getDocumentBySlug(params.slug)
 
  if (!doc) {
    return {
      title: 'Документ не найден',
    }
  }
 
  return {
    title: doc.title,
    description: `Юридическая информация: ${doc.title}`,
  }
}

// Эта функция запускается во время сборки, поэтому ей нужен простой клиент
export async function generateStaticParams() {
  const { data: documents } = await simpleSupabaseClient
    .from('documents')
    .select('slug')
    .eq('category', 'legal');
 
  return documents?.map((doc) => ({
    slug: doc.slug,
  })) || [];
}

export default async function LegalDocPage({ params }: LegalDocPageProps) {
  const doc = await getDocumentBySlug(params.slug);

  if (!doc) {
    notFound();
  }
  
  // Pre-process the content to fix formatting issues from single-line text.
  let processedContent = doc.content || '';
  // Add newlines before headers (##) to ensure they are parsed correctly.
  processedContent = processedContent.replace(/\s*(##\s)/g, '\n\n$1');
  // Add newlines before numbered sections (e.g., 1.1., 1.2.)
  processedContent = processedContent.replace(/\s*(\d+\.\d+\.)/g, '\n\n$1');

  const contentHtml = await marked.parse(processedContent);

  const formatDate = (dateString: string | null) => {
      if (!dateString) return null;
      try {
        return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
      } catch {
        return 'Неверная дата';
      }
  }

  const publicationDate = formatDate(doc.published_at);
  const updateDate = formatDate(doc.updated_at);

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
        <Card className="w-full max-w-4xl mx-auto bg-black/50 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <CardTitle className="font-headline text-3xl text-white">{doc.title}</CardTitle>
                        <div className="text-xs text-white/50 mt-2">
                            {publicationDate && <span>Опубликовано: {publicationDate}</span>}
                            {updateDate && publicationDate && <span className="mx-2">|</span>}
                            {updateDate && <span>Последнее обновление: {updateDate}</span>}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
            </CardContent>
        </Card>
    </div>
  );
}
