import { useState, useEffect, useCallback } from 'react';
import { TrainingPlanService } from '../services/trainingPlanService';
import { TrainingPlan, TrainingExercise } from '../../lib/supabase';

export function useTrainingPlans() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TrainingPlanService.getAllPlans();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const createPlan = useCallback(
    async (
      plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>,
      exercises: Omit<TrainingExercise, 'id' | 'planId'>[]
    ) => {
      const result = await TrainingPlanService.createPlan(plan, exercises);
      if (result) refresh();
      return result;
    },
    [refresh]
  );

  const updatePlan = useCallback(
    async (
      id: string,
      updates: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>,
      exercises?: Omit<TrainingExercise, 'id' | 'planId'>[]
    ) => {
      const ok = await TrainingPlanService.updatePlan(id, updates, exercises);
      if (ok) refresh();
      return ok;
    },
    [refresh]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      const ok = await TrainingPlanService.deletePlan(id);
      if (ok) refresh();
      return ok;
    },
    [refresh]
  );

  return { plans, loading, error, refresh, createPlan, updatePlan, deletePlan };
}
