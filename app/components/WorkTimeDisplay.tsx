import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { WorkSession } from '../services/supabaseService';
import { SupabaseWorkSessionService } from '../services/supabaseService';
import { useWorkSessions, useUserIds } from '../hooks/useWorkSessions';
import { useCategories } from '../hooks/useCategories';
import UserSelector from './UserSelector';
import SessionEditor from './SessionEditor';

interface WorkTimeDisplayProps {
  visible: boolean;
  onClose: () => void;
}

export default function WorkTimeDisplay({ visible, onClose }: WorkTimeDisplayProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);
  const [showSessionEditor, setShowSessionEditor] = useState(false);

  // Utilisation des hooks Supabase
  const { sessions, loading: sessionsLoading, refresh: refreshSessions } = useWorkSessions();
  const { userIds, loading: userIdsLoading } = useUserIds();
  const { categories: categoriesData, loading: categoriesLoading } = useCategories();

  const categories = ['all', ...categoriesData];
  const loading = sessionsLoading || userIdsLoading || categoriesLoading;
  
  const filteredStats = useMemo(() => {
    if (selectedUserId === 'all') {
      // Stats pour tous les coaches
      let filteredSessions = sessions;

      if (selectedCategory !== 'all') {
        filteredSessions = sessions.filter(s => s.category === selectedCategory);
      }

      const totalMinutes = filteredSessions.reduce((total, session) => total + session.durationInMinutes, 0);

      // Calcul par catégorie pour tous les coaches
      const categoryBreakdown = categoriesData.map(category => {
        const categorySessions = sessions.filter(s => s.category === category);
        const categoryMinutes = categorySessions.reduce((total, session) => total + session.durationInMinutes, 0);
        return {
          category,
          minutes: categoryMinutes,
          sessions: categorySessions.length
        };
      }).filter(stat => stat.minutes > 0);

      return {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        totalSessions: filteredSessions.length,
        categoryBreakdown: selectedCategory === 'all' ? categoryBreakdown : categoryBreakdown.filter(cat => cat.category === selectedCategory)
      };
    } else {
      // Stats pour un coach spécifique
      const userSessions = sessions.filter(s => s.userId === selectedUserId);

      let filteredUserSessions = userSessions;
      if (selectedCategory !== 'all') {
        filteredUserSessions = userSessions.filter(s => s.category === selectedCategory);
      }

      const totalMinutes = filteredUserSessions.reduce((total, session) => total + session.durationInMinutes, 0);

      // Calculate category breakdown
      const categoryBreakdown = categoriesData.map(category => {
        const categorySessions = userSessions.filter(s => s.category === category);
        const categoryMinutes = categorySessions.reduce((total, session) => total + session.durationInMinutes, 0);
        return {
          category,
          minutes: categoryMinutes,
          sessions: categorySessions.length
        };
      }).filter(stat => stat.minutes > 0);

      if (selectedCategory !== 'all') {
        return {
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 100) / 100,
          totalSessions: filteredUserSessions.length,
          categoryBreakdown: categoryBreakdown.filter(cat => cat.category === selectedCategory)
        };
      }

      return {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100,
        totalSessions: filteredUserSessions.length,
        categoryBreakdown
      };
    }
  }, [selectedUserId, selectedCategory, sessions, categoriesData]);
  
  const recentSessions = useMemo(() => {
    let filteredSessions = sessions;

    if (selectedUserId !== 'all') {
      filteredSessions = sessions.filter(s => s.userId === selectedUserId);
    }

    if (selectedCategory !== 'all') {
      filteredSessions = filteredSessions.filter(s => s.category === selectedCategory);
    }

    return filteredSessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
  }, [selectedUserId, selectedCategory, sessions]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserSelector(false);
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === 'all') return 'Tous les coaches';
    return userId.replace(/^coach/, 'Coach ');
  };

  const handleSessionSelect = (session: WorkSession) => {
    setSelectedSession(session);
    setShowSessionEditor(true);
  };

  const handleSessionSave = (updatedSession: WorkSession) => {
    console.log('Session mise à jour:', updatedSession);
    setShowSessionEditor(false);
    setSelectedSession(null);
    // Rafraîchir les données depuis Supabase
    refreshSessions();
  };

  const handleSessionDelete = (sessionId: string) => {
    console.log('Session supprimée:', sessionId);
    setShowSessionEditor(false);
    setSelectedSession(null);
    // Rafraîchir les données depuis Supabase après suppression
    refreshSessions();
  };

  if (showUserSelector) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header pour le sélecteur */}
          <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
            <TouchableOpacity onPress={() => setShowUserSelector(false)} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.headerText }]}>← Retour</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.headerText }]}>
              👥 Sélection Coach
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.headerText }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <UserSelector
              selectedUserId={selectedUserId}
              onSelectUser={handleUserSelect}
              showAllOption={true}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <TouchableOpacity 
            onPress={() => setShowUserSelector(true)} 
            style={styles.userButton}
          >
            <Text style={[styles.userButtonText, { color: colors.headerText }]}>
              👤 {getUserDisplayName(selectedUserId)}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.headerText }]}>
            📊 Temps de travail
          </Text>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.headerText }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Filtre par catégorie */}
          <View style={[styles.filtersSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Filtrer par catégorie</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: selectedCategory === 'all' ? colors.primary : colors.cardBackground,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: selectedCategory === 'all' ? '#fff' : colors.text }
                ]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              {categoriesData.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterButton,
                    { 
                      backgroundColor: selectedCategory === category ? colors.primary : colors.cardBackground,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: selectedCategory === category ? '#fff' : colors.text }
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Indicateur de chargement */}
          {loading && (
            <View style={[styles.loadingSection, { backgroundColor: colors.cardBackground }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Chargement des données...
              </Text>
            </View>
          )}

          {/* Statistiques globales */}
          {!loading && (
            <View style={[styles.statsSection, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Résumé</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {filteredStats.totalHours}h
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Temps total
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {filteredStats.totalSessions}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Sessions
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {Math.round(filteredStats.totalMinutes / (filteredStats.totalSessions || 1))}min
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Moyenne/session
                </Text>
              </View>
            </View>
            </View>
          )}

          {/* Répartition par catégorie */}
          {!loading && selectedCategory === 'all' && (
            <View style={[styles.categorySection, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Répartition par catégorie
              </Text>

              {filteredStats.categoryBreakdown.map(categoryData => (
                <View key={categoryData.category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {categoryData.category}
                    </Text>
                    <Text style={[styles.categoryTime, { color: colors.primary }]}>
                      {SupabaseWorkSessionService.formatDuration(categoryData.minutes)}
                    </Text>
                  </View>
                  <Text style={[styles.categoryMeta, { color: colors.textSecondary }]}>
                    {categoryData.sessions} session(s) •
                    {Math.round((categoryData.minutes / filteredStats.totalMinutes) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Sessions récentes */}
          {!loading && (
            <View style={[styles.sessionsSection, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Sessions récentes
              </Text>

              {recentSessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionItem, { borderColor: colors.border }]}
                  onPress={() => handleSessionSelect(session)}
                >
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionHeader}>
                      <Text style={[styles.sessionCategory, { color: colors.primary }]}>
                        {session.category}
                      </Text>
                      <View style={styles.sessionMeta}>
                        <Text style={[styles.sessionDuration, { color: colors.text }]}>
                          {SupabaseWorkSessionService.formatDuration(session.durationInMinutes)}
                        </Text>
                        <Text style={[styles.editIcon, { color: colors.textSecondary }]}>✏️</Text>
                      </View>
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                        {SupabaseWorkSessionService.formatDate(session.startTime)}
                      </Text>
                      <Text style={[styles.sessionCoach, { color: colors.textSecondary }]}>
                        {getUserDisplayName(session.userId)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {recentSessions.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucune session trouvée pour ces critères
                </Text>
              )}
            </View>
          )}
        </ScrollView>
        
        <SessionEditor
          visible={showSessionEditor}
          session={selectedSession}
          onClose={() => {
            setShowSessionEditor(false);
            setSelectedSession(null);
          }}
          onSave={handleSessionSave}
          onDelete={handleSessionDelete}
        />
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
  userButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    maxWidth: 80,
    minWidth: 60,
    alignItems: 'center',
  },
  userButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
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
  filtersSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterButtonText: {
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
  categorySection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryMeta: {
    fontSize: 14,
  },
  sessionsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  sessionItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionCategory: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 14,
    opacity: 0.7,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 14,
  },
  sessionCoach: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  loadingSection: {
    borderRadius: 12,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});