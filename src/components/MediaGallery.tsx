import { useState, useEffect } from 'react';
import { Image as ImageIcon, Film, Upload, Download, Trash2, Star, ZoomIn, AlertCircle } from 'lucide-react';
import { supabase, FileRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, downloadFile, deleteFile as deleteFileFromStorage, getFileUrl } from '../lib/storage';

interface MediaGalleryProps {
  type: 'image' | 'video';
}

export function MediaGallery({ type }: MediaGalleryProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMedia();
    }
  }, [user, type]);

  useEffect(() => {
    loadMediaUrls();
  }, [files]);

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('file_type', type)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMediaUrls = async () => {
    const urls: Record<string, string> = {};
    for (const file of files) {
      try {
        const url = await getFileUrl(file.storage_path, 'media');
        urls[file.id] = url;
      } catch (error) {
        console.error('Error getting URL for file:', error);
      }
    }
    setMediaUrls(urls);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const isValidType = type === 'image'
      ? file.type.startsWith('image/')
      : file.type.startsWith('video/');

    if (!isValidType) {
      setError(`Please select a valid ${type} file`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { path, url } = await uploadFile(file, user.id, 'media');

      const { error } = await supabase.from('files').insert({
        user_id: user.id,
        name: file.name,
        file_type: type,
        mime_type: file.type,
        size: file.size,
        storage_path: path,
        thumbnail_url: url,
      });

      if (error) throw error;
      await loadMedia();
      event.target.value = '';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload media';
      setError(errorMsg);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const toggleStar = async (fileId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ is_starred: !currentState })
        .eq('id', fileId);

      if (error) throw error;
      await loadMedia();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      await deleteFileFromStorage(storagePath, 'media');

      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true })
        .eq('id', fileId);

      if (error) throw error;
      await loadMedia();
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete media';
      setError(errorMsg);
      console.error('Error deleting file:', error);
    }
  };

  const handleDownloadFile = async (file: FileRecord) => {
    try {
      await downloadFile(file.storage_path, file.name, 'media');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download media';
      setError(errorMsg);
      console.error('Error downloading file:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const Icon = type === 'image' ? ImageIcon : Film;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">{type}s</h2>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50">
          <Upload className="w-5 h-5" />
          Upload {type}
          <input
            type="file"
            accept={type === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-12">
          <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {type}s yet</h3>
          <p className="text-gray-500 mb-4">Upload your first {type} to get started</p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload {type}
            <input
              type="file"
              accept={type === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                {type === 'image' && mediaUrls[file.id] ? (
                  <img
                    src={mediaUrls[file.id]}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : type === 'video' ? (
                  <div className="flex items-center justify-center w-full h-full bg-gray-200">
                    <Film className="w-16 h-16 text-gray-400" />
                  </div>
                ) : (
                  <Icon className="w-16 h-16 text-gray-300" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setSelectedFile(file)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => toggleStar(file.id, file.is_starred)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        file.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id, file.storage_path)}
                    className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 truncate text-sm">{file.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{formatBytes(file.size)}</p>
              </div>
              {file.is_starred && (
                <div className="absolute top-2 right-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatBytes(selectedFile.size)} • {new Date(selectedFile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                {type === 'image' && mediaUrls[selectedFile.id] ? (
                  <img
                    src={mediaUrls[selectedFile.id]}
                    alt={selectedFile.name}
                    className="w-full h-full object-contain"
                  />
                ) : type === 'video' ? (
                  <video
                    controls
                    src={mediaUrls[selectedFile.id]}
                    className="w-full h-full"
                  />
                ) : (
                  <Icon className="w-24 h-24 text-gray-300" />
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download
                </button>
                <button
                  onClick={() => {
                    handleDeleteFile(selectedFile.id, selectedFile.storage_path);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
