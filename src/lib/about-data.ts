
import { createClient } from './supabase/server';

export interface TeamMember {
  name?: string;
  role?: string;
  image_url?: string;
}

export interface AboutPageData {
  main_title?: string;
  main_subtitle?: string;
  history_title?: string;
  history_p1?: string;
  history_p2?: string;
  mission_title?: string;
  mission_description?: string;
  values_title?: string;
  values_description?: string;
  workshop_image_url?: string;
  team_intro_title?: string;
  team_intro_description?: string;
  team_section_title?: string;
  team_section_subtitle?: string;
  team_members: TeamMember[];
  error?: string;
}

// This function fetches all key-value pairs from the settings table where the key starts with 'about_'.
// It then transforms the array of {key, value} into a single structured object.
export async function getAboutPageData(): Promise<AboutPageData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .like('key', 'about_%');

  if (error) {
    console.error('Error fetching about page data:', error);
    return { team_members: [], error: 'Не удалось загрузить данные для страницы.' };
  }

  if (!data) {
    return { team_members: [], error: 'Данные для страницы "О нас" не найдены.' };
  }

  // Transform the array of {key, value} into a single object e.g. { main_title: 'Value', ... }
  const aboutDataReduced = data.reduce<any>((acc, { key, value }) => {
    const cleanedKey = key.replace('about_', '');
    acc[cleanedKey] = value;
    return acc;
  }, {});

  const team_members: TeamMember[] = [];
  for (let i = 1; i <= 4; i++) {
    if (aboutDataReduced[`member${i}_name`]) {
      team_members.push({
        name: aboutDataReduced[`member${i}_name`],
        role: aboutDataReduced[`member${i}_role`],
        image_url: aboutDataReduced[`member${i}_image_url`],
      });
    }
  }

  // delete individual member keys
  for (let i = 1; i <= 4; i++) {
      delete aboutDataReduced[`member${i}_name`];
      delete aboutDataReduced[`member${i}_role`];
      delete aboutDataReduced[`member${i}_image_url`];
  }


  const aboutData: AboutPageData = {
    ...aboutDataReduced,
    team_members,
  }


  return aboutData;
}
