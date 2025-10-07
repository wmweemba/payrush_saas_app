"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import ClientList from "@/components/clients/ClientList";
import ClientForm from "@/components/clients/ClientForm";
import ClientProfile from "@/components/clients/ClientProfile";
import { clientService } from "@/lib/clientService";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ClientsPage() {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Client management state
  const [clientView, setClientView] = useState('list'); // 'list', 'form', 'profile'
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRefreshTrigger, setClientRefreshTrigger] = useState(0);
  const [clientFormLoading, setClientFormLoading] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Authentication guard and data loading
  useEffect(() => {
    const initializeClients = async () => {
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
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            business_name: 'My Business'
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
            
          if (!createError) {
            setProfile(createdProfile);
          } else {
            setProfile(newProfile);
          }
        }

      } catch (error) {
        console.error('Clients page initialization error:', error);
        setMessage('Error loading clients page. Please try refreshing.');
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    initializeClients();

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

  // Client Management Functions
  const handleCreateClient = () => {
    setSelectedClient(null);
    setClientView('form');
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setClientView('form');
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClientView('profile');
  };

  const handleClientFormSubmit = async (formData) => {
    if (!user) return;

    setClientFormLoading(true);
    try {
      if (selectedClient) {
        // Update existing client
        await clientService.updateClient(selectedClient.id, formData);
        setMessage('✅ Client updated successfully!');
      } else {
        // Create new client
        await clientService.createClient(formData);
        setMessage('✅ Client created successfully!');
      }

      setIsError(false);
      // Refresh the list and return to list view
      setClientRefreshTrigger(prev => prev + 1);
      setClientView('list');
      setSelectedClient(null);
    } catch (error) {
      setMessage(`❌ Error ${selectedClient ? 'updating' : 'creating'} client: ${error.message}`);
      setIsError(true);
    } finally {
      setClientFormLoading(false);
    }
  };

  const handleClientFormCancel = () => {
    setClientView('list');
    setSelectedClient(null);
  };

  const handleClientProfileClose = () => {
    setClientView('list');
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    // Refresh the list after deletion
    setClientRefreshTrigger(prev => prev + 1);
    setMessage('✅ Client deleted successfully!');
    setIsError(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Clients...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout currentTab="clients">
      <div className="space-y-6">
        {clientView === 'list' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Client Management
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Manage your client relationships and information
                </p>
              </div>
              <Button 
                onClick={handleCreateClient}
                className="payrush-gradient text-white hover:scale-105 transition-transform"
              >
                ➕ Add New Client
              </Button>
            </div>

            <ClientList
              userId={user?.id}
              onSelectClient={handleSelectClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              refreshTrigger={clientRefreshTrigger}
            />
          </>
        )}

        {clientView === 'form' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedClient ? 'Edit Client' : 'Create New Client'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {selectedClient 
                    ? 'Update client information and settings'
                    : 'Add a new client to your system'
                  }
                </p>
              </div>
              <Button 
                onClick={() => setClientView('list')}
                variant="outline"
              >
                ← Back to List
              </Button>
            </div>
            
            <ClientForm
              client={selectedClient}
              onSubmit={handleClientFormSubmit}
              onCancel={handleClientFormCancel}
              isLoading={clientFormLoading}
            />
          </div>
        )}

        {clientView === 'profile' && selectedClient && (
          <ClientProfile
            client={selectedClient}
            onEdit={handleEditClient}
            onClose={handleClientProfileClose}
          />
        )}
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
    </DashboardLayout>
  );
}