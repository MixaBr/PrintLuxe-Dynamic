
'use client';

import { useState, useMemo } from 'react';
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
}

export default function CatalogClient({ products, categories }: CatalogClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'table'>('carousel');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = searchTerm === '' ||
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.article_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.product_number?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleRowDoubleClick = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Поиск по названию или артикулу..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {filteredProducts.map((product) => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4" onDoubleClick={() => handleRowDoubleClick(product)}>
                  <ProductCarouselCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
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
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} onDoubleClick={() => handleRowDoubleClick(product)} className="cursor-pointer">
                      <TableCell>{product.article_number}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{(product.price1 || 0).toLocaleString('ru-RU')} ₽</TableCell>
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
         {filteredProducts.length === 0 && (
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
      />
    </>
  );
}
