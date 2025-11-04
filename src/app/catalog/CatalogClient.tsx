
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, ShoppingCart } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProductCarouselCard from '@/components/catalog/ProductCarouselCard';
import ProductDetailModal from '@/components/catalog/ProductDetailModal';

interface CatalogClientProps {
  products: Product[];
  categories: string[];
  isAuthenticated: boolean;
}

export default function CatalogClient({ products, categories, isAuthenticated }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [viewMode, setViewMode] = useState<'carousel' | 'table'>('carousel');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newSearchTerm = params.get('query') || '';
    const newCategory = params.get('category') || 'all';
    
    if (newSearchTerm !== searchTerm) {
      setSearchTerm(newSearchTerm);
    }
    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
    }
  }, [searchParams]);

  const handleFilterChange = () => {
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      if (searchTerm) {
        params.set('query', searchTerm);
      } else {
        params.delete('query');
      }
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      } else {
        params.delete('category');
      }
      params.delete('page'); // Reset to first page on new filter
      router.push(`/catalog?${params.toString()}`);
    });
  };

  const handleRowDoubleClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const getPrice = (product: Product) => {
    const price = isAuthenticated ? product.price2 : product.price1;
    return price ? `${price.toLocaleString('ru-RU')} BYN` : 'Цена по запросу';
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-grow flex gap-2">
            <Input
            placeholder="Поиск по названию или артикулу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
            className="flex-grow"
            />
            <Button onClick={handleFilterChange} disabled={isPending}>
                {isPending ? 'Поиск...' : 'Найти'}
            </Button>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              // Trigger filter change on select
              const params = new URLSearchParams(window.location.search);
              if (value !== 'all') {
                params.set('category', value);
              } else {
                params.delete('category');
              }
              params.delete('page');
              router.push(`/catalog?${params.toString()}`);
          }}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === 'carousel' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('carousel')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        {viewMode === 'carousel' ? (
          <Carousel
            opts={{
              align: "start",
              loop: products.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent>
              {products.map((product) => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4" onDoubleClick={() => handleRowDoubleClick(product)}>
                  <ProductCarouselCard product={product} isAuthenticated={isAuthenticated} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {products.length > 3 && <>
                <CarouselPrevious />
                <CarouselNext />
            </>}
          </Carousel>
        ) : (
          <Card>
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Артикул</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead className="text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} onDoubleClick={() => handleRowDoubleClick(product)} className="cursor-pointer">
                      <TableCell>{product.article_number}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{getPrice(product)}</TableCell>
                      <TableCell className="text-right">
                         <Button size="sm" variant="outline">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            В корзину
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        )}
         {products.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p>Товары не найдены.</p>
                <p className="text-sm">Попробуйте изменить критерии поиска.</p>
            </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
