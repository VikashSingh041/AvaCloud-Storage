/*
  # Create User Preferences Table

  ## Purpose
  Stores user settings and preferences including notifications, privacy, display, and storage options.

  ## 1. New Tables
  
  - `user_preferences`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `theme` (text) - 'light' or 'dark'
    - `email_notifications` (boolean) - Enable/disable email notifications
    - `upload_notifications` (boolean) - Notify on file uploads
    - `sharing_notifications` (boolean) - Notify on file shares
    - `auto_sync` (boolean) - Enable automatic sync
    - `two_factor_enabled` (boolean) - Two-factor authentication status
    - `language` (text) - User preferred language
    - `file_retention_days` (integer) - Days to keep deleted files
    - `public_profile` (boolean) - Make profile publicly visible
    - `analytics_tracking` (boolean) - Allow analytics tracking
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  ## 2. Security
  
  - Enable RLS on `user_preferences` table
  - Add policy for users to read/update their own preferences
  
  ## 3. Indexes
  
  - Index on `user_id` for faster lookups
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  email_notifications boolean DEFAULT true,
  upload_notifications boolean DEFAULT true,
  sharing_notifications boolean DEFAULT true,
  auto_sync boolean DEFAULT false,
  two_factor_enabled boolean DEFAULT false,
  language text DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'ja', 'zh')),
  file_retention_days integer DEFAULT 30 CHECK (file_retention_days >= 0 AND file_retention_days <= 365),
  public_profile boolean DEFAULT false,
  analytics_tracking boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
