import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { WorkSessionService } from '../services/workSessionService';
import UserSelector from './UserSelector';

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
  
  const userIds = WorkSessionService.getAllUserIds();
  const categories = ['all', ...WorkSessionService.getAllCategories()];
  
  const filteredStats = useMemo(() => {
    if (selectedUserId === 'all') {
      // Stats pour tous les coaches
      const allSessions = WorkSessionService.getAllSessions();
      let sessions = allSessions;
      
      if (selectedCategory !== 'all') {
        sessions = allSessions.filter(s => s.category === selectedCategory);
      }
      
      const totalMinutes = sessions.reduce((total, session) => total + session.durationInMinutes, 0);
      
      // Calcul par catégorie pour tous les coaches
      const categoryBreakdown = WorkSessionService.getAllCategories().map(category => {
        const categorySessions = allSessions.filter(s => s.category === category);
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
        totalSessions: sessions.length,
        categoryBreakdown: selectedCategory === 'all' ? categoryBreakdown : categoryBreakdown.filter(cat => cat.category === selectedCategory)
      };
    } else {
      // Stats pour un coach spécifique
      const stats = WorkSessionService.getTimeStatsByUserId(selectedUserId);
      
      if (selectedCategory === 'all') {
        return stats;
      }
      
      const categoryTime = WorkSessionService.getTotalTimeByCategory(selectedUserId, selectedCategory);
      const categorySessions = WorkSessionService.getSessionsByUserId(selectedUserId)
        .filter(s => s.category === selectedCategory);
      
      return {
        totalMinutes: categoryTime,
        totalHours: Math.round((categoryTime / 60) * 100) / 100,
        totalSessions: categorySessions.length,
        categoryBreakdown: stats.categoryBreakdown.filter(cat => cat.category === selectedCategory)
      };
    }
  }, [selectedUserId, selectedCategory]);
  
  const recentSessions = useMemo(() => {
    let sessions;
    
    if (selectedUserId === 'all') {
      sessions = WorkSessionService.getAllSessions();
    } else {
      sessions = WorkSessionService.getSessionsByUserId(selectedUserId);
    }
    
    if (selectedCategory !== 'all') {
      sessions = sessions.filter(s => s.category === selectedCategory);
    }
    
    return sessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10);
  }, [selectedUserId, selectedCategory]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserSelector(false);
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === 'all') return 'Tous les coaches';
    return userId.replace(/^coach/, 'Coach ');
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
              {WorkSessionService.getAllCategories().map(category => (
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

          {/* Statistiques globales */}
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

          {/* Répartition par catégorie */}
          {selectedCategory === 'all' && (
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
                      {WorkSessionService.formatDuration(categoryData.minutes)}
                    </Text>
                  </View>
                  <View style={styles.categoryMeta}>
                    <Text style={[styles.categoryMeta, { color: colors.textSecondary }]}>
                      {categoryData.sessions} session(s) • 
                      {Math.round((categoryData.minutes / filteredStats.totalMinutes) * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Sessions récentes */}
          <View style={[styles.sessionsSection, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Sessions récentes
            </Text>
            
            {recentSessions.map(session => (
              <View key={session.id} style={[styles.sessionItem, { borderColor: colors.border }]}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionCategory, { color: colors.primary }]}>
                    {session.category}
                  </Text>
                  <Text style={[styles.sessionDuration, { color: colors.text }]}>
                    {WorkSessionService.formatDuration(session.durationInMinutes)}
                  </Text>
                </View>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                  {WorkSessionService.formatDate(session.startTime)}
                </Text>
              </View>
            ))}
            
            {recentSessions.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune session trouvée pour ces critères
              </Text>
            )}
          </View>
        </ScrollView>
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
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  userButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionCategory: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});