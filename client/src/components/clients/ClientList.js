'use client';

import { useState, useEffect } from 'react';
import { clientService, clientFormatters, clientFilters } from '@/lib/clientService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState('name');
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
      // Don't pass userId - server gets it from JWT token
      const response = await clientService.getClients();
      setClients(response.data.clients || []);
      setError(null);
    } catch (err) {
      console.error('Error loading clients:', {
        message: err.message,
        status: err.status,
        data: err.data,
        fullError: err
      });
      
      if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.message || 'Failed to load clients');
      }
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
    if (window.confirm(`Are you sure you want to delete ${client.name || client.company_name}?`)) {
      try {
        // Don't pass userId - server gets it from JWT token
        await clientService.deleteClient(client.id);
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
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
        <CardContent className="p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading clients...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">Error loading clients</div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <Button
              onClick={loadClients}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
      {/* Header with Search and Filters */}
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Clients
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
              {searchTerm || selectedTag ? ` (filtered from ${clients.length} total)` : ''}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Enhanced Search with better visibility */}
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Enhanced Tag Filter */}
            <div className="min-w-[140px]">
              <Select value={selectedTag || "all"} onValueChange={(value) => setSelectedTag(value === "all" ? "" : value)}>
                <SelectTrigger className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600">
                  <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700">
                    All Tags
                  </SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem 
                      key={tag} 
                      value={tag}
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Client List */}
      <CardContent className="p-0">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              {clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {clients.length === 0 
                ? 'Create your first client to get started' 
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('name')}
                  >
                    Company {getSortIcon('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('total_invoiced')}
                  >
                    Total Invoiced {getSortIcon('total_invoiced')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleSort('current_balance')}
                  >
                    Outstanding {getSortIcon('current_balance')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => {
                  const status = clientFormatters.getClientStatus(client);
                  return (
                    <tr 
                      key={client.id} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                      onClick={() => onSelectClient && onSelectClient(client)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                          {client.company && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {client.company}
                            </div>
                          )}
                          {client.tags && client.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {client.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                  {tag}
                                </span>
                              ))}
                              {client.tags.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{client.tags.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{client.email}</div>
                        {client.phone && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {clientFormatters.formatCurrency(
                          client.total_invoiced || 0,
                          client.default_currency
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${
                          (client.current_balance || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {clientFormatters.formatCurrency(
                            client.current_balance || 0,
                            client.default_currency
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status.color === 'green' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : status.color === 'orange'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditClient && onEditClient(client);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(client);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}