import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

export default function DebugInfo() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Informations de débogage
        </Text>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            EXPO_PUBLIC_SUPABASE_URL:
          </Text>
          <Text style={[styles.value, { color: supabaseUrl ? colors.success : colors.error }]}>
            {supabaseUrl || '❌ Non définie'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            EXPO_PUBLIC_SUPABASE_ANON_KEY:
          </Text>
          <Text style={[styles.value, { color: supabaseAnonKey ? colors.success : colors.error }]}>
            {supabaseAnonKey ? `✅ Définie (${supabaseAnonKey.substring(0, 20)}...)` : '❌ Non définie'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Status:
          </Text>
          <Text style={[styles.value, { color: supabaseUrl && supabaseAnonKey ? colors.success : colors.error }]}>
            {supabaseUrl && supabaseAnonKey ? '✅ Configuration OK' : '❌ Configuration manquante'}
          </Text>
        </View>

        {!supabaseUrl || !supabaseAnonKey ? (
          <View style={[styles.warning, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.warningText, { color: colors.error }]}>
              ⚠️ Les variables d'environnement ne sont pas chargées.
              {'\n\n'}
              Solutions:
              {'\n'}
              1. Vérifiez que le fichier .env existe
              {'\n'}
              2. Redémarrez le serveur Expo avec: npx expo start -c
              {'\n'}
              3. Assurez-vous que les variables commencent par EXPO_PUBLIC_
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  warning: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
