
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Metadata } from 'next';

interface LegalDocPageProps {
  params: {
    slug: string;
  };
}

async function getDocumentBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('title, content, published_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'published') // Only fetch published documents
    .single();

  if (error) {
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

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: documents } = await supabase
    .from('documents')
    .select('slug')
    .eq('status', 'published')
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

  const contentHtml = await marked.parse(doc.content || '');

  const formatDate = (dateString: string) => {
      try {
        return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
      } catch {
        return 'Неверная дата';
      }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
        <Card className="w-full max-w-4xl mx-auto bg-black/50 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <CardTitle className="font-headline text-3xl text-white">{doc.title}</CardTitle>
                        <div className="text-xs text-white/50 mt-2">
                            {doc.published_at && <span>Опубликовано: {formatDate(doc.published_at)}</span>}
                            {doc.updated_at && doc.published_at && <span className="mx-2">|</span>}
                            {doc.updated_at && <span>Последнее обновление: {formatDate(doc.updated_at)}</span>}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    className="prose prose-invert max-w-none text-white/90 prose-headings:text-white prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
            </CardContent>
        </Card>
    </div>
  );
}
