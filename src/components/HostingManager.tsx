import { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  ExternalLink,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { supabase, HostedSite } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function HostingManager() {
  const [sites, setSites] = useState<HostedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSiteModal, setShowNewSiteModal] = useState(false);
  const [newSite, setNewSite] = useState({
    siteName: '',
    subdomain: '',
    siteType: 'website' as 'website' | 'app',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSites();
    }
  }, [user]);

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('hosted_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('hosted_sites').insert({
        user_id: user.id,
        site_name: newSite.siteName,
        subdomain: newSite.subdomain.toLowerCase(),
        site_type: newSite.siteType,
        status: 'active',
      });

      if (error) throw error;
      await loadSites();
      setShowNewSiteModal(false);
      setNewSite({ siteName: '', subdomain: '', siteType: 'website' });
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Error creating site. The subdomain might already be taken.');
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const { error } = await supabase
        .from('hosted_sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;
      await loadSites();
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'suspended':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hosted Sites</h2>
          <p className="text-gray-600 mt-1">Manage your websites and applications</p>
        </div>
        <button
          onClick={() => setShowNewSiteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Site
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sites yet</h3>
          <p className="text-gray-500 mb-4">Create your first hosted site to get started</p>
          <button
            onClick={() => setShowNewSiteModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{site.site_name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{site.site_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(site.status)}
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Settings className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => deleteSite(site.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <a
                    href={`https://${site.subdomain}.ava-hosting.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {site.subdomain}.ava-hosting.com
                  </a>
                </div>

                {site.custom_domain && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <a
                      href={`https://${site.custom_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {site.custom_domain}
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Storage Used</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatBytes(site.storage_used)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bandwidth</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatBytes(site.bandwidth_used)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">
                    Status: <span className="font-medium capitalize">{site.status}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewSiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Site</h3>
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={newSite.siteName}
                  onChange={(e) => setNewSite({ ...newSite, siteName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Awesome Site"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSite.subdomain}
                    onChange={(e) => setNewSite({ ...newSite, subdomain: e.target.value.toLowerCase() })}
                    required
                    pattern="[a-z0-9-]+"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mysite"
                  />
                  <span className="text-sm text-gray-500">.ava-hosting.com</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use lowercase letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Type
                </label>
                <select
                  value={newSite.siteType}
                  onChange={(e) => setNewSite({ ...newSite, siteType: e.target.value as 'website' | 'app' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="website">Website</option>
                  <option value="app">Application</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewSiteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
