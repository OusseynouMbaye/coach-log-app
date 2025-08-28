import { WorkSession, WorkSessionService } from './workSessionService';

export interface EditSessionData {
  category: string;
  startTime: string;
  endTime: string;
  durationInMinutes?: number; // Calculé automatiquement si non fourni
}

export interface SessionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SessionEditService {
  
  // Valide les données d'une session
  static validateSession(sessionData: EditSessionData): SessionValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validation de la catégorie
    if (!sessionData.category || sessionData.category.trim() === '') {
      errors.push('La catégorie est obligatoire');
    }
    
    // Validation des dates
    if (!sessionData.startTime || !sessionData.endTime) {
      errors.push('Les heures de début et fin sont obligatoires');
      return { isValid: false, errors, warnings };
    }
    
    const startDate = new Date(sessionData.startTime);
    const endDate = new Date(sessionData.endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push('Format de date invalide');
      return { isValid: false, errors, warnings };
    }
    
    if (startDate >= endDate) {
      errors.push('L\'heure de fin doit être postérieure à l\'heure de début');
    }
    
    // Calcul de la durée
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    
    if (durationMinutes < 1) {
      errors.push('La durée doit être d\'au moins 1 minute');
    }
    
    if (durationMinutes > 24 * 60) {
      warnings.push('La durée dépasse 24 heures, vérifiez les dates');
    }
    
    // Vérification si la date est dans le futur
    const now = new Date();
    if (startDate > now) {
      warnings.push('Cette session est planifiée dans le futur');
    }
    
    // Vérification si la session est très longue
    if (durationMinutes > 8 * 60) {
      warnings.push('Session de plus de 8 heures, vérifiez la durée');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  // Calcule la durée en minutes entre deux dates
  static calculateDuration(startTime: string, endTime: string): number {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationMs = endDate.getTime() - startDate.getTime();
    return Math.round(durationMs / (1000 * 60));
  }
  
  // Formate une date pour l'input datetime-local
  static formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  // Convertit une date au format ISO
  static formatDateToISO(dateString: string): string {
    return new Date(dateString).toISOString();
  }
  
  // Simule la modification d'une session
  static editSession(sessionId: string, updatedData: EditSessionData): {
    success: boolean;
    message: string;
    updatedSession?: WorkSession;
  } {
    // Validation
    const validation = this.validateSession(updatedData);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Erreurs de validation: ${validation.errors.join(', ')}`
      };
    }
    
    // Recherche de la session existante
    const existingSession = WorkSessionService.getAllSessions().find(s => s.id === sessionId);
    if (!existingSession) {
      return {
        success: false,
        message: 'Session non trouvée'
      };
    }
    
    // Calcul de la durée si non fournie
    const durationInMinutes = updatedData.durationInMinutes || 
      this.calculateDuration(updatedData.startTime, updatedData.endTime);
    
    // Création de la session mise à jour
    const updatedSession: WorkSession = {
      ...existingSession,
      category: updatedData.category.trim(),
      startTime: this.formatDateToISO(updatedData.startTime),
      endTime: this.formatDateToISO(updatedData.endTime),
      durationInMinutes
    };
    
    // Simulation de la sauvegarde
    return {
      success: true,
      message: 'Session modifiée avec succès',
      updatedSession
    };
  }
  
  // Simule la suppression d'une session
  static deleteSession(sessionId: string): {
    success: boolean;
    message: string;
    deletedSession?: WorkSession;
  } {
    // Recherche de la session
    const existingSession = WorkSessionService.getAllSessions().find(s => s.id === sessionId);
    if (!existingSession) {
      return {
        success: false,
        message: 'Session non trouvée'
      };
    }
    
    // Simulation de la suppression
    return {
      success: true,
      message: 'Session supprimée avec succès',
      deletedSession: existingSession
    };
  }
  
  // Obtient les statistiques d'impact de la suppression
  static getDeletionImpact(sessionId: string): {
    canDelete: boolean;
    session?: WorkSession;
    impact: {
      totalHoursLost: number;
      categoryAffected: string;
      coachAffected: string;
      dateAffected: string;
    };
  } {
    const session = WorkSessionService.getAllSessions().find(s => s.id === sessionId);
    
    if (!session) {
      return {
        canDelete: false,
        impact: {
          totalHoursLost: 0,
          categoryAffected: '',
          coachAffected: '',
          dateAffected: ''
        }
      };
    }
    
    return {
      canDelete: true,
      session,
      impact: {
        totalHoursLost: Math.round((session.durationInMinutes / 60) * 100) / 100,
        categoryAffected: session.category,
        coachAffected: session.userId,
        dateAffected: new Date(session.startTime).toLocaleDateString('fr-FR')
      }
    };
  }
  
  // Crée une copie d'une session existante
  static duplicateSession(sessionId: string, newStartTime?: string): {
    success: boolean;
    message: string;
    newSession?: WorkSession & { id: string };
  } {
    const existingSession = WorkSessionService.getAllSessions().find(s => s.id === sessionId);
    if (!existingSession) {
      return {
        success: false,
        message: 'Session non trouvée'
      };
    }
    
    // Génération d'un nouvel ID
    const allSessions = WorkSessionService.getAllSessions();
    const maxId = Math.max(...allSessions.map(s => parseInt(s.id))) || 0;
    const newId = (maxId + 1).toString();
    
    // Calcul des nouvelles dates si spécifiées
    let startTime = existingSession.startTime;
    let endTime = existingSession.endTime;
    
    if (newStartTime) {
      const originalStart = new Date(existingSession.startTime);
      const originalEnd = new Date(existingSession.endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();
      
      startTime = this.formatDateToISO(newStartTime);
      endTime = new Date(new Date(newStartTime).getTime() + duration).toISOString();
    }
    
    const newSession = {
      ...existingSession,
      id: newId,
      startTime,
      endTime
    };
    
    return {
      success: true,
      message: 'Session dupliquée avec succès',
      newSession
    };
  }
}