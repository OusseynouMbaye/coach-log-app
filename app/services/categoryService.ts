import { WorkSessionService, WorkSession } from './workSessionService';

export interface CategoryStats {
  category: string;
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  usedByCoaches: string[];
}

export class CategoryService {
  static getCategoryStats(category: string): CategoryStats {
    const allSessions = WorkSessionService.getAllSessions();
    const categorySessions = allSessions.filter(session => session.category === category);
    
    const totalMinutes = categorySessions.reduce((total, session) => total + session.durationInMinutes, 0);
    const usedByCoaches = [...new Set(categorySessions.map(session => session.userId))];
    
    return {
      category,
      totalSessions: categorySessions.length,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      usedByCoaches
    };
  }

  static getAllCategoryStats(): CategoryStats[] {
    const categories = WorkSessionService.getAllCategories();
    return categories.map(category => this.getCategoryStats(category));
  }

  static canDeleteCategory(category: string): boolean {
    const stats = this.getCategoryStats(category);
    return stats.totalSessions === 0;
  }

  static getDeleteCategoryImpact(category: string): {
    canDelete: boolean;
    affectedSessions: number;
    affectedCoaches: string[];
    message: string;
  } {
    const stats = this.getCategoryStats(category);
    const canDelete = stats.totalSessions === 0;
    
    if (canDelete) {
      return {
        canDelete: true,
        affectedSessions: 0,
        affectedCoaches: [],
        message: `La catégorie "${category}" peut être supprimée en toute sécurité car elle n'est utilisée par aucune session.`
      };
    } else {
      return {
        canDelete: false,
        affectedSessions: stats.totalSessions,
        affectedCoaches: stats.usedByCoaches,
        message: `La catégorie "${category}" ne peut pas être supprimée car elle est utilisée par ${stats.totalSessions} session(s) de ${stats.usedByCoaches.length} coach(es).`
      };
    }
  }

  static simulateDeleteCategory(category: string): {
    remainingCategories: string[];
    deletedSessions: WorkSession[];
    message: string;
  } {
    const allCategories = WorkSessionService.getAllCategories();
    const allSessions = WorkSessionService.getAllSessions();
    
    const remainingCategories = allCategories.filter(cat => cat !== category);
    const deletedSessions = allSessions.filter(session => session.category === category);
    
    return {
      remainingCategories,
      deletedSessions,
      message: deletedSessions.length > 0 
        ? `La suppression de "${category}" supprimera également ${deletedSessions.length} session(s).`
        : `La catégorie "${category}" sera supprimée sans affecter les sessions.`
    };
  }

  // Note: Ces méthodes simulent la suppression car nous travaillons avec des fichiers statiques
  // Dans une vraie app, elles modifieraient la base de données ou l'API
  static deleteCategory(category: string, deleteAssociatedSessions: boolean = false): {
    success: boolean;
    message: string;
    deletedSessions?: number;
  } {
    const impact = this.getDeleteCategoryImpact(category);
    
    if (!impact.canDelete && !deleteAssociatedSessions) {
      return {
        success: false,
        message: `Impossible de supprimer "${category}" car elle contient ${impact.affectedSessions} session(s). Cochez "Supprimer les sessions" pour forcer la suppression.`
      };
    }
    
    // Simulation de la suppression
    const deletedSessions = impact.affectedSessions;
    
    return {
      success: true,
      message: `Catégorie "${category}" supprimée avec succès.`,
      deletedSessions: deleteAssociatedSessions ? deletedSessions : 0
    };
  }

  static getUnusedCategories(): string[] {
    return this.getAllCategoryStats()
      .filter(stats => stats.totalSessions === 0)
      .map(stats => stats.category);
  }

  static getMostUsedCategories(limit: number = 5): CategoryStats[] {
    return this.getAllCategoryStats()
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, limit);
  }

  static getLeastUsedCategories(limit: number = 5): CategoryStats[] {
    return this.getAllCategoryStats()
      .filter(stats => stats.totalSessions > 0)
      .sort((a, b) => a.totalSessions - b.totalSessions)
      .slice(0, limit);
  }
}