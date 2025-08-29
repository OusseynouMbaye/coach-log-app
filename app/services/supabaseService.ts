import { supabase, type WorkSession as SupabaseWorkSession, type Category } from '../../lib/supabase';

// Type mapping between local format and Supabase format
export interface WorkSession {
  id: string;
  userId: string;
  category: string;
  startTime: string;
  endTime: string;
  durationInMinutes: number;
}

export class SupabaseWorkSessionService {
  
  // Convert between local format and Supabase format
  private static toSupabaseFormat(session: Partial<WorkSession>): Partial<SupabaseWorkSession> {
    return {
      id: session.id,
      user_id: session.userId,
      category: session.category,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_in_minutes: session.durationInMinutes,
    };
  }

  private static fromSupabaseFormat(session: SupabaseWorkSession): WorkSession {
    return {
      id: session.id,
      userId: session.user_id,
      category: session.category,
      startTime: session.start_time,
      endTime: session.end_time,
      durationInMinutes: session.duration_in_minutes,
    };
  }

  // Get all sessions
  static async getAllSessions(): Promise<WorkSession[]> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data.map(this.fromSupabaseFormat);
    } catch (error) {
      console.error('Error in getAllSessions:', error);
      return [];
    }
  }

  // Get sessions by user ID
  static async getSessionsByUserId(userId: string): Promise<WorkSession[]> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching sessions by user:', error);
        return [];
      }

      return data.map(this.fromSupabaseFormat);
    } catch (error) {
      console.error('Error in getSessionsByUserId:', error);
      return [];
    }
  }

  // Create new session
  static async createSession(session: Omit<WorkSession, 'id'>): Promise<WorkSession | null> {
    try {
      const supabaseSession = this.toSupabaseFormat(session);
      const { data, error } = await supabase
        .from('work_sessions')
        .insert([supabaseSession])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return this.fromSupabaseFormat(data);
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  // Update session
  static async updateSession(id: string, updates: Partial<WorkSession>): Promise<WorkSession | null> {
    try {
      const supabaseUpdates = this.toSupabaseFormat(updates);
      const { data, error } = await supabase
        .from('work_sessions')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        return null;
      }

      return this.fromSupabaseFormat(data);
    } catch (error) {
      console.error('Error in updateSession:', error);
      return null;
    }
  }

  // Delete session
  static async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('work_sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  // Get all unique user IDs
  static async getAllUserIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .select('user_id')
        .order('user_id');

      if (error) {
        console.error('Error fetching user IDs:', error);
        return [];
      }

      const uniqueUserIds = [...new Set(data.map(session => session.user_id))];
      return uniqueUserIds;
    } catch (error) {
      console.error('Error in getAllUserIds:', error);
      return [];
    }
  }

  // Get all categories
  static async getAllCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data.map(category => category.name);
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return [];
    }
  }

  // Create category
  static async createCategory(name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name }]);

      if (error) {
        console.error('Error creating category:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createCategory:', error);
      return false;
    }
  }

  // Statistics methods
  static async getTimeStatsByUserId(userId: string) {
    try {
      const sessions = await this.getSessionsByUserId(userId);
      const totalMinutes = sessions.reduce((total, session) => total + session.durationInMinutes, 0);
      const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

      // Calculate category breakdown
      const categoryBreakdown = sessions.reduce((acc, session) => {
        const existing = acc.find(item => item.category === session.category);
        if (existing) {
          existing.minutes += session.durationInMinutes;
          existing.sessions += 1;
        } else {
          acc.push({
            category: session.category,
            minutes: session.durationInMinutes,
            sessions: 1
          });
        }
        return acc;
      }, [] as Array<{ category: string; minutes: number; sessions: number }>);

      return {
        totalMinutes,
        totalHours,
        totalSessions: sessions.length,
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error in getTimeStatsByUserId:', error);
      return {
        totalMinutes: 0,
        totalHours: 0,
        totalSessions: 0,
        categoryBreakdown: []
      };
    }
  }

  static async getTotalTimeByCategory(userId: string, category: string): Promise<number> {
    try {
      const sessions = await this.getSessionsByUserId(userId);
      return sessions
        .filter(session => session.category === category)
        .reduce((total, session) => total + session.durationInMinutes, 0);
    } catch (error) {
      console.error('Error in getTotalTimeByCategory:', error);
      return 0;
    }
  }

  // Utility methods
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}min`;
    }
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}