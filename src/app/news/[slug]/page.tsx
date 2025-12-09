
import { getNewsBySlug, formatNewsDate } from '@/lib/news-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Tag } from 'lucide-react';

interface NewsPageProps {
  params: {
    slug: string;
  };
}

export default async function NewsPage({ params }: NewsPageProps) {
  const newsItem = await getNewsBySlug(params.slug);

  if (!newsItem) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <Card className="bg-black/50 text-white border-white/20">
        <CardContent className="p-4 md:p-8">
          <article>
            <header className="mb-8">
              <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {newsItem.title}
              </h1>
              <div className="flex items-center space-x-4 text-white/70">
                {newsItem.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={newsItem.published_at}>
                      {formatNewsDate(newsItem.published_at)}
                    </time>
                  </div>
                )}
              </div>
            </header>

            {newsItem.featured_image_url && (
              <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
                <Image
                  src={newsItem.featured_image_url}
                  alt={newsItem.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div
              className="prose prose-invert prose-lg max-w-none text-white/90"
              dangerouslySetInnerHTML={{ __html: newsItem.content }}
            />
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
