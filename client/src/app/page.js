"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  // Auth state
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  
  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Session handling on component mount
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchInvoices(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchInvoices(session.user.id);
        } else {
          setInvoices([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user's invoices
  const fetchInvoices = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setMessage(`❌ Failed to fetch invoices: ${error.message}`);
      setIsError(true);
    }
  };

  // Handle signup
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Insert profile record with explicit user context
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              business_name: 'Test Business'
            });

          if (profileError) {
            console.warn('Profile creation failed, user can create it later:', profileError);
            setMessage('✅ Signup successful! Check your email to verify your account. Profile will be created on first sign in.');
          } else {
            setMessage('✅ Signup successful! Profile created. Check your email to verify your account.');
          }
        } catch (profileError) {
          console.warn('Profile creation failed:', profileError);
          setMessage('✅ Signup successful! Check your email to verify your account.');
        }

        setIsError(false);
        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setMessage(`❌ Signup failed: ${error.message}`);
      setIsError(true);
    } finally {
      setAuthLoading(false);
    }
  };

  // Ensure user profile exists
  const ensureProfileExists = async (user) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            business_name: 'Test Business'
          });

        if (insertError) {
          console.error('Failed to create profile:', insertError);
          setMessage(`⚠️ Profile creation failed: ${insertError.message}`);
          setIsError(true);
        }
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  };

  // Handle signin
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Ensure profile exists after successful sign in
        await ensureProfileExists(data.user);
        
        setMessage('✅ Sign in successful! Welcome back to PayRush.');
        setIsError(false);
        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setMessage(`❌ Sign in failed: ${error.message}`);
      setIsError(true);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle signout
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`❌ Error signing out: ${error.message}`);
      setIsError(true);
    } else {
      setMessage('👋 Signed out successfully!');
      setIsError(false);
    }
  };

  // Create test invoice
  const createTestInvoice = async () => {
    if (!user) return;
    
    setInvoiceLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const testInvoice = {
        user_id: user.id,
        customer_name: 'Test Customer',
        customer_email: 'customer@test.com',
        amount: 199.99,
        currency: 'USD',
        status: 'draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(testInvoice)
        .select();

      if (error) throw error;

      setMessage('✅ Test invoice created successfully!');
      setIsError(false);
      
      // Refresh invoices
      await fetchInvoices(user.id);
    } catch (error) {
      setMessage(`❌ Failed to create invoice: ${error.message}`);
      setIsError(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading PayRush...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            PayRush
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Contact
            </a>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.email}
              </span>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started
            </Button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Fast & Secure
            <span className="payrush-gradient bg-clip-text text-transparent block">
              Payment Processing
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto text-balance">
            PayRush provides lightning-fast payment processing solutions for businesses of all sizes. 
            Accept payments globally with industry-leading security and reliability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="payrush-gradient text-white hover:scale-105 transition-transform payrush-shadow">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800">
              View Demo
            </Button>
          </div>
        </div>

        {!user ? (
          // Authentication Section
          <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Supabase Auth + DB Test
            </h2>
            
            {/* Auth Mode Toggle */}
            <div className="flex mb-6 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'signin'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'signup'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email (try: testrush@example.com)"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password (try: Test1234!)"
                />
              </div>
              <Button 
                type="submit" 
                disabled={authLoading}
                className="w-full payrush-gradient text-white hover:scale-105 transition-transform"
              >
                {authLoading ? (
                  authMode === 'signin' ? 'Signing In...' : 'Creating Account...'
                ) : (
                  authMode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>
            
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                isError 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              }`}>
                {message}
              </div>
            )}
            
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              This is a comprehensive test of Supabase Auth + Database integration.
            </p>
          </div>
        ) : (
          // Dashboard Section
          <div className="max-w-4xl mx-auto mt-16 space-y-6">
            {/* Welcome Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome back! 🎉
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    User ID: <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{user.id}</code>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Email: {user.email}
                  </p>
                </div>
                <Button 
                  onClick={createTestInvoice}
                  disabled={invoiceLoading}
                  className="payrush-gradient text-white hover:scale-105 transition-transform"
                >
                  {invoiceLoading ? 'Creating...' : 'Create Test Invoice'}
                </Button>
              </div>
            </div>

            {/* Invoices Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Your Invoices ({invoices.length})
                </h3>
                <Button 
                  onClick={() => fetchInvoices(user.id)}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400"
                >
                  Refresh
                </Button>
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No invoices yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Click "Create Test Invoice" to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {invoice.customer_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {invoice.customer_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ${invoice.amount} {invoice.currency}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : invoice.status === 'sent'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Due: {invoice.due_date}</span>
                        <span>ID: {invoice.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                isError 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 payrush-gradient rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Lightning Fast
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Process payments in milliseconds with our optimized infrastructure and global CDN.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 payrush-gradient rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Bank-Level Security
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              PCI DSS compliant with end-to-end encryption and advanced fraud detection.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 payrush-gradient rounded-lg mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Global Coverage
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Accept payments from anywhere in the world with support for 150+ currencies.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
