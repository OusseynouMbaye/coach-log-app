import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useTheme } from './context/ThemeContext';
import { Colors } from './constants/Colors';
import WorkTimeDisplay from './components/WorkTimeDisplay';
import CategoryManager from './components/CategoryManager';
import SimpleSupabaseTest from './components/SimpleSupabaseTest';
import WorkTimeEntry from './components/WorkTimeEntry';
import DebugInfo from './components/DebugInfo';

export default function Index() {
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = Colors[theme];
  const [showWorkTime, setShowWorkTime] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSupabaseTest, setShowSupabaseTest] = useState(false);
  const [showWorkTimeEntry, setShowWorkTimeEntry] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header avec titre de bienvenue */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.welcomeTitle, { color: colors.headerText }]}>Bienvenue</Text>
        <Text style={[styles.subtitle, { color: colors.headerText + 'E6' }]}>Équipe d&apos;entraîneurs du club</Text>
        
        {/* Bouton de switch de thème */}
        <View style={styles.themeSwitchContainer}>
          <Text style={[styles.themeLabel, { color: colors.headerText }]}>
            {isDark ? '🌙' : '☀️'} Thème {isDark ? 'sombre' : 'clair'}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDark ? '#0A84FF' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>

      {/* Section d'accueil principale */}
      <View style={styles.mainSection}>
        <View style={[styles.welcomeCard, { 
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow,
        }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>👋 Salut l&apos;équipe !</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Nous sommes ravis de vous accueillir dans votre espace personnel. 
            Ici, vous pouvez gérer vos sessions d&apos;entraînement, suivre vos athlètes 
            et accéder à toutes les ressources nécessaires.
          </Text>
        </View>
      </View>

      {/* Section des actions rapides */}
      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions rapides</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
            }]}
            onPress={() => setShowWorkTimeEntry(true)}
          >
            <Text style={styles.actionIcon}>⏱️</Text>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Entrer mon temps</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Ajouter une session</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { 
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          }]}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Mes athlètes</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Gérer l&apos;équipe</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { 
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
            }]}
            onPress={() => setShowWorkTime(true)}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Temps de travail</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Voir les statistiques</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { 
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
            }]}
            onPress={() => setShowCategoryManager(true)}
          >
            <Text style={styles.actionIcon}>🗂️</Text>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Catégories</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Gérer et supprimer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
            }]}
            onPress={() => setShowSupabaseTest(true)}
          >
            <Text style={styles.actionIcon}>🗄️</Text>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Test Supabase</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Vérifier connexion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
            }]}
            onPress={() => setShowDebugInfo(true)}
          >
            <Text style={styles.actionIcon}>🐛</Text>
            <Text style={[styles.actionTitle, { color: colors.text }]}>Debug Info</Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Variables d'env</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section d'informations */}
      <View style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations importantes</Text>
        
        <View style={[styles.infoCard, { 
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow,
        }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>📅 Prochain événement</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Championnat régional - Samedi 15 janvier 2025
          </Text>
        </View>

        <View style={[styles.infoCard, { 
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow,
        }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>🎯 Objectifs du mois</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Améliorer la technique de 15% des athlètes
          </Text>
        </View>
      </View>

      <WorkTimeDisplay 
        visible={showWorkTime} 
        onClose={() => setShowWorkTime(false)} 
      />
      
      <CategoryManager 
        visible={showCategoryManager} 
        onClose={() => setShowCategoryManager(false)} 
      />

      {showSupabaseTest && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowSupabaseTest(false)}
                style={[styles.closeButton, { backgroundColor: colors.error }]}
              >
                <Text style={styles.closeButtonText}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <SimpleSupabaseTest />
            </View>
          </View>
        </View>
      )}

      {showWorkTimeEntry && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowWorkTimeEntry(false)}
                style={[styles.closeButton, { backgroundColor: colors.error }]}
              >
                <Text style={styles.closeButtonText}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <WorkTimeEntry
                userId="coach-temp-001"
                onSessionCreated={() => setShowWorkTimeEntry(false)}
              />
            </View>
          </View>
        </View>
      )}

      {showDebugInfo && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowDebugInfo(false)}
                style={[styles.closeButton, { backgroundColor: colors.error }]}
              >
                <Text style={styles.closeButtonText}>✕ Fermer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <DebugInfo />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  themeSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 200,
    paddingHorizontal: 10,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  mainSection: {
    padding: 20,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
  },
});
