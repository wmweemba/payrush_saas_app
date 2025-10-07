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
        {/* Flutterwave Integration Status */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Flutterwave Payment Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Accept payments from customers across Africa and globally using cards, mobile money, bank transfers, and more.
              </p>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full">
                  🚧 In Development
                </span>
                <a 
                  href="https://developer.flutterwave.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View Flutterwave API Docs →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Planned Features */}
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
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Generate payment links for invoices</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Accept card payments globally</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Mobile money integration (MTN, Airtel)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Bank transfer options</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Payment Tracking</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Real-time payment status updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Automatic invoice status updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Payment history and receipts</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Webhook integration</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Integration Preview */}
        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            🔧 Developer Preview
          </h4>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <div className="text-green-400">{`// /lib/payments/flutterwave.js`}</div>
            <div className="text-gray-300 mt-2">
              <span className="text-blue-400">import</span> {`{ FlutterwaveCheckout }`} <span className="text-blue-400">from</span> <span className="text-yellow-300">&apos;flutterwave-react-v3&apos;</span>;<br/>
              <br/>
              <span className="text-purple-400">export</span> <span className="text-blue-400">const</span> <span className="text-white">createPaymentLink</span> = <span className="text-yellow-300">async</span> (invoiceData) {`=> {`}<br/>
              &nbsp;&nbsp;<span className="text-gray-500">{`// Generate secure payment link`}</span><br/>
              &nbsp;&nbsp;<span className="text-blue-400">const</span> config = {`= {`}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;public_key: <span className="text-yellow-300">&apos;FLW_PUBLIC_KEY&apos;</span>,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;tx_ref: invoiceData.id,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;amount: invoiceData.amount,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;currency: invoiceData.currency,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;customer: {`{`}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;email: invoiceData.customer_email,<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: invoiceData.customer_name<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{`}`}<br/>
              &nbsp;&nbsp;{`};`}<br/>
              {`};`}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Payment infrastructure is being prepared. Integration will include secure webhooks, automatic status updates, and comprehensive transaction tracking.
          </p>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Getting Started with Payments
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Setup Flutterwave Account</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Create merchant account and get API keys</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Configure Webhooks</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Set up payment status notifications</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Start Accepting Payments</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Generate links and track transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}