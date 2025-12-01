import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  storage_used: number;
  storage_limit: number;
  plan_type: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  file_type: string;
  mime_type: string | null;
  size: number;
  storage_path: string;
  folder_id: string | null;
  is_public: boolean;
  is_starred: boolean;
  is_deleted: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostedSite {
  id: string;
  user_id: string;
  site_name: string;
  subdomain: string;
  custom_domain: string | null;
  site_type: string;
  status: string;
  storage_used: number;
  bandwidth_used: number;
  created_at: string;
  updated_at: string;
}
