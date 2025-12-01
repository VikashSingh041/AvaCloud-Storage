/*
  # Fix RLS Performance and Security Issues

  ## 1. RLS Policy Optimization
  
  Replace direct auth.uid() calls with (select auth.uid()) to avoid re-evaluating
  for each row. This significantly improves query performance at scale.
  
  ## 2. Unused Index Removal
  
  Remove indexes that are not being utilized:
  - idx_files_folder
  - idx_folders_user_id
  - idx_folders_parent
  - idx_hosted_sites_subdomain
  
  These reduce overhead and are not required for current access patterns.

  ## 3. Security Enhancements
  
  All RLS policies now use optimized auth function calls for better performance
  while maintaining security.
*/

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can create own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own files" ON files;
DROP POLICY IF EXISTS "Users can create own files" ON files;
DROP POLICY IF EXISTS "Users can update own files" ON files;
DROP POLICY IF EXISTS "Users can delete own files" ON files;

CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own hosted sites" ON hosted_sites;
DROP POLICY IF EXISTS "Users can create own hosted sites" ON hosted_sites;
DROP POLICY IF EXISTS "Users can update own hosted sites" ON hosted_sites;
DROP POLICY IF EXISTS "Users can delete own hosted sites" ON hosted_sites;

CREATE POLICY "Users can view own hosted sites"
  ON hosted_sites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own hosted sites"
  ON hosted_sites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own hosted sites"
  ON hosted_sites FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own hosted sites"
  ON hosted_sites FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own analytics" ON storage_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON storage_analytics;

CREATE POLICY "Users can view own analytics"
  ON storage_analytics FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own analytics"
  ON storage_analytics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP INDEX IF EXISTS idx_files_folder;
DROP INDEX IF EXISTS idx_folders_user_id;
DROP INDEX IF EXISTS idx_folders_parent;
DROP INDEX IF EXISTS idx_hosted_sites_subdomain;
