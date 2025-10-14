import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';
const isWeb = Platform.OS === 'web';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Définie' : 'Manquante');
}

// Database type definitions
export interface WorkSession {
  id: string;
  user_id: string;
  category: string;
  start_time: string;
  end_time: string;
  duration_in_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      work_sessions: {
        Row: WorkSession;
        Insert: Omit<WorkSession, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WorkSession, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
    };
  };
}

// Create Supabase client with conditional storage
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables d\'environnement Supabase manquantes');
  }

  // Configuration for different environments
  if (isWeb && isBrowser) {
    // Web browser - use localStorage
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } else if (!isWeb) {
    // Mobile - use AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } else {
    // SSR or no browser - minimal config
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
};

export const supabase = createSupabaseClient();