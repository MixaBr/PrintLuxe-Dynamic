
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List } from 'lucide-react';
import Link from 'next/link';

async function getLegalDocs() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('documents')
        .select('title, slug, excerpt')
        .eq('category', 'legal')
        .eq('status', 'published')
        .order('published_at', { ascending: true });

    if (error) {
        console.error('Error fetching legal documents:', error);
        return [];
    }
    return data;
}

export default async function LegalInfoPage() {
    const documents = await getLegalDocs();

    return (
        <div className="container mx-auto px-4 py-8 md:px-8 h-full flex items-center justify-center">
            <Card className="w-full max-w-2xl bg-black/50 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <List className="h-8 w-8 text-white" />
                        <div>
                            <CardTitle className="font-headline text-3xl text-white">Юридическая информация</CardTitle>
                            <CardDescription className="text-white/80">
                                Здесь собраны все важные документы, регулирующие нашу деятельность и взаимодействие с клиентами.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {documents.length > 0 ? (
                        <ul className="space-y-3">
                            {documents.map(doc => (
                                <li key={doc.slug}>
                                    <Link href={`/legal/${doc.slug}`}>
                                        <div className="p-4 bg-white/10 rounded-md hover:bg-white/20 transition-colors">
                                            <p className="font-semibold text-lg">{doc.title}</p>
                                            {doc.excerpt && <p className="text-sm text-white/70 mt-1">{doc.excerpt}</p>}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-white/70">
                            <p>Юридические документы пока не добавлены.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
