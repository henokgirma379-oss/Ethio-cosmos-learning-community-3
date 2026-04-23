import { supabase } from '@/supabase';
import type { DbUserProgress, TopicProgress, Topic, Subtopic } from '@/types';

export async function fetchCompletedSubtopicIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('subtopic_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching completed subtopics:', error);
    throw error;
  }

  return (data as DbUserProgress[] || []).map((p) => p.subtopic_id);
}

export async function markLessonComplete(
  userId: string,
  subtopicId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      subtopic_id: subtopicId,
      completed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,subtopic_id',
    });

  if (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
}

export async function markLessonIncomplete(
  userId: string,
  subtopicId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_progress')
    .delete()
    .eq('user_id', userId)
    .eq('subtopic_id', subtopicId);

  if (error) {
    console.error('Error marking lesson incomplete:', error);
    throw error;
  }
}

export function buildTopicProgress(
  topics: Topic[],
  subtopics: Subtopic[],
  completedSubtopicIds: string[]
): TopicProgress[] {
  const subtopicsByTopic = new Map<string, Subtopic[]>();
  
  subtopics.forEach((subtopic) => {
    const existing = subtopicsByTopic.get(subtopic.topicId) || [];
    existing.push(subtopic);
    subtopicsByTopic.set(subtopic.topicId, existing);
  });

  return topics.map((topic) => {
    const topicSubtopics = subtopicsByTopic.get(topic.id) || [];
    const topicCompletedSubtopicIds = topicSubtopics
      .filter((s) => completedSubtopicIds.includes(s.id))
      .map((s) => s.id);

    return {
      topicId: topic.id,
      topicSlug: topic.slug,
      topicName: topic.title,
      completedLessons: topicCompletedSubtopicIds.length,
      totalLessons: topicSubtopics.length,
      completedSubtopicIds: topicCompletedSubtopicIds,
    };
  });
}

export function calculateOverallProgress(
  totalCompleted: number,
  totalLessons: number
): number {
  if (totalLessons === 0) return 0;
  return Math.round((totalCompleted / totalLessons) * 100);
}

export function getAchievements() {
  return [
    { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', icon: '🌱', threshold: 1 },
    { id: 'rising-star', name: 'Rising Star', description: 'Complete 5 lessons', icon: '⭐', threshold: 5 },
    { id: 'space-explorer', name: 'Space Explorer', description: 'Complete 10 lessons', icon: '🚀', threshold: 10 },
    { id: 'cosmic-scholar', name: 'Cosmic Scholar', description: 'Complete 25 lessons', icon: '📚', threshold: 25 },
    { id: 'astronomy-master', name: 'Astronomy Master', description: 'Complete 50 lessons', icon: '🏆', threshold: 50 },
    { id: 'universal-expert', name: 'Universal Expert', description: 'Complete all lessons', icon: '🌌', threshold: Infinity },
  ];
}

export function getUnlockedAchievements(completedCount: number) {
  const achievements = getAchievements();
  return achievements.filter((a) => completedCount >= a.threshold);
}
