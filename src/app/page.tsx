import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/catalog/ProductCard';
import { getFeaturedProducts } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, CheckCircle, Truck, Award } from 'lucide-react';

export default async function Home() {
  const featuredProducts = await getFeaturedProducts(4);
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image-1');

  const features = [
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "Гарантия качества",
      description: "Мы используем только лучшие материалы и современное оборудование.",
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
      title: "Быстрая доставка",
      description: "Доставка вашего заказа в кратчайшие сроки по всей стране.",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary" />,
      title: "Индивидуальный подход",
      description: "Наша команда поможет воплотить в жизнь любые ваши идеи.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[70vh] text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container mx-auto h-full flex flex-col items-start justify-center text-left px-4 md:px-8">
          <h1 className="font-headline text-4xl md:text-6xl font-bold !leading-tight tracking-tight">
            Современные решения <br /> для вашей печати
          </h1>
          <p className="mt-4 max-w-xl text-lg md:text-xl text-gray-200">
            От визиток до широкоформатной печати — мы предлагаем полный спектр полиграфических услуг с гарантией качества.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg" className="font-bold text-base bg-primary hover:bg-primary/90">
              <Link href="/catalog">
                В каталог <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold text-base bg-transparent text-white border-white hover:bg-white hover:text-primary">
              <Link href="/contact">Связаться с нами</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Популярные товары</h2>
            <p className="mt-2 text-lg text-muted-foreground">Ознакомьтесь с нашими самыми востребованными продуктами.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="link" className="text-lg text-primary hover:text-accent">
                <Link href="/catalog">
                    Смотреть все товары <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Почему выбирают PrintLuxe</h2>
            <p className="mt-2 text-lg text-muted-foreground">Качество, скорость и индивидуальный подход к каждому клиенту.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center p-6">
                {feature.icon}
                <h3 className="mt-4 font-headline text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
