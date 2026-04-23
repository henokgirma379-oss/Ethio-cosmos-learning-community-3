import { supabase } from '@/supabase';
import type { DbTopic, DbSubtopic, DbLesson, Topic, Subtopic, Lesson, LessonBlock } from '@/types';

export function mapTopic(dbTopic: DbTopic): Topic {
  return {
    id: dbTopic.id,
    slug: dbTopic.slug,
    emoji: dbTopic.emoji,
    title: dbTopic.title,
    description: dbTopic.description,
    lessonCount: dbTopic.lesson_count,
    imageUrl: dbTopic.image_url,
    sortOrder: dbTopic.sort_order,
  };
}

export function mapSubtopic(dbSubtopic: DbSubtopic): Subtopic {
  return {
    id: dbSubtopic.id,
    topicId: dbSubtopic.topic_id,
    slug: dbSubtopic.slug,
    emoji: dbSubtopic.emoji,
    title: dbSubtopic.title,
    description: dbSubtopic.description,
    sortOrder: dbSubtopic.sort_order,
  };
}

export function mapLesson(dbLesson: DbLesson): Lesson {
  return {
    id: dbLesson.id,
    subtopicId: dbLesson.subtopic_id,
    blocks: dbLesson.blocks || [],
  };
}

export async function fetchTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching topics:', error);
    throw error;
  }

  return (data as DbTopic[] || []).map(mapTopic);
}

export async function fetchSubtopics(topicId: string): Promise<Subtopic[]> {
  const { data, error } = await supabase
    .from('subtopics')
    .select('*')
    .eq('topic_id', topicId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching subtopics:', error);
    throw error;
  }

  return (data as DbSubtopic[] || []).map(mapSubtopic);
}

export async function fetchLesson(subtopicId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('subtopic_id', subtopicId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }

  return data ? mapLesson(data as DbLesson) : null;
}

export async function upsertTopic(topic: Partial<Topic> & { id?: string }): Promise<Topic> {
  const dbTopic: Partial<DbTopic> = {};
  
  if (topic.id) dbTopic.id = topic.id;
  if (topic.slug) dbTopic.slug = topic.slug;
  if (topic.emoji) dbTopic.emoji = topic.emoji;
  if (topic.title) dbTopic.title = topic.title;
  if (topic.description !== undefined) dbTopic.description = topic.description;
  if (topic.lessonCount !== undefined) dbTopic.lesson_count = topic.lessonCount;
  if (topic.imageUrl !== undefined) dbTopic.image_url = topic.imageUrl;
  if (topic.sortOrder !== undefined) dbTopic.sort_order = topic.sortOrder;

  const { data, error } = await supabase
    .from('topics')
    .upsert(dbTopic)
    .select()
    .single();

  if (error) {
    console.error('Error upserting topic:', error);
    throw error;
  }

  return mapTopic(data as DbTopic);
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting topic:', error);
    throw error;
  }
}

export async function reorderTopics(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  const { error } = await supabase
    .from('topics')
    .upsert(updates);

  if (error) {
    console.error('Error reordering topics:', error);
    throw error;
  }
}

export async function upsertSubtopic(subtopic: Partial<Subtopic> & { id?: string }): Promise<Subtopic> {
  const dbSubtopic: Partial<DbSubtopic> = {};
  
  if (subtopic.id) dbSubtopic.id = subtopic.id;
  if (subtopic.topicId) dbSubtopic.topic_id = subtopic.topicId;
  if (subtopic.slug) dbSubtopic.slug = subtopic.slug;
  if (subtopic.emoji) dbSubtopic.emoji = subtopic.emoji;
  if (subtopic.title) dbSubtopic.title = subtopic.title;
  if (subtopic.description !== undefined) dbSubtopic.description = subtopic.description;
  if (subtopic.sortOrder !== undefined) dbSubtopic.sort_order = subtopic.sortOrder;

  const { data, error } = await supabase
    .from('subtopics')
    .upsert(dbSubtopic)
    .select()
    .single();

  if (error) {
    console.error('Error upserting subtopic:', error);
    throw error;
  }

  return mapSubtopic(data as DbSubtopic);
}

export async function deleteSubtopic(id: string): Promise<void> {
  const { error } = await supabase
    .from('subtopics')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subtopic:', error);
    throw error;
  }
}

export async function upsertLesson(
  subtopicId: string,
  blocks: LessonBlock[]
): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .upsert({
      subtopic_id: subtopicId,
      blocks,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting lesson:', error);
    throw error;
  }

  return mapLesson(data as DbLesson);
}
