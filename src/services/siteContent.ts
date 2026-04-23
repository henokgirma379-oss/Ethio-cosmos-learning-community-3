import { supabase } from '@/supabase';
import type { 
  DbSiteContent, 
  HomepageContent, 
  AboutContent, 
  MaterialsContent 
} from '@/types';

export const defaultHomepage: HomepageContent = {
  heroTitle: 'Explore the Cosmos',
  heroSubtitle: 'Join Ethiopia\'s first astronomy learning community. Discover the wonders of the universe from stars to black holes.',
  featureCards: [
    {
      icon: '📚',
      title: 'Structured Learning',
      description: 'Progress from fundamentals to advanced topics with expertly crafted lessons.',
    },
    {
      icon: '👥',
      title: 'Live Community',
      description: 'Connect with fellow astronomy enthusiasts in real-time discussions.',
    },
    {
      icon: '🎯',
      title: 'Track Progress',
      description: 'Monitor your learning journey with achievements and progress tracking.',
    },
  ],
  featuredTopics: [
    {
      id: '1',
      title: 'Black Holes',
      description: 'Explore the mysteries of these cosmic phenomena.',
      image: '/images/topic-black-hole.jpg',
    },
    {
      id: '2',
      title: 'Solar System',
      description: 'Journey through our cosmic neighborhood.',
      image: '/images/topic-solar-system.jpg',
    },
    {
      id: '3',
      title: 'Ethiopian Astronomy',
      description: 'Discover Ethiopia\'s rich astronomical heritage.',
      image: '/images/topic-ethiopia.jpg',
    },
  ],
};

export const defaultAbout: AboutContent = {
  missionText: 'Our mission is to make astronomy education accessible to everyone in Ethiopia and beyond. We believe that understanding the cosmos inspires curiosity, critical thinking, and a deeper appreciation for our place in the universe.',
  whoWeAreText1: 'Ethio-Cosmos is a community-driven platform created by passionate astronomers, educators, and developers who want to share their love for the stars with the world.',
  whoWeAreText2: 'We combine modern educational techniques with Ethiopia\'s rich astronomical heritage to create a unique learning experience that honors both science and culture.',
  missionImage: '/images/mission.jpg',
  whoWeAreImage1: '/images/who-we-are-1.jpg',
  whoWeAreImage2: '/images/who-we-are-2.jpg',
};

export const defaultMaterials: MaterialsContent = {
  galleryImages: [
    { id: '1', url: '/images/gallery-1.jpg', caption: 'Nebula' },
    { id: '2', url: '/images/gallery-2.jpg', caption: 'Galaxy' },
    { id: '3', url: '/images/gallery-3.jpg', caption: 'Star Cluster' },
    { id: '4', url: '/images/gallery-4.jpg', caption: 'Planetary System' },
  ],
  videos: [
    { id: '1', title: 'Introduction to Astronomy', thumbnail: '/images/video-thumb-1.jpg', url: '#' },
  ],
  pdfs: [
    { id: '1', title: 'Astronomy Basics Guide', label: 'Beginner', url: '#' },
    { id: '2', title: 'Star Charts 2024', label: 'Reference', url: '#' },
  ],
};

export async function fetchHomepage(): Promise<HomepageContent> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', 'homepage')
    .maybeSingle();

  if (error) {
    console.error('Error fetching homepage content:', error);
    return defaultHomepage;
  }

  if (!data) return defaultHomepage;

  const content = ((data as DbSiteContent).content as unknown) as HomepageContent;
  return { ...defaultHomepage, ...content };
}

export async function fetchAbout(): Promise<AboutContent> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', 'about')
    .maybeSingle();

  if (error) {
    console.error('Error fetching about content:', error);
    return defaultAbout;
  }

  if (!data) return defaultAbout;

  const content = ((data as DbSiteContent).content as unknown) as AboutContent;
  return { ...defaultAbout, ...content };
}

export async function fetchMaterials(): Promise<MaterialsContent> {
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('key', 'materials')
    .maybeSingle();

  if (error) {
    console.error('Error fetching materials content:', error);
    return defaultMaterials;
  }

  if (!data) return defaultMaterials;

  const content = ((data as DbSiteContent).content as unknown) as MaterialsContent;
  return { ...defaultMaterials, ...content };
}

export async function saveHomepage(content: HomepageContent): Promise<void> {
  const { error } = await supabase
    .from('site_content')
    .upsert({
      key: 'homepage',
      content,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving homepage content:', error);
    throw error;
  }
}

export async function saveAbout(content: AboutContent): Promise<void> {
  const { error } = await supabase
    .from('site_content')
    .upsert({
      key: 'about',
      content,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving about content:', error);
    throw error;
  }
}

export async function saveMaterials(content: MaterialsContent): Promise<void> {
  const { error } = await supabase
    .from('site_content')
    .upsert({
      key: 'materials',
      content,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving materials content:', error);
    throw error;
  }
}
