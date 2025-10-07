"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ProfileSettings() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    business_name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Authentication guard and profile loading
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one with defaults
          const defaultProfile = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            business_name: 'My Business',
            phone: '',
            address: '',
            website: ''
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            // Use defaults for display
            setProfileData({
              ...defaultProfile,
              email: session.user.email || ''
            });
          } else {
            setProfileData({
              ...newProfile,
              email: session.user.email || ''
            });
          }
        } else if (profileError) {
          console.error('Error fetching profile:', profileError);
          setMessage('Error loading profile data');
          setIsError(true);
        } else {
          setProfileData({
            ...profile,
            email: session.user.email || ''
          });
        }

      } catch (error) {
        console.error('Profile initialization error:', error);
        setMessage('Error loading profile. Please try refreshing.');
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile changes
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');
    setIsError(false);

    try {
      // Prepare data for update (exclude email as it's managed by Supabase Auth)
      const updateData = {
        name: profileData.name.trim(),
        business_name: profileData.business_name.trim(),
        phone: profileData.phone.trim() || null,
        address: profileData.address.trim() || null,
        website: profileData.website.trim() || null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      setMessage('✅ Profile updated successfully!');
      setIsError(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage(`❌ Failed to update profile: ${error.message}`);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  // Handle signout
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`Error signing out: ${error.message}`);
      setIsError(true);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header Navigation */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Back Link */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                PayRush
              </Link>
              <span className="text-gray-400">•</span>
              <Link 
                href="/dashboard" 
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.email}
              </span>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Settings Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Update your business information and contact details
              </p>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <form onSubmit={saveProfile} className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400
                             transition-colors cursor-not-allowed"
                    placeholder="Email managed by account settings"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email address is managed through your account settings
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information Section */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="business_name"
                    name="business_name"
                    value={profileData.business_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-colors"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={profileData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-colors"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-colors resize-none"
                    placeholder="Enter your business address"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 flex justify-between">
              <Link 
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                         rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </Link>
              <Button 
                type="submit"
                disabled={saving}
                className="payrush-gradient text-white hover:scale-105 transition-transform px-8"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-sm ${
            isError 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}