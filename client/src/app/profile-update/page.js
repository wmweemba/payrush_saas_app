'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfileUpdatePage() {
  const { user, profile, loading } = useUserProfile();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    business_name: ''
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        business_name: profile.business_name || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    try {
      // Check what columns exist first
      const { data: schemaTest } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      console.log('Current profile schema:', schemaTest?.[0] ? Object.keys(schemaTest[0]) : 'No data');

      // Prepare update data based on available columns
      const updateData = {
        business_name: formData.business_name
      };

      // Only add name if we can confirm it exists in the schema
      if (schemaTest?.[0] && 'name' in schemaTest[0]) {
        updateData.name = formData.name;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setMessage('✅ Profile updated successfully! Refresh the page to see changes.');
      
      // Optionally refresh the page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Profile update error:', error);
      setMessage(`❌ Failed to update profile: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickUpdate = async () => {
    setUpdating(true);
    setMessage('');

    try {
      // First check what columns exist in the profiles table
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      console.log('Testing profile schema:', { testData, testError });

      // Only update business_name for now, since name column might not exist
      const { data, error } = await supabase
        .from('profiles')
        .update({
          business_name: "Smith's Digital Solutions"
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setMessage('✅ Business name updated successfully! Refresh the page to see changes.');
      
      // Refresh after delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Profile update error:', error);
      setMessage(`❌ Failed to update profile: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Update Profile</h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Current Profile:</h3>
          <p><strong>Name:</strong> {profile?.name || 'Not set'}</p>
          <p><strong>Business Name:</strong> {profile?.business_name || 'Not set'}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>

        <div className="mb-6">
          <button
            onClick={handleQuickUpdate}
            disabled={updating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Quick Fix: Set to "Smith\'s Digital Solutions"'}
          </button>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Manual Update:</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John William Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Smith's Digital Solutions"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}