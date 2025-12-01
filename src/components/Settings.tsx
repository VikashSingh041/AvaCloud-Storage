import { useState, useEffect } from 'react';
import {
  Bell,
  Lock,
  Eye,
  Palette,
  Globe,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  email_notifications: boolean;
  upload_notifications: boolean;
  sharing_notifications: boolean;
  auto_sync: boolean;
  two_factor_enabled: boolean;
  language: string;
  file_retention_days: number;
  public_profile: boolean;
  analytics_tracking: boolean;
}

export function Settings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
      } else {
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user?.id,
            theme: 'light',
            email_notifications: true,
            upload_notifications: true,
            sharing_notifications: true,
            auto_sync: false,
            two_factor_enabled: false,
            language: 'en',
            file_retention_days: 30,
            public_profile: false,
            analytics_tracking: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          theme: preferences.theme,
          email_notifications: preferences.email_notifications,
          upload_notifications: preferences.upload_notifications,
          sharing_notifications: preferences.sharing_notifications,
          auto_sync: preferences.auto_sync,
          language: preferences.language,
          file_retention_days: preferences.file_retention_days,
          public_profile: preferences.public_profile,
          analytics_tracking: preferences.analytics_tracking,
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowPasswordForm(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl space-y-8">
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-900' : 'text-red-900'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Palette className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
            <p className="text-sm text-gray-600">Customize how the platform looks</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={preferences?.theme || 'light'}
              onChange={(e) =>
                setPreferences({ ...preferences!, theme: e.target.value as 'light' | 'dark' })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={preferences?.language || 'en'}
              onChange={(e) =>
                setPreferences({ ...preferences!, language: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-600">Manage how you receive updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.email_notifications || false}
              onChange={(e) =>
                setPreferences({ ...preferences!, email_notifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive email updates about your account</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.upload_notifications || false}
              onChange={(e) =>
                setPreferences({ ...preferences!, upload_notifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Upload Notifications</p>
              <p className="text-sm text-gray-600">Get notified when files are uploaded</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.sharing_notifications || false}
              onChange={(e) =>
                setPreferences({ ...preferences!, sharing_notifications: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Sharing Notifications</p>
              <p className="text-sm text-gray-600">Get notified when files are shared with you</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.auto_sync || false}
              onChange={(e) =>
                setPreferences({ ...preferences!, auto_sync: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Auto Sync</p>
              <p className="text-sm text-gray-600">Automatically sync files across devices</p>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Eye className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Privacy & Sharing</h2>
            <p className="text-sm text-gray-600">Control your privacy settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.public_profile || false}
              onChange={(e) =>
                setPreferences({ ...preferences!, public_profile: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Public Profile</p>
              <p className="text-sm text-gray-600">Allow others to view your public profile</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences?.analytics_tracking || false}
              onChange={(e) =>
                setPreferences({ ...preferences!, analytics_tracking: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div>
              <p className="font-medium text-gray-900">Analytics & Usage</p>
              <p className="text-sm text-gray-600">Help us improve by sharing usage data</p>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deleted File Retention
            </label>
            <select
              value={preferences?.file_retention_days || 30}
              onChange={(e) =>
                setPreferences({ ...preferences!, file_retention_days: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              How long to keep deleted files before permanent removal
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-600">Manage your security settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">Email</p>
            <p className="text-sm text-gray-600 mb-4">{user?.email}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>

            {showPasswordForm && (
              <div className="mt-4 space-y-3">
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordData.new}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwordData.confirm}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.two_factor_enabled || false}
                onChange={(e) =>
                  setPreferences({ ...preferences!, two_factor_enabled: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Add an extra layer of security</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account</h2>
            <p className="text-sm text-gray-600">Account information and actions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">Member Since</p>
            <p className="text-sm text-gray-600">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-1">Plan Type</p>
            <p className="text-sm text-gray-600 capitalize">{profile?.plan_type || 'free'} Plan</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Delete Account
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-white p-4 rounded-lg border border-gray-200">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
