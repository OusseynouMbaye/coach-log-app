import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

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

// Create Supabase client with custom storage for React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});