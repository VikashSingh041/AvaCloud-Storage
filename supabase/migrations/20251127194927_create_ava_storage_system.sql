/*
  # AVA Network Storage System Database Schema

  This migration creates the complete database structure for AVA, a comprehensive network storage platform.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text)
  - `avatar_url` (text)
  - `storage_used` (bigint, default 0) - in bytes
  - `storage_limit` (bigint, default 10737418240) - 10GB default limit
  - `plan_type` (text, default 'free') - free, basic, pro, enterprise
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `files`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, not null)
  - `name` (text, not null)
  - `file_type` (text, not null) - document, image, video, other
  - `mime_type` (text)
  - `size` (bigint, not null) - in bytes
  - `storage_path` (text, not null) - path in storage bucket
  - `folder_id` (uuid, references folders, nullable)
  - `is_public` (boolean, default false)
  - `is_starred` (boolean, default false)
  - `is_deleted` (boolean, default false)
  - `thumbnail_url` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `folders`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, not null)
  - `name` (text, not null)
  - `parent_id` (uuid, references folders, nullable)
  - `color` (text, default '#3B82F6')
  - `is_deleted` (boolean, default false)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `hosted_sites`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, not null)
  - `site_name` (text, not null)
  - `subdomain` (text, unique, not null)
  - `custom_domain` (text, unique)
  - `site_type` (text, not null) - website, app
  - `status` (text, default 'active') - active, inactive, suspended
  - `storage_used` (bigint, default 0)
  - `bandwidth_used` (bigint, default 0)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `storage_analytics`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, not null)
  - `date` (date, not null)
  - `files_uploaded` (integer, default 0)
  - `files_downloaded` (integer, default 0)
  - `bandwidth_used` (bigint, default 0)
  - `storage_added` (bigint, default 0)
  - `created_at` (timestamptz, default now())

  ## 2. Security

  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public file access when files are marked as public

  ## 3. Indexes

  - Index on user_id for faster queries
  - Index on file_type for filtering
  - Index on subdomain for site lookups
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  storage_used bigint DEFAULT 0,
  storage_limit bigint DEFAULT 10737418240,
  plan_type text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  color text DEFAULT '#3B82F6',
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  file_type text NOT NULL,
  mime_type text,
  size bigint NOT NULL,
  storage_path text NOT NULL,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  is_public boolean DEFAULT false,
  is_starred boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hosted_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  site_name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  site_type text NOT NULL,
  status text DEFAULT 'active',
  storage_used bigint DEFAULT 0,
  bandwidth_used bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  files_uploaded integer DEFAULT 0,
  files_downloaded integer DEFAULT 0,
  bandwidth_used bigint DEFAULT 0,
  storage_added bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosted_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public files"
  ON files FOR SELECT
  TO anon
  USING (is_public = true AND is_deleted = false);

CREATE POLICY "Users can create own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hosted sites"
  ON hosted_sites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own hosted sites"
  ON hosted_sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hosted sites"
  ON hosted_sites FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hosted sites"
  ON hosted_sites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics"
  ON storage_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON storage_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_hosted_sites_user_id ON hosted_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_hosted_sites_subdomain ON hosted_sites(subdomain);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON storage_analytics(user_id, date);
