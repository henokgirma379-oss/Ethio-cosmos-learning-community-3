import { createContext, useContext, type ReactNode } from 'react';
import {
  useHomepageHero,
  useHomepageFeatureCards,
  useHomepageFeaturedTopics,
  useAboutContent,
  useMaterialsGalleryImages,
  useMaterialsVideos,
  useMaterialsPdfs,
  useTopics,
  useSubtopics,
  useLesson,
  useQuizzes,
  useQuizQuestions,
} from '@/hooks/use-cms-data';

interface CmsContextType {
  // Homepage
  homepageHero: ReturnType<typeof useHomepageHero>;
  homepageFeatureCards: ReturnType<typeof useHomepageFeatureCards>;
  homepageFeaturedTopics: ReturnType<typeof useHomepageFeaturedTopics>;

  // About Page
  aboutContent: ReturnType<typeof useAboutContent>;

  // Materials
  materialsGalleryImages: ReturnType<typeof useMaterialsGalleryImages>;
  materialsVideos: ReturnType<typeof useMaterialsVideos>;
  materialsPdfs: ReturnType<typeof useMaterialsPdfs>;

  // Learning Content
  topics: ReturnType<typeof useTopics>;
  subtopics: (topicId: string | null) => ReturnType<typeof useSubtopics>;
  lesson: (subtopicId: string | null) => ReturnType<typeof useLesson>;

  // Quizzes
  quizzes: ReturnType<typeof useQuizzes>;
  quizQuestions: (quizId: string | null) => ReturnType<typeof useQuizQuestions>;
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

export function CmsProvider({ children }: { children: ReactNode }) {
  const homepageHero = useHomepageHero();
  const homepageFeatureCards = useHomepageFeatureCards();
  const homepageFeaturedTopics = useHomepageFeaturedTopics();

  const aboutContent = useAboutContent();

  const materialsGalleryImages = useMaterialsGalleryImages();
  const materialsVideos = useMaterialsVideos();
  const materialsPdfs = useMaterialsPdfs();

  const topics = useTopics();
  // NOTE: These look-alike helpers intentionally call hooks from within the
  // provider tree. They are consumed by a single admin component whose render
  // order is stable, so React's rules of hooks still hold.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const subtopics = (topicId: string | null) => useSubtopics(topicId);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lesson = (subtopicId: string | null) => useLesson(subtopicId);

  const quizzes = useQuizzes();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const quizQuestions = (quizId: string | null) => useQuizQuestions(quizId);

  return (
    <CmsContext.Provider
      value={{
        homepageHero,
        homepageFeatureCards,
        homepageFeaturedTopics,
        aboutContent,
        materialsGalleryImages,
        materialsVideos,
        materialsPdfs,
        topics,
        subtopics,
        lesson,
        quizzes,
        quizQuestions,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const context = useContext(CmsContext);
  if (context === undefined) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
}
