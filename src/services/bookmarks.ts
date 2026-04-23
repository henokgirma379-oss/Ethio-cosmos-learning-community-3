import { supabase } from '@/supabase';
import type { DbBookmark, Bookmark } from '@/types';

export function mapBookmark(dbBookmark: DbBookmark): Bookmark {
  return {
    id: dbBookmark.id,
    userId: dbBookmark.user_id,
    itemType: dbBookmark.item_type,
    itemId: dbBookmark.item_id,
    title: dbBookmark.title,
    description: dbBookmark.description,
    url: dbBookmark.url,
    createdAt: dbBookmark.created_at,
  };
}

export async function fetchBookmarks(userId: string): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }

  return (data as DbBookmark[] || []).map(mapBookmark);
}

export async function addBookmark(
  userId: string,
  data: {
    itemType: 'topic' | 'subtopic';
    itemId: string;
    title: string;
    description?: string | null;
    url: string;
  }
): Promise<Bookmark> {
  const { data: result, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      item_type: data.itemType,
      item_id: data.itemId,
      title: data.title,
      description: data.description,
      url: data.url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }

  return mapBookmark(result as DbBookmark);
}

export async function removeBookmark(userId: string, bookmarkId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

export async function isBookmarked(
  userId: string,
  itemId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }

  return !!data;
}
