
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, ShoppingCart, X } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProductCarouselCard from '@/components/catalog/ProductCarouselCard';
import ProductDetailModal from '@/components/catalog/ProductDetailModal';
import { getFullProductDetails } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/hooks/use-cart-store';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CatalogClientProps {
  products: Product[];
  categories: string[];
}

export default function CatalogClient({ products, categories }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const { addToCart } = useCartStore();


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

  const handleClearSearch = () => {
    setSearchTerm('');
    startTransition(() => {
      const params = new URLSearchParams(window.location.search);
      params.delete('query');
      params.delete('page');
      router.push(`/catalog?${params.toString()}`);
    });
  };

  const handleRowDoubleClick = async (product: Product) => {
    const fullProduct = await getFullProductDetails(product.id);
    setSelectedProduct(fullProduct || product);
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: 'Успех!',
      description: `Товар "${product.name}" добавлен в корзину.`,
    });
  };

  const getPrice = (product: Product) => {
    return product.price ? `${product.price.toLocaleString('ru-RU')} BYN` : 'Цена по запросу';
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-grow flex items-center gap-2">
            <div className="relative flex-grow">
                <Input
                placeholder="Поиск по названию или артикулу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                className="pr-10"
                />
                {searchTerm && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={handleClearSearch}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Button onClick={handleFilterChange} disabled={isPending}>
                {isPending ? 'Поиск...' : 'Найти'}
            </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              startTransition(() => {
                const params = new URLSearchParams(window.location.search);
                if (value !== 'all') {
                  params.set('category', value);
                } else {
                  params.delete('category');
                }
                params.delete('page');
                router.push(`/catalog?${params.toString()}`);
              });
          }}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
                <CarouselItem key={product.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5" onDoubleClick={() => handleRowDoubleClick(product)}>
                  <ProductCarouselCard product={product} onAddToCart={handleAddToCart} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {products.length > 3 && <>
                <CarouselPrevious />
                <CarouselNext />
            </>}
          </Carousel>
        ) : (
          <div className="rounded-lg border h-[60vh] flex flex-col">
            <div className="flex-shrink-0 border-b">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white/90">
                    <TableHead className="w-[40%] text-black">Название</TableHead>
                    <TableHead className="hidden md:table-cell w-[20%] text-black text-center">Артикул</TableHead>
                    <TableHead className="w-[30%] text-black text-right">Цена</TableHead>
                    <TableHead className="w-[30%] text-black text-center">Действие</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
            <ScrollArea className="flex-grow">
              <Table>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} onDoubleClick={() => handleRowDoubleClick(product)} className="cursor-pointer text-white hover:bg-white/10">
                      <TableCell className="font-medium truncate w-[40%]">{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell truncate text-center w-[20%]">{product.article_number}</TableCell>
                      <TableCell className="text-right w-[30%]">{getPrice(product)}</TableCell>
                      <TableCell className="text-center w-[30%]">
                         <Button size="sm" variant="outline" className="text-black" onClick={() => handleAddToCart(product)}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                             <span className="hidden sm:inline">В корзину</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
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
        onAddToCart={handleAddToCart}
      />
    </>
  );
}
