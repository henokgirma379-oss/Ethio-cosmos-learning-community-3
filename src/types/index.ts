// ============================================
// DB Types (snake_case - match Supabase exactly)
// ============================================

export interface DbProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface DbTopic {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  description: string | null;
  lesson_count: number;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbSubtopic {
  id: string;
  topic_id: string;
  slug: string;
  emoji: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbLesson {
  id: string;
  subtopic_id: string;
  blocks: LessonBlock[];
  created_at: string;
  updated_at: string;
}

export interface DbChatMessage {
  id: string;
  user_id: string;
  message_text: string | null;
  image_url: string | null;
  created_at: string;
}

export interface DbBookmark {
  id: string;
  user_id: string;
  item_type: 'topic' | 'subtopic';
  item_id: string;
  title: string;
  description: string | null;
  url: string;
  created_at: string;
}

export interface DbUserProgress {
  id: string;
  user_id: string;
  subtopic_id: string;
  completed_at: string;
}

export interface DbQuiz {
  id: string;
  topic_id: string | null;
  subtopic_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  sort_order: number;
  created_at: string;
}

export interface DbQuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  answers: number[];
  completed_at: string;
}

export interface DbSiteContent {
  key: string;
  content: Record<string, unknown>;
  updated_at: string;
}

export interface DbAdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// UI / Frontend Types (camelCase)
// ============================================

export interface LessonBlock {
  type: 'text' | 'image';
  content: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  text: string | null;
  imageUrl: string | null;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
}

export interface TopicProgress {
  topicId: string;
  topicSlug: string;
  topicName: string;
  completedLessons: number;
  totalLessons: number;
  completedSubtopicIds: string[];
}

export interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturedTopic {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface HomepageContent {
  heroTitle: string;
  heroSubtitle: string;
  featureCards: FeatureCard[];
  featuredTopics: FeaturedTopic[];
}

export interface AboutContent {
  missionText: string;
  whoWeAreText1: string;
  whoWeAreText2: string;
  missionImage: string;
  whoWeAreImage1: string;
  whoWeAreImage2: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

export interface PdfItem {
  id: string;
  title: string;
  label: string;
  url: string;
}

export interface MaterialsContent {
  galleryImages: GalleryImage[];
  videos: VideoItem[];
  pdfs: PdfItem[];
}

export interface Topic {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  description: string | null;
  lessonCount: number;
  imageUrl: string | null;
  sortOrder: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  slug: string;
  emoji: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

export interface Lesson {
  id: string;
  subtopicId: string;
  blocks: LessonBlock[];
}

export interface Quiz {
  id: string;
  topicId: string | null;
  subtopicId: string | null;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  sortOrder: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  total: number;
  answers: number[];
  completedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemType: 'topic' | 'subtopic';
  itemId: string;
  title: string;
  description: string | null;
  url: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
}
