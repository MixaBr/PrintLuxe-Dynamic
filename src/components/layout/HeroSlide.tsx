
import { supabase } from '@/lib/supabaseClient';

type SlideData = {
  title: string;
  subtitle: string;
};

async function getSlideData(): Promise<SlideData> {
  const { data: titleData, error: titleError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'home_hero_title')
    .single();

  if (titleError) {
    console.error('Error fetching title:', titleError);
  }

  const { data: subtitleData, error: subtitleError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'home_hero_subtitle')
    .single();

  if (subtitleError) {
    console.error('Error fetching subtitle:', subtitleError);
  }

  return {
    title: titleData?.value || 'Default Title',
    subtitle: subtitleData?.value || 'Default Subtitle',
  };
}

export default async function HeroSlide() {
  const { title, subtitle } = await getSlideData();

  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
