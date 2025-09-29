'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientList from '@/components/clients/ClientList';
import ClientForm from '@/components/clients/ClientForm';
import ClientProfile from '@/components/clients/ClientProfile';
import { clientService } from '@/lib/clientService';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientManagementPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'form', 'profile'
  const [selectedClient, setSelectedClient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user ? { id: user.id, email: user.email } : null);
        setUser(user);
      } catch (error) {
        console.error('Failed to get current user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, []);

  const handleCreateClient = () => {
    setSelectedClient(null);
    setCurrentView('form');
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setCurrentView('form');
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setCurrentView('profile');
  };

  const handleFormSubmit = async (formData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const clientData = {
        userId: user.id,
        ...formData
      };

      if (selectedClient) {
        // Update existing client
        await clientService.updateClient(selectedClient.id, clientData);
      } else {
        // Create new client
        await clientService.createClient(clientData);
      }

      // Refresh the list and return to list view
      setRefreshTrigger(prev => prev + 1);
      setCurrentView('list');
      setSelectedClient(null);
    } catch (error) {
      alert(`Error ${selectedClient ? 'updating' : 'creating'} client: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setCurrentView('list');
    setSelectedClient(null);
  };

  const handleProfileClose = () => {
    setCurrentView('list');
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    // Refresh the list after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access client management.</p>
          <a 
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your client relationships and information
              </p>
            </div>
            
            {currentView === 'list' && (
              <button
                onClick={handleCreateClient}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                Add New Client
              </button>
            )}

            {currentView !== 'list' && (
              <button
                onClick={() => setCurrentView('list')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back to List
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'list' && (
          <ClientList
            userId={user.id}
            onSelectClient={handleSelectClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'form' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {selectedClient ? 'Edit Client' : 'Create New Client'}
              </h2>
              <p className="mt-1 text-gray-600">
                {selectedClient 
                  ? 'Update client information and settings'
                  : 'Add a new client to your system'
                }
              </p>
            </div>
            
            <ClientForm
              client={selectedClient}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === 'profile' && selectedClient && (
          <ClientProfile
            client={selectedClient}
            onEdit={handleEditClient}
            onClose={handleProfileClose}
          />
        )}
      </div>
    </div>
  );
}