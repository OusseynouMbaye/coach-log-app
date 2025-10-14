import { useState, useEffect, useCallback } from 'react';
import { SupabaseWorkSessionService, type WorkSession } from '../services/supabaseService';

export function useWorkSessions() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SupabaseWorkSessionService.getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const createSession = useCallback(async (session: Omit<WorkSession, 'id'>) => {
    try {
      const newSession = await SupabaseWorkSessionService.createSession(session);
      if (newSession) {
        refresh();
        return newSession;
      }
      throw new Error('Échec de la création de la session');
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  }, [refresh]);

  const updateSession = useCallback(async (id: string, updates: Partial<WorkSession>) => {
    try {
      const updatedSession = await SupabaseWorkSessionService.updateSession(id, updates);
      if (updatedSession) {
        refresh();
        return updatedSession;
      }
      throw new Error('Échec de la mise à jour de la session');
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  }, [refresh]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const success = await SupabaseWorkSessionService.deleteSession(id);
      if (success) {
        refresh();
        return true;
      }
      throw new Error('Échec de la suppression de la session');
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  }, [refresh]);

  return {
    sessions,
    loading,
    error,
    refresh,
    createSession,
    updateSession,
    deleteSession,
  };
}

export function useUserSessions(userId: string) {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SupabaseWorkSessionService.getSessionsByUserId(userId);
      setSessions(data);
    } catch (err) {
      console.error('Error loading user sessions:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  }, [userId, refreshKey]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    sessions,
    loading,
    error,
    refresh,
  };
}

export function useUserIds() {
  const [userIds, setUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserIds = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await SupabaseWorkSessionService.getAllUserIds();
        setUserIds(data);
      } catch (err) {
        console.error('Error loading user IDs:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    loadUserIds();
  }, []);

  return { userIds, loading, error };
}
