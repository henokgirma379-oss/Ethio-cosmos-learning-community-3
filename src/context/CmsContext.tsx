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
  useQuizzes,
} from '@/hooks/use-cms-data';

/**
 * CmsContext only exposes hooks that take NO parameters and whose state
 * benefits from being shared across the whole app (homepage content, the full
 * topics list, the quiz list, etc.).
 *
 * Hooks that depend on a runtime id — `useSubtopics(topicId)`,
 * `useLesson(subtopicId)`, `useQuizQuestions(quizId)` — must be called
 * directly inside the page that needs them. Wrapping them as factories on the
 * context (the previous implementation) silently violated the React Rules of
 * Hooks because the hook calls happened in the consumer's render rather than
 * in the provider, leading to confusing state-loss bugs and ESLint disables.
 */
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

  // Learning Content (top level only — see note above)
  topics: ReturnType<typeof useTopics>;

  // Quizzes (top level list)
  quizzes: ReturnType<typeof useQuizzes>;
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
  const quizzes = useQuizzes();

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
        quizzes,
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
