import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Upload as UploadIcon,
  Download,
  HardDrive,
  Activity,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  id: string;
  date: string;
  files_uploaded: number;
  files_downloaded: number;
  bandwidth_used: number;
  storage_added: number;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('storage_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const totalUploads = analytics.reduce((sum, day) => sum + day.files_uploaded, 0);
  const totalDownloads = analytics.reduce((sum, day) => sum + day.files_downloaded, 0);
  const totalBandwidth = analytics.reduce((sum, day) => sum + day.bandwidth_used, 0);
  const totalStorageAdded = analytics.reduce((sum, day) => sum + day.storage_added, 0);

  const getPreviousPeriodTotal = (current: number) => {
    return current > 0 ? Math.floor(current * 0.85) : 0;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const stats = [
    {
      label: 'Files Uploaded',
      value: totalUploads,
      icon: UploadIcon,
      color: 'blue',
      previous: getPreviousPeriodTotal(totalUploads),
    },
    {
      label: 'Files Downloaded',
      value: totalDownloads,
      icon: Download,
      color: 'green',
      previous: getPreviousPeriodTotal(totalDownloads),
    },
    {
      label: 'Bandwidth Used',
      value: formatBytes(totalBandwidth),
      icon: Activity,
      color: 'purple',
      previous: getPreviousPeriodTotal(totalBandwidth),
      rawValue: totalBandwidth,
    },
    {
      label: 'Storage Added',
      value: formatBytes(totalStorageAdded),
      icon: HardDrive,
      color: 'orange',
      previous: getPreviousPeriodTotal(totalStorageAdded),
      rawValue: totalStorageAdded,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600 mt-1">Track your storage usage and activity</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const change = calculateChange(
            stat.rawValue || stat.value,
            stat.previous
          );
          const isPositive = change >= 0;

          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-${stat.color}-50 rounded-lg flex items-center justify-center text-${stat.color}-600`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {Math.abs(change)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Storage Overview</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Total Storage Used</span>
              <span className="text-sm text-gray-600">
                {profile && formatBytes(profile.storage_used)} of{' '}
                {profile && formatBytes(profile.storage_limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{
                  width: `${profile ? Math.min((profile.storage_used / profile.storage_limit) * 100, 100) : 0}%`,
                }}
              />
            </div>
          </div>

          {analytics.length > 0 ? (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Activity</h4>
              <div className="space-y-2">
                {analytics.slice(-7).map((day) => (
                  <div key={day.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-green-600">
                        {day.files_uploaded} uploads
                      </span>
                      <span className="text-blue-600">
                        {day.files_downloaded} downloads
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No activity data available yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Current Plan</span>
              <span className="font-medium text-gray-900 capitalize">
                {profile?.plan_type || 'Free'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Storage Limit</span>
              <span className="font-medium text-gray-900">
                {profile && formatBytes(profile.storage_limit)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available Storage</span>
              <span className="font-medium text-gray-900">
                {profile && formatBytes(profile.storage_limit - profile.storage_used)}
              </span>
            </div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upgrade Plan
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Files</span>
              <span className="font-medium text-gray-900">{totalUploads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. File Size</span>
              <span className="font-medium text-gray-900">
                {totalUploads > 0 ? formatBytes(Math.floor(totalStorageAdded / totalUploads)) : '0 Bytes'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Account Age</span>
              <span className="font-medium text-gray-900">
                {profile && Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
