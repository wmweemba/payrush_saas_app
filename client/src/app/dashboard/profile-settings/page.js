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
  const [originalData, setOriginalData] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [availableFields, setAvailableFields] = useState({
    name: true,
    business_name: true,
    phone: true,
    address: true,
    website: true
  });

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
          // Profile doesn't exist, create one with minimal data
          const defaultProfile = {
            id: session.user.id,
            business_name: 'My Business'
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
              name: session.user.email?.split('@')[0] || 'User',
              business_name: 'My Business',
              email: session.user.email || '',
              phone: '',
              address: '',
              website: ''
            });
          } else {
            setProfileData({
              name: newProfile.name || session.user.email?.split('@')[0] || 'User',
              business_name: newProfile.business_name || 'My Business',
              email: session.user.email || '',
              phone: newProfile.phone || '',
              address: newProfile.address || '',
              website: newProfile.website || ''
            });
          }
        } else if (profileError) {
          console.error('Error fetching profile:', profileError);
          setMessage('Error loading profile data');
          setIsError(true);
        } else {
          const loadedData = {
            name: session.user.email?.split('@')[0] || 'User',
            business_name: profile.business_name || 'My Business',
            email: session.user.email || '',
            phone: '',
            address: '',
            website: ''
          };
          setProfileData(loadedData);
          setOriginalData({ ...loadedData });
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

  // Handle input changes (only for business_name since that's the only editable field)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow changes to business_name
    if (name === 'business_name') {
      const newData = {
        ...profileData,
        [name]: value
      };
      setProfileData(newData);
      
      // Check if business name has changed from original
      const hasChanges = newData.business_name !== originalData.business_name;
      setHasChanges(hasChanges);
    }
  };

  // Save profile changes
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');
    setIsError(false);

    try {
      // Only update business name since that's the only field we can save
      const updateData = {
        business_name: profileData.business_name.trim()
      };

      console.log('Updating business name:', updateData);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Business name updated successfully:', updatedProfile);

      // Update the local state with the saved data
      if (updatedProfile) {
        const newData = {
          ...profileData,
          business_name: updatedProfile.business_name
        };
        setProfileData(newData);
        setOriginalData({ ...newData });
        setHasChanges(false);
      }

      setMessage('✅ Business name updated successfully!');
      setIsError(false);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage(`❌ Failed to update business name: ${error.message}`);
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
            {/* Business Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Business Information
              </h2>
              <div className="grid grid-cols-1 gap-6">
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
              </div>
            </div>

            {/* Account Information (Read-only) */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400
                             transition-colors cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email address is managed through your account settings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-400
                             transition-colors cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Display name is derived from your email address
                  </p>
                </div>
              </div>
            </div>

            {/* Future Features Notice */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Additional Profile Fields Coming Soon
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      We're working on adding more profile fields like phone number, address, and website. 
                      For now, you can update your business name which will be displayed throughout the application.
                    </p>
                  </div>
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
              <div className="flex space-x-3">
                <Button 
                  type="submit"
                  disabled={saving || !hasChanges}
                  className={`text-white hover:scale-105 transition-transform px-8 ${
                    hasChanges ? 'payrush-gradient' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : hasChanges ? (
                    'Save Changes'
                  ) : (
                    'No Changes'
                  )}
                </Button>
                {message && !isError && (
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Back to Dashboard
                  </Link>
                )}
              </div>
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