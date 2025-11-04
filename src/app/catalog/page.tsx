

import { getAllProducts, getProductsCount } from '@/lib/data';
import CatalogClient from './CatalogClient';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { createClient } from '@/lib/supabase/server';

interface CatalogPageProps {
  searchParams: {
    query?: string;
    category?: string;
    page?: string;
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const query = searchParams.query || '';
  const category = searchParams.category || 'all';
  const currentPage = Number(searchParams.page) || 1;
  const productsPerPage = 20; // Количество товаров на странице

  const products = await getAllProducts({ query, category, page: currentPage, limit: productsPerPage });
  const totalProducts = await getProductsCount({ query, category });
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const allFetchedProducts = await getAllProducts();
  const categories = [...new Set(allFetchedProducts.map(p => p.category).filter(Boolean))] as string[];

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href={currentPage > 1 ? `/catalog?query=${query}&category=${category}&page=${currentPage - 1}` : '#'} />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink href={`/catalog?query=${query}&category=${category}&page=${i + 1}`} isActive={currentPage === i + 1}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href={currentPage < totalPages ? `/catalog?query=${query}&category=${category}&page=${currentPage + 1}` : '#'} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold font-headline text-white">Каталог продукции</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-white/90">
          Ознакомьтесь с полным ассортиментом наших товаров и услуг.
        </p>
      </div>
      <CatalogClient products={products} categories={categories} isAuthenticated={!!user} />
      <div className="mt-8">
        {renderPagination()}
      </div>
    </div>
  );
}
