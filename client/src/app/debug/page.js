"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function Debug() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, details) => {
    setResults(prev => [...prev, { test, status, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Check Supabase client initialization
    try {
      addResult("Supabase Client", "✅ SUCCESS", `URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    } catch (error) {
      addResult("Supabase Client", "❌ FAILED", error.message);
    }

    // Test 2: Test basic connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      addResult("Database Connection", "✅ SUCCESS", "Can connect to database");
    } catch (error) {
      addResult("Database Connection", "❌ FAILED", error.message);
    }

    // Test 3: Test different email formats
    const testEmails = [
      "test@gmail.com",
      "test@yahoo.com", 
      "test@outlook.com",
      "test@company.com",
      "wmweemba@gmail.com"
    ];

    for (const email of testEmails) {
      try {
        // Note: This will create test accounts, use with caution
        addResult(`Email Test: ${email}`, "⏳ TESTING", "Attempting signup...");
        
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: "TestPassword123!",
        });

        if (error) {
          addResult(`Email Test: ${email}`, "❌ FAILED", `${error.message} (Status: ${error.status})`);
        } else {
          addResult(`Email Test: ${email}`, "✅ SUCCESS", `User created: ${data.user?.id || 'No ID'}`);
        }
      } catch (error) {
        addResult(`Email Test: ${email}`, "❌ ERROR", error.message);
      }
      
      // Wait between attempts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 4: Check auth settings
    try {
      const { data: session } = await supabase.auth.getSession();
      addResult("Auth Session", "✅ SUCCESS", `Session exists: ${!!session.session}`);
    } catch (error) {
      addResult("Auth Session", "❌ FAILED", error.message);
    }

    setLoading(false);
  };

  const testSingleEmail = async () => {
    setLoading(true);
    
    try {
      const testEmail = "wmweemba@gmail.com";
      addResult("Single Email Test", "⏳ TESTING", `Testing ${testEmail}...`);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: "TestPassword123!",
      });

      if (error) {
        addResult("Single Email Test", "❌ FAILED", `Error: ${error.message}\nStatus: ${error.status}\nDetails: ${JSON.stringify(error, null, 2)}`);
      } else {
        addResult("Single Email Test", "✅ SUCCESS", `User: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      addResult("Single Email Test", "❌ ERROR", error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            PayRush Debug Console
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            This page helps debug Supabase authentication issues. Use with caution as it may create test accounts.
          </p>

          <div className="flex gap-4 mb-8">
            <Button 
              onClick={testSingleEmail}
              disabled={loading}
              className="payrush-gradient text-white"
            >
              {loading ? "Testing..." : "Test Your Email"}
            </Button>
            <Button 
              onClick={testSupabaseConnection}
              disabled={loading}
              variant="outline"
            >
              {loading ? "Running Tests..." : "Run Full Test Suite"}
            </Button>
            <Button 
              onClick={() => setResults([])}
              variant="outline"
            >
              Clear Results
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Test Results ({results.length})
              </h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status.includes('SUCCESS') 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                        : result.status.includes('TESTING')
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {result.test}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {result.timestamp}
                      </span>
                    </div>
                    <p className={`text-sm mb-2 ${
                      result.status.includes('SUCCESS') 
                        ? 'text-green-700 dark:text-green-300'
                        : result.status.includes('TESTING')
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {result.status}
                    </p>
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {result.details}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}