import { supabase } from '@/supabase';
import type { DbProfile, UserProfile } from '@/types';

export function mapProfile(dbProfile: DbProfile): UserProfile {
  return {
    id: dbProfile.id,
    username: dbProfile.username,
    email: dbProfile.email,
    avatarUrl: dbProfile.avatar_url,
    role: dbProfile.role,
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data ? mapProfile(data as DbProfile) : null;
}

export async function fetchProfilesBatch(userIds: string[]): Promise<Map<string, UserProfile>> {
  const uniqueIds = [...new Set(userIds)];
  
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds);

  if (error) {
    console.error('Error fetching profiles batch:', error);
    return new Map();
  }

  const profileMap = new Map<string, UserProfile>();
  (data as DbProfile[] || []).forEach((profile) => {
    profileMap.set(profile.id, mapProfile(profile));
  });

  return profileMap;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'username' | 'avatarUrl'>>
): Promise<UserProfile | null> {
  const dbUpdates: Partial<DbProfile> = {};
  
  if (updates.username !== undefined) {
    dbUpdates.username = updates.username;
  }
  if (updates.avatarUrl !== undefined) {
    dbUpdates.avatar_url = updates.avatarUrl;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data ? mapProfile(data as DbProfile) : null;
}
