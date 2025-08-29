# 🗄️ Supabase Setup Guide - Coach Log App

## 📋 Étape 1 : Créer un compte Supabase

1. **Aller sur** [https://supabase.com](https://supabase.com)
2. **Créer un compte** (gratuit)
3. **Créer un nouveau projet** :
   - Nom : `coach-log-app`
   - Organisation : Votre nom/organisation
   - Région : Europe West (Ireland) - `eu-west-1`
   - Mot de passe DB : Choisir un mot de passe fort

## 📋 Étape 2 : Configuration du projet

### 🔧 Variables d'environnement
1. Dans votre dashboard Supabase, aller dans **Settings → API**
2. Copier ces valeurs :
   - **Project URL** (commence par `https://xxx.supabase.co`)
   - **Anon public key** (clé publique)

3. Créer le fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

4. Modifier le fichier `.env` avec vos valeurs :
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_ici
```

## 📋 Étape 3 : Créer le schéma de base de données

### 🏗️ SQL à exécuter dans l'éditeur SQL Supabase

```sql
-- Enable RLS (Row Level Security)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_sessions table
CREATE TABLE public.work_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_in_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_work_sessions_user_id ON public.work_sessions(user_id);
CREATE INDEX idx_work_sessions_category ON public.work_sessions(category);
CREATE INDEX idx_work_sessions_start_time ON public.work_sessions(start_time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for work_sessions
CREATE TRIGGER update_work_sessions_updated_at 
    BEFORE UPDATE ON public.work_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name) VALUES 
  ('Entraînement individuel'),
  ('Entraînement collectif'),
  ('Préparation'),
  ('Compétition'),
  ('Formation'),
  ('Administratif');

-- Enable Row Level Security (RLS)
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies (pour l'instant, accès libre pour développement)
-- En production, vous pouvez ajouter une authentification plus stricte
CREATE POLICY "Allow all operations on work_sessions" ON public.work_sessions
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on categories" ON public.categories
    FOR ALL USING (true);
```

## 📋 Étape 4 : Migrer les données existantes

### 🔄 Script de migration
Une fois votre base configurée, exécutez ce script dans l'éditeur SQL pour importer vos données actuelles :

```sql
-- Insérer les données de test (vous devrez adapter selon votre fichier coach-log.json)
INSERT INTO public.work_sessions (user_id, category, start_time, end_time, duration_in_minutes) VALUES 
  ('coach1', 'Entraînement individuel', '2024-01-15 09:00:00+00', '2024-01-15 10:30:00+00', 90),
  ('coach1', 'Préparation', '2024-01-15 14:00:00+00', '2024-01-15 15:00:00+00', 60),
  ('coach2', 'Entraînement collectif', '2024-01-16 10:00:00+00', '2024-01-16 12:00:00+00', 120);

-- Vérifier l'insertion
SELECT * FROM public.work_sessions ORDER BY start_time DESC;
SELECT * FROM public.categories ORDER BY name;
```

## 📋 Étape 5 : Tester la connexion

### 🧪 Test de base
1. Démarrer votre app Expo : `npm start`
2. Ouvrir dans un simulateur/émulateur
3. Les données devraient maintenant venir de Supabase !

### 🔍 Debug
Si problème de connexion :
1. Vérifier les variables d'environnement dans `.env`
2. Vérifier la console pour les erreurs
3. Tester la connexion dans l'onglet réseau du navigateur

## 📋 Étape 6 : Fonctionnalités Supabase avancées

### 🔐 Authentication (optionnel pour plus tard)
```sql
-- Activer l'authentification par email
-- Aller dans Authentication → Settings dans le dashboard Supabase
-- Activer "Enable email confirmations" si désiré
```

### 📊 Real-time (optionnel)
```javascript
// Écouter les changements en temps réel
const subscription = supabase
  .channel('work_sessions_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'work_sessions'
  }, (payload) => {
    console.log('Change received!', payload);
    // Rafraîchir vos données locales
  })
  .subscribe();
```

## 🚀 Next Steps

Une fois Supabase configuré :
1. ✅ Tester toutes les fonctionnalités (CRUD)
2. ✅ Migrer vers `SupabaseWorkSessionService`
3. ✅ Ajouter gestion d'erreurs robuste
4. ✅ Implémenter l'authentification (optionnel)
5. ✅ Configurer le real-time (optionnel)

---

**📞 Support :**
- [Documentation Supabase](https://supabase.com/docs)
- [Supabase + React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

**🔧 Fichiers créés :**
- `.env.example` - Template variables d'environnement
- `.env` - Vos variables (à créer)
- `lib/supabase.ts` - Configuration client Supabase
- `app/services/supabaseService.ts` - Service layer pour l'app