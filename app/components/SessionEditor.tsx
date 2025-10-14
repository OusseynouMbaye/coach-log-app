import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { WorkSession, SupabaseWorkSessionService } from '../services/supabaseService';
import { SessionEditService, EditSessionData } from '../services/sessionEditService';
import { useCategories } from '../hooks/useCategories';
import NativeDateTimePicker from './NativeDateTimePicker';

interface SessionEditorProps {
  visible: boolean;
  session: WorkSession | null;
  onClose: () => void;
  onSave?: (updatedSession: WorkSession) => void;
  onDelete?: (sessionId: string) => void;
}

export default function SessionEditor({ 
  visible, 
  session, 
  onClose, 
  onSave, 
  onDelete 
}: SessionEditorProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [editedData, setEditedData] = useState<EditSessionData>({
    category: '',
    startTime: '',
    endTime: '',
  });
  
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { categories, loading: categoriesLoading } = useCategories();

  // Initialise les données quand la session change
  useEffect(() => {
    if (session) {
      const sessionStartDate = new Date(session.startTime);
      const sessionEndDate = new Date(session.endTime);
      
      setStartDate(sessionStartDate);
      setEndDate(sessionEndDate);
      
      setEditedData({
        category: session.category,
        startTime: SessionEditService.formatDateForInput(session.startTime),
        endTime: SessionEditService.formatDateForInput(session.endTime),
        durationInMinutes: session.durationInMinutes
      });
      setIsEditing(false);
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  }, [session]);

  // Valide les données en temps réel
  useEffect(() => {
    if (isEditing && editedData.category && editedData.startTime && editedData.endTime) {
      const validation = SessionEditService.validateSession(editedData);
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);
    }
  }, [editedData, isEditing]);

  const handleSave = async () => {
    if (!session) return;

    // Validation
    const validation = SessionEditService.validateSession(editedData);
    if (!validation.isValid) {
      Alert.alert('Erreur', `Erreurs de validation: ${validation.errors.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      // Calcul de la durée
      const durationInMinutes = editedData.durationInMinutes ||
        SessionEditService.calculateDuration(editedData.startTime, editedData.endTime);

      // Mise à jour de la session via Supabase
      const updatedSession = await SupabaseWorkSessionService.updateSession(session.id, {
        category: editedData.category.trim(),
        startTime: SessionEditService.formatDateToISO(editedData.startTime),
        endTime: SessionEditService.formatDateToISO(editedData.endTime),
        durationInMinutes
      });

      if (updatedSession) {
        Alert.alert('Succès', 'Session modifiée avec succès');
        onSave?.(updatedSession);
        setIsEditing(false);
      } else {
        throw new Error('Échec de la mise à jour');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;

    setIsDeleting(true);
    try {
      const success = await SupabaseWorkSessionService.deleteSession(session.id);

      if (success) {
        Alert.alert('Supprimé', 'Session supprimée avec succès');
        onDelete?.(session.id);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartDateChange = (newDate: Date) => {
    console.log('SessionEditor - Nouvelle date de début:', newDate);
    setStartDate(newDate);
    const isoString = newDate.toISOString();
    const formattedString = SessionEditService.formatDateForInput(isoString);
    console.log('SessionEditor - Date formatée:', formattedString);
    setEditedData({
      ...editedData,
      startTime: formattedString
    });
  };

  const handleEndDateChange = (newDate: Date) => {
    console.log('SessionEditor - Nouvelle date de fin:', newDate);
    setEndDate(newDate);
    const isoString = newDate.toISOString();
    const formattedString = SessionEditService.formatDateForInput(isoString);
    console.log('SessionEditor - Date formatée:', formattedString);
    setEditedData({
      ...editedData,
      endTime: formattedString
    });
  };

  const handleCancel = () => {
    if (session) {
      const sessionStartDate = new Date(session.startTime);
      const sessionEndDate = new Date(session.endTime);
      
      setStartDate(sessionStartDate);
      setEndDate(sessionEndDate);
      
      setEditedData({
        category: session.category,
        startTime: SessionEditService.formatDateForInput(session.startTime),
        endTime: SessionEditService.formatDateForInput(session.endTime),
        durationInMinutes: session.durationInMinutes
      });
    }
    setIsEditing(false);
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const calculateDuration = () => {
    if (editedData.startTime && editedData.endTime) {
      return SessionEditService.calculateDuration(editedData.startTime, editedData.endTime);
    }
    return 0;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  if (!session) {
    return null;
  }

  const duration = isEditing ? calculateDuration() : session.durationInMinutes;
  const deletionImpact = SessionEditService.getDeletionImpact(session.id);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <View style={styles.headerLeft}>
            {isEditing && (
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: colors.headerText }]}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[styles.title, { color: colors.headerText }]}>
            {isEditing ? '✏️ Modifier' : '📝 Session'}
          </Text>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.headerText }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Informations de la session */}
          <View style={[styles.sessionInfo, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Détails de la session
            </Text>
            
            {/* Catégorie */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Catégorie</Text>
              {isEditing ? (
                <View style={styles.categorySelector}>
                  {categoriesLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {categories.map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          { 
                            backgroundColor: editedData.category === category ? colors.primary : colors.background,
                            borderColor: colors.border
                          }
                        ]}
                        onPress={() => setEditedData({...editedData, category})}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          { color: editedData.category === category ? '#fff' : colors.text }
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ) : (
                <Text style={[styles.fieldValue, { color: colors.primary }]}>
                  {session.category}
                </Text>
              )}
            </View>
            
            {/* Date et heure de début */}
            {isEditing ? (
              <NativeDateTimePicker
                label="Date et heure de début"
                value={startDate}
                onDateChange={handleStartDateChange}
              />
            ) : (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Date et heure de début</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {SupabaseWorkSessionService.formatDate(session.startTime)} à {' '}
                  {new Date(session.startTime).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}

            {/* Date et heure de fin */}
            {isEditing ? (
              <NativeDateTimePicker
                label="Date et heure de fin"
                value={endDate}
                onDateChange={handleEndDateChange}
              />
            ) : (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Date et heure de fin</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {SupabaseWorkSessionService.formatDate(session.endTime)} à {' '}
                  {new Date(session.endTime).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
            
            {/* Durée */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Durée</Text>
              <Text style={[styles.durationValue, { color: colors.primary }]}>
                {formatDuration(duration)} ({duration} minutes)
              </Text>
            </View>
          </View>

          {/* Validation */}
          {(validationErrors.length > 0 || validationWarnings.length > 0) && (
            <View style={[styles.validationSection, { backgroundColor: colors.cardBackground }]}>
              {validationErrors.map((error, index) => (
                <Text key={index} style={[styles.errorText, { color: colors.error }]}>
                  ❌ {error}
                </Text>
              ))}
              {validationWarnings.map((warning, index) => (
                <Text key={index} style={[styles.warningText, { color: colors.warning }]}>
                  ⚠️ {warning}
                </Text>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={[styles.actionsSection, { backgroundColor: colors.cardBackground }]}>
            {!isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.actionButtonText}>✏️ Modifier</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error }]}
                  onPress={() => setShowDeleteConfirm(true)}
                >
                  <Text style={styles.actionButtonText}>🗑️ Supprimer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: (validationErrors.length > 0 || isSaving) ? colors.textSecondary : colors.success
                    }
                  ]}
                  onPress={handleSave}
                  disabled={validationErrors.length > 0 || isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>💾 Sauvegarder</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.textSecondary }]}
                  onPress={handleCancel}
                >
                  <Text style={styles.actionButtonText}>❌ Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        {/* Modal de confirmation de suppression */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmModal, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Supprimer la session
              </Text>
              
              <Text style={[styles.modalText, { color: colors.text }]}>
                Êtes-vous sûr de vouloir supprimer cette session ?
              </Text>
              
              {deletionImpact.canDelete && (
                <View style={styles.impactSection}>
                  <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                    📊 {deletionImpact.impact.totalHoursLost}h supprimées
                  </Text>
                  <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                    📅 {deletionImpact.impact.dateAffected}
                  </Text>
                  <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                    🗂️ {deletionImpact.impact.categoryAffected}
                  </Text>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.error }]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                      Supprimer
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerLeft: {
    width: 80,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    width: 80,
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sessionInfo: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  categorySelector: {
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  validationSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  impactSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  impactText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});