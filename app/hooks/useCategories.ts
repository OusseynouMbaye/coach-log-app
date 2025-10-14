import { useState, useEffect, useCallback } from 'react';
import { SupabaseWorkSessionService } from '../services/supabaseService';

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SupabaseWorkSessionService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const createCategory = useCallback(async (name: string) => {
    try {
      const success = await SupabaseWorkSessionService.createCategory(name);
      if (success) {
        refresh();
        return true;
      }
      throw new Error('Échec de la création de la catégorie');
    } catch (err) {
      console.error('Error creating category:', err);
      throw err;
    }
  }, [refresh]);

  return {
    categories,
    loading,
    error,
    refresh,
    createCategory,
  };
}
