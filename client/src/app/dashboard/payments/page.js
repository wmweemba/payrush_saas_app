"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function PaymentsPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication guard and data loading
  useEffect(() => {
    const initializePayments = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
        }
        
        if (!session?.user) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          // Set a default profile to allow the app to continue working
          setProfile({ 
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User', 
            business_name: 'My Business' 
          });
        } else if (profileData) {
          setProfile(profileData);
        }

      } catch (error) {
        console.error('Payments page initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePayments();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Payments...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout currentTab="payments">
      <div className="space-y-8">
        {/* Payment Integration Status */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-8 border border-purple-200 dark:border-purple-800 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Payment Gateway Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              We're working on integrating secure payment processing capabilities to help you collect payments from your customers seamlessly. This feature will support multiple payment methods and provide real-time transaction tracking.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm font-medium rounded-full">
                🚀 Coming Soon
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Expected Q1 2026
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Payment Collection</h4>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure payment links for invoices</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Multiple payment methods support</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>International payment processing</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Automated payment reminders</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Payment Management</h4>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time transaction monitoring</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Detailed payment analytics</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Automated reconciliation</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Comprehensive reporting</span>
              </li>
            </ul>
          </div>
        </div>



        {/* Current State */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-start space-x-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Manual Payment Processing
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                Currently, PayRush operates with manual payment processing. You can mark invoices as paid manually once you receive payments through your preferred payment methods (bank transfers, mobile money, etc.).
              </p>
              <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Tip: Use the "Mark as Paid" button on your invoice dashboard when payments are received
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Notification Signup */}
        <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 text-center">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Stay Updated on Payment Features
          </h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            We'll notify you as soon as payment processing features become available.
          </p>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            📧 Automatic updates will be sent to your registered email address
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}