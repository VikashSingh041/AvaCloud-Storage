import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Star,
  FolderPlus,
  Search,
  Grid,
  List,
  MoreVertical,
  AlertCircle,
  Folder,
  ChevronRight,
  X
} from 'lucide-react';
import { supabase, FileRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, downloadFile, deleteFile as deleteFileFromStorage } from '../lib/storage';

interface FolderItem {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export function FileStorage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentFolderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadFolders(), loadFiles()]);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadFiles = async () => {
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('is_deleted', false);

      if (currentFolderId) {
        query = query.eq('folder_id', currentFolderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    setCreatingFolder(true);
    setError(null);

    try {
      const { error } = await supabase.from('folders').insert({
        user_id: user?.id,
        name: newFolderName,
      });

      if (error) throw error;
      setNewFolderName('');
      setShowNewFolderDialog(false);
      await loadFolders();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMsg);
      console.error('Error creating folder:', err);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder and all its contents?')) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      await loadFolders();
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete folder';
      setError(errorMsg);
      console.error('Error deleting folder:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);

    try {
      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document';

      const { path, url } = await uploadFile(file, user.id, 'files');

      const { error } = await supabase.from('files').insert({
        user_id: user.id,
        name: file.name,
        file_type: fileType,
        mime_type: file.type,
        size: file.size,
        storage_path: path,
        thumbnail_url: url,
        folder_id: currentFolderId,
      });

      if (error) throw error;
      await loadFiles();
      event.target.value = '';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload file';
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
      await loadFiles();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      await deleteFileFromStorage(storagePath, 'files');

      const { error } = await supabase
        .from('files')
        .update({ is_deleted: true })
        .eq('id', fileId);

      if (error) throw error;
      await loadFiles();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete file';
      setError(errorMsg);
      console.error('Error deleting file:', error);
    }
  };

  const handleDownloadFile = async (file: FileRecord) => {
    try {
      await downloadFile(file.storage_path, file.name, 'files');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download file';
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

  const getFileIcon = (fileType: string) => {
    return <FileText className="w-6 h-6" />;
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files & folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowNewFolderDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="hidden sm:inline">New Folder</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50">
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
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

      {currentFolderId && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Root
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>{folders.find(f => f.id === currentFolderId)?.name}</span>
        </div>
      )}

      {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files or folders yet</h3>
          <p className="text-gray-500 mb-4">Create a folder or upload your first file to get started</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowNewFolderDialog(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
              New Folder
            </button>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              Upload File
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Folder className="w-6 h-6" />
                </div>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <button
                onClick={() => setCurrentFolderId(folder.id)}
                className="text-left flex-1"
              >
                <h3 className="font-medium text-gray-900 truncate hover:text-blue-600">{folder.name}</h3>
              </button>
            </div>
          ))}

          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleStar(file.id, file.is_starred)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        file.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-gray-900 truncate mb-1">{file.name}</h3>
              <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleDownloadFile(file)}
                  disabled={uploading}
                  className="flex-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Download
                </button>
                <button
                  onClick={() => handleDeleteFile(file.id, file.storage_path)}
                  disabled={uploading}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFolders.map((folder) => (
                <tr key={folder.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 mr-3">
                        <Folder className="w-4 h-4" />
                      </div>
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {folder.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Folder</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 mr-3">
                        {getFileIcon(file.file_type)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {file.file_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStar(file.id, file.is_starred)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            file.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        disabled={uploading}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.storage_path)}
                        disabled={uploading}
                        className="p-1 hover:bg-red-50 rounded text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creatingFolder ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowNewFolderDialog(false);
                  setNewFolderName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
