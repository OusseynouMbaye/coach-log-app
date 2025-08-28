import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Switch
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { CategoryService, CategoryStats } from '../services/categoryService';

interface CategoryManagerProps {
  visible: boolean;
  onClose: () => void;
}

export default function CategoryManager({ visible, onClose }: CategoryManagerProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteWithSessions, setDeleteWithSessions] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'sessions' | 'usage'>('name');
  
  const categoryStats = useMemo(() => {
    const stats = CategoryService.getAllCategoryStats();
    
    switch (sortBy) {
      case 'sessions':
        return stats.sort((a, b) => b.totalSessions - a.totalSessions);
      case 'usage':
        return stats.sort((a, b) => b.usedByCoaches.length - a.usedByCoaches.length);
      default:
        return stats.sort((a, b) => a.category.localeCompare(b.category));
    }
  }, [sortBy]);

  const handleDeleteCategory = (category: string) => {
    setSelectedCategory(category);
    setDeleteWithSessions(false);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (!selectedCategory) return;
    
    const impact = CategoryService.getDeleteCategoryImpact(selectedCategory);
    
    if (!impact.canDelete && !deleteWithSessions) {
      Alert.alert(
        'Suppression impossible',
        impact.message + '\n\nVoulez-vous supprimer les sessions associées ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer tout', 
            style: 'destructive',
            onPress: () => {
              setDeleteWithSessions(true);
              performDelete();
            }
          }
        ]
      );
      return;
    }
    
    performDelete();
  };

  const performDelete = () => {
    if (!selectedCategory) return;
    
    const result = CategoryService.deleteCategory(selectedCategory, deleteWithSessions);
    
    if (result.success) {
      Alert.alert(
        'Succès',
        result.message + (result.deletedSessions ? ` ${result.deletedSessions} session(s) supprimée(s).` : ''),
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Erreur', result.message);
    }
    
    setShowDeleteConfirmation(false);
    setSelectedCategory(null);
    setDeleteWithSessions(false);
  };

  const getCategoryColor = (stats: CategoryStats) => {
    if (stats.totalSessions === 0) return colors.textSecondary;
    if (stats.totalSessions < 3) return colors.warning;
    return colors.primary;
  };

  const renderCategoryCard = (stats: CategoryStats) => (
    <View key={stats.category} style={[styles.categoryCard, { 
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      shadowColor: colors.shadow
    }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.text }]}>
            {stats.category}
          </Text>
          <View style={styles.categoryMeta}>
            <Text style={[styles.metaText, { color: getCategoryColor(stats) }]}>
              {stats.totalSessions} session{stats.totalSessions > 1 ? 's' : ''}
            </Text>
            <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {stats.totalHours}h
            </Text>
            {stats.usedByCoaches.length > 0 && (
              <>
                <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {stats.usedByCoaches.length} coach{stats.usedByCoaches.length > 1 ? 'es' : ''}
                </Text>
              </>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.deleteButton, {
            backgroundColor: stats.totalSessions === 0 ? colors.error : colors.warning,
          }]}
          onPress={() => handleDeleteCategory(stats.category)}
        >
          <Text style={styles.deleteButtonText}>
            {stats.totalSessions === 0 ? '🗑️' : '⚠️'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {stats.usedByCoaches.length > 0 && (
        <View style={styles.coachList}>
          <Text style={[styles.coachLabel, { color: colors.textSecondary }]}>
            Utilisée par:
          </Text>
          <View style={styles.coachTags}>
            {stats.usedByCoaches.map(coach => (
              <View key={coach} style={[styles.coachTag, { backgroundColor: colors.background }]}>
                <Text style={[styles.coachTagText, { color: colors.primary }]}>
                  {coach.replace('coach', 'Coach ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <Text style={[styles.title, { color: colors.headerText }]}>
            🗂️ Gestion des catégories
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.headerText }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Filtres de tri */}
          <View style={[styles.sortSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trier par</Text>
            <View style={styles.sortButtons}>
              {[
                { key: 'name', label: 'Nom' },
                { key: 'sessions', label: 'Sessions' },
                { key: 'usage', label: 'Utilisation' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortButton,
                    { 
                      backgroundColor: sortBy === option.key ? colors.primary : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Text style={[
                    styles.sortButtonText,
                    { color: sortBy === option.key ? '#fff' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Statistiques globales */}
          <View style={[styles.statsSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistiques</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {categoryStats.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Catégories
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  {categoryStats.filter(s => s.totalSessions > 0).length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Utilisées
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  {CategoryService.getUnusedCategories().length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Inutilisées
                </Text>
              </View>
            </View>
          </View>

          {/* Liste des catégories */}
          <View style={[styles.categoriesSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Catégories ({categoryStats.length})
            </Text>
            
            {categoryStats.map(renderCategoryCard)}
          </View>
        </ScrollView>

        {/* Modal de confirmation de suppression */}
        <Modal
          visible={showDeleteConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirmation(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmationModal, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Supprimer la catégorie
              </Text>
              
              {selectedCategory && (
                <View>
                  <Text style={[styles.modalText, { color: colors.text }]}>
                    Êtes-vous sûr de vouloir supprimer "{selectedCategory}" ?
                  </Text>
                  
                  {CategoryService.getDeleteCategoryImpact(selectedCategory).affectedSessions > 0 && (
                    <View style={styles.warningSection}>
                      <Text style={[styles.warningText, { color: colors.error }]}>
                        ⚠️ Cette catégorie contient {CategoryService.getDeleteCategoryImpact(selectedCategory).affectedSessions} session(s)
                      </Text>
                      
                      <View style={styles.switchRow}>
                        <Text style={[styles.switchLabel, { color: colors.text }]}>
                          Supprimer les sessions associées
                        </Text>
                        <Switch
                          value={deleteWithSessions}
                          onValueChange={setDeleteWithSessions}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor={deleteWithSessions ? '#fff' : colors.textSecondary}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowDeleteConfirmation(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.error }]}
                  onPress={confirmDelete}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Supprimer
                  </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sortSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoriesSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  coachList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  coachLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  coachTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  coachTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coachTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
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
  warningSection: {
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    flex: 1,
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