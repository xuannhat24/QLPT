import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface Listing {
  id: string;
  title: string;
  price: number;
  area?: number;
  type?: string;
  location?: string;
  street?: string;
  description?: string;
  image_url?: string;
  images?: string[];
  amenities?: string[];
  is_active: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  owner_id?: string;
}

export interface UserPreference {
  id?: string;
  user_id?: string;
  session_id: string;
  location?: string;
  street?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  amenities?: string[];
  room_type?: string;
  is_active?: boolean;
  notified_ids?: string[];
  created_at?: string;
}
