"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/dashboard');
      }
    };
    
    checkUser();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        // Profile doesn't exist, create a basic one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'User',
            business_name: 'My Business'
          });

        if (insertError) {
          console.error('Failed to create profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Ensure profile exists after successful sign in
        await ensureProfileExists(data.user);
        
        setMessage('✅ Sign in successful! Redirecting to dashboard...');
        setIsError(false);
        
        // Clear form
        setFormData({
          email: '',
          password: ''
        });

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setMessage(`❌ Sign in failed: ${error.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            PayRush
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your PayRush account
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-gray-900 dark:text-white 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <a
              href="#"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Forgot your password?
            </a>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full payrush-gradient text-white hover:scale-105 transition-transform py-3"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

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

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Demo Credentials:</strong>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
            Email: demo@payrush.com<br/>
            Password: Demo123!
          </p>
        </div>
      </div>
    </div>
  );
}