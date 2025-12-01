import { supabase } from './supabase';

export async function uploadFile(
  file: File,
  userId: string,
  fileType: 'files' | 'media'
): Promise<{ path: string; url: string }> {
  const bucket = fileType === 'files' ? 'files' : 'media';
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${userId}/${fileName}`;

  const { error, data } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
  };
}

export async function getFileUrl(
  filePath: string,
  fileType: 'files' | 'media'
): Promise<string> {
  const bucket = fileType === 'files' ? 'files' : 'media';

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function downloadFile(
  filePath: string,
  fileName: string,
  fileType: 'files' | 'media'
): Promise<void> {
  const bucket = fileType === 'files' ? 'files' : 'media';

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath);

  if (error) throw error;

  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function deleteFile(
  filePath: string,
  fileType: 'files' | 'media'
): Promise<void> {
  const bucket = fileType === 'files' ? 'files' : 'media';

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) throw error;
}
