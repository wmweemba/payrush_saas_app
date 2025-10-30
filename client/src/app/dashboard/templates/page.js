'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Copy, Trash2, Star, Download, Settings, Eye, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from '@/lib/apiConfig';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [templateStats, setTemplateStats] = useState(null);
  const { toast } = useToast();

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient('/api/templates', {
        method: 'GET'
      });
      
      if (response.success) {
        const templatesList = response.data.templates || [];
        setTemplates(templatesList);
        
        // If no templates exist, initialize default templates
        if (templatesList.length === 0) {
          console.log('No templates found, initializing default templates...');
          try {
            const initResponse = await apiClient('/api/templates/initialize', {
              method: 'POST'
            });
            
            if (initResponse.success) {
              console.log('Default templates initialized successfully');
              // Refetch templates after initialization
              setTimeout(() => {
                fetchTemplates();
              }, 1000);
              return;
            }
          } catch (initErr) {
            console.warn('Failed to initialize templates:', initErr.message);
          }
        }
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch template statistics
  const fetchTemplateStats = async () => {
    try {
      const response = await apiClient('/api/templates/stats', {
        method: 'GET'
      });
      
      if (response.success) {
        setTemplateStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch template stats');
      }
    } catch (err) {
      // Silently handle stats errors - the page will work fine without detailed stats
      // since the StatsOverview component uses the templates array directly
      
      // Set default stats to prevent UI issues
      setTemplateStats({
        totalTemplates: 0,
        customTemplates: 0,
        systemTemplates: 0,
        totalUsage: 0,
        recentlyCreated: 0,
        recentlyUsed: 0,
        templatesByType: {},
        defaultTemplate: null,
        mostUsedTemplate: null
      });
    }
  };

  // Initialize default templates if none exist
  const initializeTemplates = async () => {
    try {
      await apiClient('/api/templates/initialize', {
        method: 'POST'
      });
      fetchTemplates();
    } catch (err) {
      console.error('Error initializing templates:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchTemplateStats();
  }, []);

  // Filter templates based on search and type
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || template.template_type === selectedType;
    return matchesSearch && matchesType;
  });

  // Handle template actions
  const handleDuplicateTemplate = async (templateId) => {
    try {
      const response = await apiClient(`/api/templates/${templateId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      if (response.success) {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      const response = await apiClient(`/api/templates/${templateId}/default`, {
        method: 'PUT'
      });
      
      if (response.success) {
        fetchTemplates();
      }
    } catch (err) {
      console.error('Error setting default template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const response = await apiClient(`/api/templates/${templateId}`, {
          method: 'DELETE'
        });
        
        if (response.success) {
          fetchTemplates();
        }
      } catch (err) {
        console.error('Error deleting template:', err);
      }
    }
  };

  // Template card component
  const TemplateCard = ({ template }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{template.template_name}</CardTitle>
            {template.is_default && (
              <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                <Star className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
            {template.is_system_template && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">System</Badge>
            )}
          </div>
          <Badge variant="outline" className="capitalize font-medium bg-gray-50 dark:bg-gray-800">
            {template.template_type}
          </Badge>
        </div>
        {template.description && (
          <CardDescription className="text-gray-600 dark:text-gray-400">{template.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Template preview placeholder */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg h-32 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-600 group-hover:border-blue-300 transition-colors">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Eye className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Template Preview</p>
            </div>
          </div>
          
          {/* Template metadata */}
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <span className="flex items-center">
              <Download className="w-4 h-4 mr-1" />
              Used {template.usage_count || 0} times
            </span>
            <span>{new Date(template.updated_at).toLocaleDateString()}</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(`/dashboard/templates/editor/${template.id}`, '_blank')}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDuplicateTemplate(template.id)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Copy className="w-4 h-4" />
            </Button>
            {!template.is_default && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSetDefault(template.id)}
                className="hover:bg-yellow-50 dark:hover:bg-yellow-900 hover:text-yellow-700 dark:hover:text-yellow-400"
              >
                <Star className="w-4 h-4" />
              </Button>
            )}
            {!template.is_system_template && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteTemplate(template.id)}
                className="hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Stats overview component
  const StatsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{templates.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {templates.filter(t => t.is_system_template).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Edit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {templates.filter(t => !t.is_system_template).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Download className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          {error}. {templates.length === 0 && (
            <Button onClick={initializeTemplates} className="ml-2">
              Initialize Default Templates
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DashboardLayout
      title="Invoice Templates"
      description="Create and customize professional invoice templates for your business"
      currentTab="templates"
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invoice Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and customize professional invoice templates for your business
          </p>
        </div>
        <Button 
          onClick={() => window.open('/dashboard/templates/editor/new', '_blank')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-slate-800 h-12 p-1 rounded-lg border">
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger 
            value="branding"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <Star className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger 
            value="numbering"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <span className="w-4 h-4 mr-2 text-sm">🔢</span>
            Numbering
          </TabsTrigger>
          <TabsTrigger 
            value="approval"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Approval
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <StatsOverview />
          
          {/* Search and filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                <SelectItem value="all" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">All Types</SelectItem>
                <SelectItem value="professional" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Professional</SelectItem>
                <SelectItem value="minimal" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Minimal</SelectItem>
                <SelectItem value="modern" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Modern</SelectItem>
                <SelectItem value="classic" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Classic</SelectItem>
                <SelectItem value="custom" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates grid */}
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="py-8">
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    {templates.length === 0 
                      ? "Get started by initializing default templates or creating your first custom template."
                      : "Try adjusting your search criteria or create a new template."
                    }
                  </p>
                  {templates.length === 0 ? (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={initializeTemplates} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20">
                        Initialize Default Templates
                      </Button>
                      <Button onClick={() => window.open('/dashboard/templates/editor/new', '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => window.open('/dashboard/templates/editor/new', '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Business Branding</CardTitle>
              <CardDescription>
                Customize your business branding and logo for all templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <p>Branding settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbering">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Numbering</CardTitle>
              <CardDescription>
                Configure custom invoice numbering schemes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔢</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Custom Numbering Schemes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create and manage custom invoice numbering patterns with prefix, suffix, sequence management, and reset options.
                </p>
                <Button
                  onClick={() => window.open('/dashboard/numbering', '_self')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Numbering Schemes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
              <CardDescription>
                Set up invoice approval processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <p>Approval workflows coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}