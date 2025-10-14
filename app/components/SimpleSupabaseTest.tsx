import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

export default function SimpleSupabaseTest() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Scroll vers le haut quand le composant se monte
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const testBasicConnection = async () => {
    setLoading(true);
    setResult('');

    // Scroll vers le haut pour voir le début du test
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    try {
      // Test très simple - vérifier les variables d'environnement
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      console.log('🔍 Testing environment variables...');
      console.log('URL:', supabaseUrl);
      console.log('Key:', supabaseKey ? 'Present' : 'Missing');

      if (!supabaseUrl || !supabaseKey) {
        setResult("❌ Variables d'environnement manquantes!\n\nVérifiez votre fichier .env");
        Alert.alert('Erreur', "Variables d'environnement Supabase manquantes");
        return;
      }

      setResult(`✅ Variables d'environnement OK!\n\nURL: ${supabaseUrl}\nKey: ${supabaseKey.substring(0, 20)}...`);

      // Test Supabase client
      console.log('🔍 Testing Supabase client...');
      if (!supabase) {
        throw new Error('Client Supabase non disponible');
      }
      console.log('✅ Supabase client available');

      setResult((prev) => prev + '\n\n🔄 Test de connexion...');

      // Test 1: Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('name');

      if (categoriesError) {
        console.error('❌ Categories query error:', categoriesError);
        setResult((prev) => prev + '\n\n❌ Erreur catégories:\n' + categoriesError.message);
        Alert.alert('Erreur catégories', categoriesError.message);
        return;
      }

      console.log('✅ Categories fetched:', categoriesData);
      setResult((prev) => prev + `\n\n✅ ${categoriesData?.length || 0} catégories trouvées`);

      // Test 2: Récupérer quelques sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('work_sessions')
        .select('user_id, category, duration_in_minutes')
        .limit(3);

      if (sessionsError) {
        console.error('❌ Sessions query error:', sessionsError);
        setResult((prev) => prev + '\n\n❌ Erreur sessions:\n' + sessionsError.message);
        Alert.alert('Erreur sessions', sessionsError.message);
        return;
      }

      console.log('✅ Sessions fetched:', sessionsData);
      setResult((prev) => prev + `\n\n✅ ${sessionsData?.length || 0} sessions trouvées`);

      // Afficher un aperçu des données
      if (sessionsData && sessionsData.length > 0) {
        const preview = sessionsData
          .map((s: any) => `• ${s.user_id}: ${s.category} (${s.duration_in_minutes}min)`)
          .join('\n');
        setResult((prev) => prev + `\n\n📊 Aperçu des sessions:\n${preview}`);
      }

      Alert.alert(
        'Succès',
        `Connexion réussie !\n${categoriesData?.length} catégories\n${sessionsData?.length} sessions`
      );
    } catch (err) {
      console.error('❌ Test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setResult(`❌ Erreur: ${errorMessage}`);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.title, { color: colors.text }]}>🧪 Test Simple Supabase</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={testBasicConnection}
            disabled={loading}>
            {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>🔍 Tester Connexion</Text>}
          </TouchableOpacity>

          {result ? (
            <View style={[styles.resultContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.resultText, { color: colors.text }]}>{result}</Text>
            </View>
          ) : null}

          <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>📋 Debug Info:</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Node Env: {process.env.NODE_ENV || 'undefined'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Supabase URL: {process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Définie' : 'Manquante'}
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • Supabase Key: {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Manquante'}
            </Text>
          </View>
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  infoContainer: {
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
