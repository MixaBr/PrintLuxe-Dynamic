import { getProductsForSitemap } from '@/lib/data';
import { getPageLastModified } from '@/lib/settings-data';

// Revalidate the sitemap every hour to keep it fresh
export const revalidate = 3600; 

const URL = 'https://remontprintlux.by';

export async function GET() {
    try {
        const products = await getProductsForSitemap();
        const productEntries = products.map(({ id, updated_at }) => `
            <url>
                <loc>${URL}/catalog?product=${id}</loc>
                <lastmod>${new Date(updated_at).toISOString()}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>`).join('');

        const aboutLastModified = await getPageLastModified('about_');
        const contactLastModified = await getPageLastModified('contact_');

        const staticPages = [
            { url: `${URL}/`, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 1.0 },
            { url: `${URL}/catalog`, lastModified: new Date().toISOString(), changeFrequency: 'daily', priority: 0.9 },
            { url: `${URL}/about`, lastModified: aboutLastModified.toISOString(), changeFrequency: 'monthly', priority: 0.7 },
            { url: `${URL}/contact`, lastModified: contactLastModified.toISOString(), changeFrequency: 'monthly', priority: 0.6 },
            { url: `${URL}/services`, lastModified: new Date().toISOString(), changeFrequency: 'monthly', priority: 0.7 },
            { url: `${URL}/faq`, lastModified: new Date().toISOString(), changeFrequency: 'monthly', priority: 0.5 },
            { url: `${URL}/legal`, lastModified: new Date().toISOString(), changeFrequency: 'yearly', priority: 0.4 },
        ];

        const staticEntries = staticPages.map(({ url, lastModified, changeFrequency, priority }) => `
            <url>
                <loc>${url}</loc>
                <lastmod>${lastModified}</lastmod>
                <changefreq>${changeFrequency}</changefreq>
                <priority>${priority}</priority>
            </url>`).join('');

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticEntries}
    ${productEntries}
</urlset>`.trim();

        return new Response(xmlContent, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });

    } catch (error) {
        console.error('Sitemap generation failed:', error);
        // Return a 500 error to signal a server problem
        return new Response('Error generating sitemap.', { status: 500 });
    }
}
