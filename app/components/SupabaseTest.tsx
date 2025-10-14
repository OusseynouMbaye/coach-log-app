import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { SupabaseWorkSessionService } from '../services/supabaseService';

export default function SupabaseTest() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sessions, setSessions] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Testing Supabase connection...');

      // Test 1: Récupérer les catégories
      const categoriesData = await SupabaseWorkSessionService.getAllCategories();
      console.log('📂 Categories:', categoriesData);
      setCategories(categoriesData);

      // Test 2: Récupérer toutes les sessions
      const sessionsData = await SupabaseWorkSessionService.getAllSessions();
      console.log('📊 Sessions:', sessionsData);
      setSessions(sessionsData.slice(0, 5)); // Afficher seulement les 5 premières

      // Test 3: Récupérer les user IDs
      const userIds = await SupabaseWorkSessionService.getAllUserIds();
      console.log('👥 User IDs:', userIds);

      // Test 4: Stats pour coach1
      const stats = await SupabaseWorkSessionService.getTimeStatsByUserId('coach1');
      console.log('📈 Stats coach1:', stats);

      setConnectionStatus('success');
      console.log('✅ Supabase connection successful!');
    } catch (err) {
      console.error('❌ Supabase connection failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const testCreateSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const newSession = await SupabaseWorkSessionService.createSession({
        userId: 'coach1',
        category: 'Entraînement individuel',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 heure
        durationInMinutes: 60,
      });

      console.log('✅ Session créée:', newSession);

      // Refresh data
      await testConnection();
    } catch (err) {
      console.error('❌ Erreur création session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.title, { color: colors.text }]}>🗄️ Test Connexion Supabase</Text>

          {/* Status */}
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: colors.text }]}>Status:</Text>
            <Text
              style={[
                styles.statusValue,
                {
                  color:
                    connectionStatus === 'success'
                      ? colors.success
                      : connectionStatus === 'error'
                      ? colors.error
                      : colors.textSecondary,
                },
              ]}>
              {connectionStatus === 'success'
                ? '✅ Connecté'
                : connectionStatus === 'error'
                ? '❌ Erreur'
                : '⏳ Non testé'}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={testConnection}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.buttonText}>🔍 Tester Connexion</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.success }]}
              onPress={testCreateSession}
              disabled={loading}>
              <Text style={styles.buttonText}>➕ Créer Session Test</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>❌ Erreur: {error}</Text>
            </View>
          )}

          {/* Results */}
          {connectionStatus === 'success' && (
            <View style={styles.resultsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📂 Catégories ({categories.length})</Text>
              <Text style={[styles.resultText, { color: colors.textSecondary }]}>{categories.join(', ')}</Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📊 Sessions récentes ({sessions.length})
              </Text>
              {sessions.map((session, index) => (
                <View
                  key={session.id}
                  style={[styles.sessionItem, { borderColor: colors.border }]}>
                  <Text style={[styles.sessionText, { color: colors.text }]}>
                    {session.userId} - {session.category}
                  </Text>
                  <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
                    {session.durationInMinutes}min - {new Date(session.startTime).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 12,
  },
  sessionItem: {
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 4,
  },
});
