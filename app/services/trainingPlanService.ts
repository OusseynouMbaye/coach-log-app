import { supabase, TrainingPlan, TrainingExercise, TrainingPlanRow, TrainingExerciseRow } from '../../lib/supabase';

export class TrainingPlanService {

  // ─── Format conversion ───────────────────────────────────────

  private static planFromRow(row: TrainingPlanRow): TrainingPlan {
    return {
      id: row.id,
      title: row.title,
      date: row.date,
      createdBy: row.created_by,
      lastModifiedBy: row.last_modified_by,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static exerciseFromRow(row: TrainingExerciseRow): TrainingExercise {
    return {
      id: row.id,
      planId: row.plan_id,
      orderIndex: row.order_index,
      name: row.name,
      content: row.content,
    };
  }

  // ─── Plans ───────────────────────────────────────────────────

  static async getAllPlans(): Promise<TrainingPlan[]> {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching training plans:', error);
        return [];
      }
      return (data as TrainingPlanRow[]).map(this.planFromRow);
    } catch (err) {
      console.error('❌ Exception in getAllPlans:', err);
      return [];
    }
  }

  static async getPlanWithExercises(
    id: string
  ): Promise<{ plan: TrainingPlan; exercises: TrainingExercise[] } | null> {
    try {
      const [planRes, exRes] = await Promise.all([
        supabase.from('training_plans').select('*').eq('id', id).single(),
        supabase
          .from('training_exercises')
          .select('*')
          .eq('plan_id', id)
          .order('order_index', { ascending: true }),
      ]);

      if (planRes.error || !planRes.data) {
        console.error('❌ Error fetching plan:', planRes.error);
        return null;
      }

      const plan = this.planFromRow(planRes.data as TrainingPlanRow);
      const exercises = exRes.error
        ? []
        : (exRes.data as TrainingExerciseRow[]).map(this.exerciseFromRow);

      return { plan, exercises };
    } catch (err) {
      console.error('❌ Exception in getPlanWithExercises:', err);
      return null;
    }
  }

  static async createPlan(
    plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>,
    exercises: Omit<TrainingExercise, 'id' | 'planId'>[]
  ): Promise<TrainingPlan | null> {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .insert([{
          title: plan.title,
          date: plan.date,
          created_by: plan.createdBy,
          last_modified_by: plan.createdBy,
          notes: plan.notes ?? null,
        }])
        .select()
        .single();

      if (error || !data) {
        console.error('❌ Error creating plan:', error);
        return null;
      }

      const newPlan = this.planFromRow(data as TrainingPlanRow);

      if (exercises.length > 0) {
        const exerciseRows = exercises.map((ex, idx) => ({
          plan_id: newPlan.id,
          order_index: idx,
          name: ex.name,
          content: ex.content,
        }));

        const { error: exError } = await supabase
          .from('training_exercises')
          .insert(exerciseRows);

        if (exError) {
          console.error('❌ Error inserting exercises:', exError);
        }
      }

      return newPlan;
    } catch (err) {
      console.error('❌ Exception in createPlan:', err);
      return null;
    }
  }

  static async updatePlan(
    id: string,
    updates: Partial<Omit<TrainingPlan, 'id' | 'createdAt'>>,
    exercises?: Omit<TrainingExercise, 'id' | 'planId'>[]
  ): Promise<boolean> {
    try {
      const rowUpdates: any = {};
      if (updates.title !== undefined) rowUpdates.title = updates.title;
      if (updates.date !== undefined) rowUpdates.date = updates.date;
      if (updates.notes !== undefined) rowUpdates.notes = updates.notes;
      if (updates.lastModifiedBy !== undefined) rowUpdates.last_modified_by = updates.lastModifiedBy;
      rowUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('training_plans')
        .update(rowUpdates)
        .eq('id', id);

      if (error) {
        console.error('❌ Error updating plan:', error);
        return false;
      }

      // Replace exercises if provided
      if (exercises !== undefined) {
        await supabase.from('training_exercises').delete().eq('plan_id', id);

        if (exercises.length > 0) {
          const exerciseRows = exercises.map((ex, idx) => ({
            plan_id: id,
            order_index: idx,
            name: ex.name,
            content: ex.content,
          }));

          const { error: exError } = await supabase
            .from('training_exercises')
            .insert(exerciseRows);

          if (exError) {
            console.error('❌ Error replacing exercises:', exError);
          }
        }
      }

      return true;
    } catch (err) {
      console.error('❌ Exception in updatePlan:', err);
      return false;
    }
  }

  static async deletePlan(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting plan:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('❌ Exception in deletePlan:', err);
      return false;
    }
  }

  // ─── Utility ─────────────────────────────────────────────────

  static formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  static formatCoachName(coachId: string): string {
    return coachId.replace(/^coach/, 'Coach ');
  }
}
