import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchTopics, fetchSubtopics, fetchLesson } from '@/services/topics';
import { fetchHomepage, fetchAbout, fetchMaterials, saveHomepage, saveAbout, saveMaterials } from '@/services/siteContent';
import { upsertTopic, deleteTopic, reorderTopics, upsertSubtopic, deleteSubtopic, upsertLesson } from '@/services/topics';
import type { 
  Topic, 
  Subtopic, 
  Lesson, 
  HomepageContent, 
  AboutContent, 
  MaterialsContent,
  LessonBlock 
} from '@/types';

interface DataContextType {
  // Loading state
  dataLoading: boolean;
  
  // Content
  homepage: HomepageContent;
  about: AboutContent;
  materials: MaterialsContent;
  
  // Topics
  topics: Topic[];
  getSubtopics: (topicId: string) => Subtopic[];
  loadSubtopics: (topicId: string, forceRefresh?: boolean) => Promise<void>;
  getLesson: (subtopicId: string) => Lesson | undefined;
  loadLesson: (subtopicId: string, forceRefresh?: boolean) => Promise<void>;
  
  // Admin operations
  saveTopicRow: (topic: Partial<Topic> & { id?: string }) => Promise<void>;
  removeTopicRow: (id: string) => Promise<void>;
  reorderTopicRows: (orderedIds: string[]) => Promise<void>;
  saveSubtopicRow: (subtopic: Partial<Subtopic> & { id?: string; topicId: string }) => Promise<void>;
  removeSubtopicRow: (id: string, topicId: string) => Promise<void>;
  saveLessonBlocks: (subtopicId: string, blocks: LessonBlock[]) => Promise<void>;
  saveHomepageContent: (content: HomepageContent) => Promise<void>;
  saveAboutContent: (content: AboutContent) => Promise<void>;
  saveMaterialsContent: (content: MaterialsContent) => Promise<void>;
  reloadTopics: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [homepage, setHomepage] = useState<HomepageContent>({
    heroTitle: 'Explore the Cosmos',
    heroSubtitle: 'Join Ethiopia\'s first astronomy learning community.',
    featureCards: [],
    featuredTopics: [],
  });
  const [about, setAbout] = useState<AboutContent>({
    missionText: '',
    whoWeAreText1: '',
    whoWeAreText2: '',
    missionImage: '',
    whoWeAreImage1: '',
    whoWeAreImage2: '',
  });
  const [materials, setMaterials] = useState<MaterialsContent>({
    galleryImages: [],
    videos: [],
    pdfs: [],
  });

  // Cache for subtopics and lessons
  const subtopicsCache = useRef<Map<string, Subtopic[]>>(new Map());
  const lessonsCache = useRef<Map<string, Lesson>>(new Map());

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setDataLoading(true);
        
        const [topicsData, homepageData, aboutData, materialsData] = await Promise.all([
          fetchTopics(),
          fetchHomepage(),
          fetchAbout(),
          fetchMaterials(),
        ]);

        setTopics(topicsData);
        setHomepage(homepageData);
        setAbout(aboutData);
        setMaterials(materialsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const getSubtopics = useCallback((topicId: string): Subtopic[] => {
    return subtopicsCache.current.get(topicId) || [];
  }, []);

  // FIX: Added forceRefresh parameter. When true, bypasses the cache check so
  // admin saves always reload fresh data instead of showing stale subtopics.
  const loadSubtopics = useCallback(async (topicId: string, forceRefresh = false) => {
    if (!forceRefresh && subtopicsCache.current.has(topicId)) {
      return;
    }

    try {
      const subtopics = await fetchSubtopics(topicId);
      subtopicsCache.current.set(topicId, subtopics);
      // Force re-render so consuming components pick up the new cache data
      setTopics((prev) => [...prev]);
    } catch (error) {
      console.error('Error loading subtopics:', error);
    }
  }, []);

  const getLesson = useCallback((subtopicId: string): Lesson | undefined => {
    return lessonsCache.current.get(subtopicId);
  }, []);

  // FIX: Added forceRefresh parameter for consistent API with loadSubtopics.
  const loadLesson = useCallback(async (subtopicId: string, forceRefresh = false) => {
    if (!forceRefresh && lessonsCache.current.has(subtopicId)) {
      return;
    }

    try {
      const lesson = await fetchLesson(subtopicId);
      if (lesson) {
        lessonsCache.current.set(subtopicId, lesson);
        // Force re-render
        setTopics((prev) => [...prev]);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    }
  }, []);

  const reloadTopics = useCallback(async () => {
    try {
      const topicsData = await fetchTopics();
      setTopics(topicsData);
    } catch (error) {
      console.error('Error reloading topics:', error);
    }
  }, []);

  const saveTopicRow = useCallback(async (topic: Partial<Topic> & { id?: string }) => {
    await upsertTopic(topic);
    await reloadTopics();
  }, [reloadTopics]);

  const removeTopicRow = useCallback(async (id: string) => {
    await deleteTopic(id);
    // Clear all subtopics for the deleted topic from cache
    subtopicsCache.current.delete(id);
    await reloadTopics();
  }, [reloadTopics]);

  const reorderTopicRows = useCallback(async (orderedIds: string[]) => {
    await reorderTopics(orderedIds);
    await reloadTopics();
  }, [reloadTopics]);

  // FIX: After saving, explicitly force-reload subtopics for the affected topic
  // so the admin UI immediately shows the updated list without a manual refresh.
  const saveSubtopicRow = useCallback(async (subtopic: Partial<Subtopic> & { id?: string; topicId: string }) => {
    await upsertSubtopic(subtopic);
    subtopicsCache.current.delete(subtopic.topicId);
    await loadSubtopics(subtopic.topicId, true);
  }, [loadSubtopics]);

  // FIX: removeSubtopicRow now requires topicId so we can invalidate only that
  // topic's cache instead of clearing ALL subtopic caches (which caused
  // unnecessary re-fetches for every other topic in the app).
  const removeSubtopicRow = useCallback(async (id: string, topicId: string) => {
    await deleteSubtopic(id);
    subtopicsCache.current.delete(topicId);
    await loadSubtopics(topicId, true);
  }, [loadSubtopics]);

  const saveLessonBlocks = useCallback(async (subtopicId: string, blocks: LessonBlock[]) => {
    await upsertLesson(subtopicId, blocks);
    // Clear and force-reload this specific lesson
    lessonsCache.current.delete(subtopicId);
    await loadLesson(subtopicId, true);
  }, [loadLesson]);

  const saveHomepageContent = useCallback(async (content: HomepageContent) => {
    await saveHomepage(content);
    setHomepage(content);
  }, []);

  const saveAboutContent = useCallback(async (content: AboutContent) => {
    await saveAbout(content);
    setAbout(content);
  }, []);

  const saveMaterialsContent = useCallback(async (content: MaterialsContent) => {
    await saveMaterials(content);
    setMaterials(content);
  }, []);

  const value: DataContextType = {
    dataLoading,
    homepage,
    about,
    materials,
    topics,
    getSubtopics,
    loadSubtopics,
    getLesson,
    loadLesson,
    saveTopicRow,
    removeTopicRow,
    reorderTopicRows,
    saveSubtopicRow,
    removeSubtopicRow,
    saveLessonBlocks,
    saveHomepageContent,
    saveAboutContent,
    saveMaterialsContent,
    reloadTopics,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
