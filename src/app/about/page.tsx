import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Award, Users, Target } from 'lucide-react';

export default function AboutPage() {
  const aboutImage = PlaceHolderImages.find(p => p.id === 'about-us-image');

  const values = [
    { icon: <Award className="h-10 w-10 text-primary" />, title: "Качество", description: "Мы стремимся к совершенству в каждой детали, от выбора материалов до финального продукта." },
    { icon: <Users className="h-10 w-10 text-primary" />, title: "Клиенты", description: "Наши клиенты — наш главный приоритет. Мы строим долгосрочные и доверительные отношения." },
    { icon: <Target className="h-10 w-10 text-primary" />, title: "Инновации", description: "Мы постоянно ищем и внедряем новые технологии для достижения наилучших результатов." },
  ];

  return (
    <div className="container mx-auto px-4 py-12 md:px-8 md:py-16">
      <div className="text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">О компании PrintLuxe</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          Ваш надежный партнер в мире полиграфии, где качество сочетается с инновациями.
        </p>
      </div>

      <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="prose prose-lg max-w-none text-foreground">
          <h2 className="font-headline text-2xl md:text-3xl font-semibold">Наша история</h2>
          <p>
            Компания PrintLuxe была основана в 2010 году группой энтузиастов, объединенных страстью к печатному делу. Мы начинали с небольшого цеха и одной печатной машины, но с самого начала нашей главной целью было предоставление услуг высочайшего качества.
          </p>
          <p>
            За годы работы мы выросли в одного из лидеров рынка, расширив парк оборудования и собрав команду настоящих профессионалов. Сегодня мы гордимся тем, что можем предложить нашим клиентам полный спектр полиграфических услуг — от разработки дизайна до доставки готовой продукции.
          </p>
          <h2 className="font-headline text-2xl md:text-3xl font-semibold mt-8">Наша миссия</h2>
          <p>
            Мы верим, что качественная полиграфия — это мощный инструмент для бизнеса. Наша миссия — помогать компаниям и частным лицам воплощать их идеи в жизнь, создавая печатную продукцию, которая впечатляет, информирует и вдохновляет. Мы стремимся делать профессиональную печать доступной и удобной для каждого.
          </p>
        </div>
        <div className="aspect-video relative rounded-lg overflow-hidden shadow-lg">
          {aboutImage && (
            <Image
              src={aboutImage.imageUrl}
              alt={aboutImage.description}
              fill
              className="object-cover"
              data-ai-hint={aboutImage.imageHint}
            />
          )}
        </div>
      </div>

      <div className="mt-16 md:mt-24">
        <div className="text-center">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">Наши ценности</h2>
          <p className="mt-2 text-lg text-muted-foreground">Принципы, которыми мы руководствуемся в нашей работе.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map(value => (
            <div key={value.title} className="bg-card p-8 rounded-lg shadow-sm text-center">
              <div className="inline-block bg-primary/10 p-4 rounded-full">
                {value.icon}
              </div>
              <h3 className="mt-6 font-headline text-2xl font-semibold">{value.title}</h3>
              <p className="mt-2 text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
