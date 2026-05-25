import {
  Category,
  CategoryId,
  CategoryInput,
  CategoryUpdate,
  defaultCategories,
} from '@/types/schedule';
import { assertSupabaseConfigured, isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

const COLLECTION = 'categories';

// Subscribe to real-time category changes
export const subscribeToCategories = (
  userId: string,
  callback: (categories: Category[]) => void,
) => {
  if (!isSupabaseConfigured) {
    callback([]);
    return () => undefined;
  }

  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`public:${COLLECTION}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COLLECTION,
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const latest = await fetchCategories(userId);
        callback(latest);
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchCategories(userId).then(callback).catch(() => callback([]));
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

// Fetch all categories for a user
export const fetchCategories = async (userId: string): Promise<Category[]> => {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }));
};

// Create a new category
export const createCategory = async (input: CategoryInput): Promise<Category> => {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const payload = {
    user_id: input.userId,
    name: input.name,
    color: input.color,
    icon: input.icon,
  };

  const { data, error } = await supabase.from(COLLECTION).insert(payload).select().single();
  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    color: data.color,
    icon: data.icon,
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
  };
};

// Update an existing category
export const updateCategory = async (
  id: CategoryId,
  updates: CategoryUpdate,
) => {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const payload: Record<string, any> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(COLLECTION).update(payload).eq('id', id);
  if (error) {
    throw error;
  }
};

// Delete a category
export const removeCategory = async (id: CategoryId) => {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(COLLECTION).delete().eq('id', id);
  if (error) {
    throw error;
  }
};

// Initialize default categories for a new user
export const initializeDefaultCategories = async (userId: string): Promise<Category[]> => {
  assertSupabaseConfigured();

  // Check if user already has categories
  const existing = await fetchCategories(userId);
  if (existing.length > 0) {
    return existing;
  }

  // Create default categories
  const created: Category[] = [];
  for (const cat of defaultCategories) {
    const newCat = await createCategory({
      userId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
    });
    created.push(newCat);
  }

  return created;
};
