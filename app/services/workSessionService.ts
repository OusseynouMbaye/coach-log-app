import workSessionData from '../../data/coach-log.json';

export interface WorkSession {
  id: string;
  userId: string;
  category: string;
  startTime: string;
  endTime: string;
  durationInMinutes: number;
}

export interface WorkSessionData {
  workSessions: WorkSession[];
  categories: string[];
}

export class WorkSessionService {
  private static data: WorkSessionData = workSessionData;

  static getAllSessions(): WorkSession[] {
    return this.data.workSessions;
  }

  static getSessionsByUserId(userId: string): WorkSession[] {
    return this.data.workSessions.filter(session => session.userId === userId);
  }

  static getSessionsByCategory(category: string): WorkSession[] {
    return this.data.workSessions.filter(session => session.category === category);
  }

  static getSessionsByDateRange(startDate: Date, endDate: Date): WorkSession[] {
    return this.data.workSessions.filter(session => {
      const sessionStart = new Date(session.startTime);
      return sessionStart >= startDate && sessionStart <= endDate;
    });
  }

  static getTotalTimeByUserId(userId: string): number {
    return this.getSessionsByUserId(userId)
      .reduce((total, session) => total + session.durationInMinutes, 0);
  }

  static getTotalTimeByCategory(userId: string, category: string): number {
    return this.data.workSessions
      .filter(session => session.userId === userId && session.category === category)
      .reduce((total, session) => total + session.durationInMinutes, 0);
  }

  static getTimeStatsByUserId(userId: string) {
    const sessions = this.getSessionsByUserId(userId);
    const totalMinutes = sessions.reduce((total, session) => total + session.durationInMinutes, 0);
    
    const categoryStats = this.data.categories.map(category => ({
      category,
      minutes: this.getTotalTimeByCategory(userId, category),
      sessions: sessions.filter(s => s.category === category).length
    })).filter(stat => stat.minutes > 0);

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalSessions: sessions.length,
      categoryBreakdown: categoryStats
    };
  }

  static getAllCategories(): string[] {
    return this.data.categories;
  }

  static getAllUserIds(): string[] {
    return [...new Set(this.data.workSessions.map(session => session.userId))];
  }

  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    }
    
    return mins === 0 ? `${hours}h` : `${hours}h${mins}min`;
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}