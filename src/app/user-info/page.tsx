import { getCompanyRegistrationInfo } from '@/lib/user-info-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default async function UserInfoPage() {
  const info = await getCompanyRegistrationInfo();

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 h-full flex items-center justify-center">
      <Card className="w-full max-w-4xl bg-black/50 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Info className="h-8 w-8 text-white" />
            <CardTitle className="font-headline text-3xl">Информация для пользователя</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none text-white/90">
            {info}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
