/*
  # Create Storage Buckets

  This migration creates the necessary Supabase Storage buckets for file uploads.

  ## 1. Storage Buckets
  
  - `files` - For document and file storage
  - `media` - For photos and videos
  
  Both buckets are configured for authenticated users with proper security policies.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users can download their own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'files' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'files' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users can upload their own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users can download their own media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = (select auth.uid())::text);
