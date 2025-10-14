/**
 * Script de test pour vérifier la connexion Supabase et la structure de la base de données
 *
 * Pour exécuter ce script:
 * npx tsx scripts/test-supabase-connection.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement depuis .env
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔍 Test de connexion Supabase\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');
console.log('\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('📊 Test 1: Récupération des catégories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (catError) {
      console.error('❌ Erreur lors de la récupération des catégories:', catError);
    } else {
      console.log('✅ Catégories récupérées:', categories?.length || 0);
      console.log('   Données:', categories);
    }
    console.log('\n');

    console.log('📊 Test 2: Récupération des sessions de travail...');
    const { data: sessions, error: sessError } = await supabase
      .from('work_sessions')
      .select('*')
      .limit(5);

    if (sessError) {
      console.error('❌ Erreur lors de la récupération des sessions:', sessError);
    } else {
      console.log('✅ Sessions récupérées:', sessions?.length || 0);
      console.log('   Données:', sessions);
    }
    console.log('\n');

    console.log('📊 Test 3: Création d\'une session de test...');
    const testSession = {
      user_id: 'test-user-001',
      category: 'Test',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(), // +1 heure
      duration_in_minutes: 60,
    };

    console.log('   Données à insérer:', testSession);

    const { data: newSession, error: createError } = await supabase
      .from('work_sessions')
      .insert([testSession])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur lors de la création:', createError);
      console.error('   Code:', createError.code);
      console.error('   Message:', createError.message);
      console.error('   Détails:', createError.details);
    } else {
      console.log('✅ Session créée avec succès!');
      console.log('   Données:', newSession);

      // Nettoyage: supprimer la session de test
      if (newSession?.id) {
        const { error: deleteError } = await supabase
          .from('work_sessions')
          .delete()
          .eq('id', newSession.id);

        if (deleteError) {
          console.warn('⚠️ Impossible de supprimer la session de test:', deleteError.message);
        } else {
          console.log('🧹 Session de test supprimée');
        }
      }
    }
    console.log('\n');

    console.log('✅ Tests terminés!');
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testConnection();
