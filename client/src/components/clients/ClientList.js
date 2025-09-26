'use client';

import { useState, useEffect } from 'react';
import { clientService, clientFormatters, clientFilters } from '@/lib/clientService';

export default function ClientList({ 
  userId, 
  onSelectClient, 
  onEditClient, 
  onDeleteClient, 
  refreshTrigger = 0 
}) {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('companyName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [availableTags, setAvailableTags] = useState([]);

  // Load clients
  useEffect(() => {
    loadClients();
  }, [userId, refreshTrigger]);

  // Filter and sort clients when search/filter options change
  useEffect(() => {
    let filtered = clientFilters.searchClients(clients, searchTerm);
    if (selectedTag) {
      filtered = clientFilters.filterByTag(filtered, selectedTag);
    }
    filtered = clientFilters.sortClients(filtered, sortBy, sortOrder);
    setFilteredClients(filtered);
  }, [clients, searchTerm, selectedTag, sortBy, sortOrder]);

  // Update available tags when clients change
  useEffect(() => {
    const tags = clientFilters.getUniqueTagsFromClients(clients);
    setAvailableTags(tags);
  }, [clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients(userId);
      setClients(response.clients || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteClick = async (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.company_name}?`)) {
      try {
        await clientService.deleteClient(client.id, userId);
        setClients(prev => prev.filter(c => c.id !== client.id));
        if (onDeleteClient) onDeleteClient(client);
      } catch (err) {
        alert(`Error deleting client: ${err.message}`);
      }
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading clients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading clients</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadClients}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
            <p className="text-sm text-gray-600">
              {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
              {searchTerm || selectedTag ? ` (filtered from ${clients.length} total)` : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tags</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-500 mb-2">
            {clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
          </div>
          <p className="text-sm text-gray-400">
            {clients.length === 0 
              ? 'Create your first client to get started' 
              : 'Try adjusting your search terms or filters'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('company_name')}
                >
                  Company {getSortIcon('company_name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_invoiced')}
                >
                  Total Invoiced {getSortIcon('total_invoiced')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('outstanding_balance')}
                >
                  Outstanding {getSortIcon('outstanding_balance')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => {
                const status = clientFormatters.getClientStatus(client);
                return (
                  <tr 
                    key={client.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectClient && onSelectClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.company_name}
                        </div>
                        {client.contact_person && (
                          <div className="text-sm text-gray-500">
                            {client.contact_person}
                          </div>
                        )}
                        {client.tags && client.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {client.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {client.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{client.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      {client.phone && (
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {clientFormatters.formatCurrency(
                        client.total_invoiced || 0,
                        client.default_currency
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${
                        (client.outstanding_balance || 0) > 0 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {clientFormatters.formatCurrency(
                          client.outstanding_balance || 0,
                          client.default_currency
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status.color === 'green' 
                          ? 'bg-green-100 text-green-800' 
                          : status.color === 'orange'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClient && onEditClient(client);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(client);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}