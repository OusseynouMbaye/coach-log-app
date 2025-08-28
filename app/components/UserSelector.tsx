import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { WorkSessionService } from '../services/workSessionService';

interface UserSelectorProps {
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  showAllOption?: boolean;
}

export default function UserSelector({ 
  selectedUserId, 
  onSelectUser, 
  showAllOption = false 
}: UserSelectorProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const userIds = WorkSessionService.getAllUserIds();
  const allOptions = showAllOption ? ['all', ...userIds] : userIds;
  
  const getUserDisplayName = (userId: string) => {
    if (userId === 'all') return 'Tous les coaches';
    
    // Capitalise le nom du coach et remplace 'coach' par 'Coach'
    return userId.replace(/^coach/, 'Coach ');
  };

  const getUserStats = (userId: string) => {
    if (userId === 'all') {
      const allSessions = WorkSessionService.getAllSessions();
      const totalMinutes = allSessions.reduce((total, session) => total + session.durationInMinutes, 0);
      return {
        totalSessions: allSessions.length,
        totalHours: Math.round((totalMinutes / 60) * 100) / 100
      };
    }
    
    const stats = WorkSessionService.getTimeStatsByUserId(userId);
    return {
      totalSessions: stats.totalSessions,
      totalHours: stats.totalHours
    };
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        Sélectionner un coach
      </Text>
      
      <ScrollView 
        horizontal={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {allOptions.map(userId => {
          const stats = getUserStats(userId);
          const isSelected = selectedUserId === userId;
          
          return (
            <TouchableOpacity
              key={userId}
              style={[
                styles.userCard,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.cardBackground,
                  borderColor: isSelected ? colors.primary : colors.border,
                  shadowColor: colors.shadow
                }
              ]}
              onPress={() => onSelectUser(userId)}
            >
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={[
                    styles.userName,
                    { color: isSelected ? '#fff' : colors.text }
                  ]}>
                    {getUserDisplayName(userId)}
                  </Text>
                  
                  <View style={styles.statsRow}>
                    <Text style={[
                      styles.statText,
                      { color: isSelected ? '#fff' : colors.textSecondary }
                    ]}>
                      {stats.totalSessions} session{stats.totalSessions > 1 ? 's' : ''}
                    </Text>
                    <Text style={[
                      styles.statDot,
                      { color: isSelected ? '#fff' : colors.textSecondary }
                    ]}>
                      •
                    </Text>
                    <Text style={[
                      styles.statText,
                      { color: isSelected ? '#fff' : colors.textSecondary }
                    ]}>
                      {stats.totalHours}h
                    </Text>
                  </View>
                </View>
                
                {isSelected && (
                  <View style={styles.selectedIcon}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  userCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statDot: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});