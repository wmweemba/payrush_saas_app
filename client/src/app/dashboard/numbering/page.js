'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Settings, Star, Eye, Hash, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient, API_ENDPOINTS } from '@/lib/apiConfig';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function NumberingSchemesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('schemes');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentScheme, setCurrentScheme] = useState(null);
  const [previewNumber, setPreviewNumber] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    scheme_name: '',
    prefix: '',
    suffix: '',
    sequence_length: 3,
    current_number: 1,
    reset_frequency: 'never',
    include_year: false,
    include_month: false,
    include_quarter: false,
    date_format: 'YYYY',
    is_default: false
  });

  // Load numbering schemes
  const loadSchemes = async () => {
    try {
      setLoading(true);
      const response = await apiClient(API_ENDPOINTS.numberingSchemes);
      
      if (response.success) {
        setSchemes(response.data.schemes || []);
      } else {
        setError('Failed to load numbering schemes');
      }
    } catch (error) {
      console.error('Error loading schemes:', error);
      setError('Failed to load numbering schemes');
    } finally {
      setLoading(false);
    }
  };

  // Initialize schemes for new users
  const initializeSchemes = async () => {
    try {
      const response = await apiClient(API_ENDPOINTS.numberingSchemesInitialize, {
        method: 'POST'
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Default numbering scheme created successfully",
        });
        await loadSchemes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to initialize schemes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error initializing schemes:', error);
      toast({
        title: "Error",
        description: "Failed to initialize schemes",
        variant: "destructive"
      });
    }
  };

  // Preview number generation
  const updatePreview = async () => {
    if (!formData.scheme_name) {
      setPreviewNumber('');
      return;
    }

    // Create a mock scheme for preview
    const mockScheme = {
      ...formData,
      current_number: formData.current_number || 1
    };

    try {
      // Generate preview locally for immediate feedback
      let preview = mockScheme.prefix || '';
      
      // Add date components
      const now = new Date();
      const dateParts = [];

      if (mockScheme.include_year) {
        if (mockScheme.date_format === 'YYYY') {
          dateParts.push(now.getFullYear().toString());
        } else {
          dateParts.push(now.getFullYear().toString().slice(-2));
        }
      }

      if (mockScheme.include_quarter) {
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        dateParts.push(`Q${quarter}`);
      }

      if (mockScheme.include_month) {
        dateParts.push(String(now.getMonth() + 1).padStart(2, '0'));
      }

      // Add date parts
      if (dateParts.length > 0) {
        if (preview) preview += '-';
        preview += dateParts.join('-');
      }

      // Add sequence number
      const sequenceNumber = String(mockScheme.current_number).padStart(mockScheme.sequence_length, '0');
      if (preview) preview += '-';
      preview += sequenceNumber;

      // Add suffix
      if (mockScheme.suffix) {
        preview += mockScheme.suffix;
      }

      setPreviewNumber(preview);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewNumber('Error generating preview');
    }
  };

  // Update preview when form data changes
  useEffect(() => {
    updatePreview();
  }, [formData]);

  // Load schemes on component mount
  useEffect(() => {
    loadSchemes();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      scheme_name: '',
      prefix: '',
      suffix: '',
      sequence_length: 3,
      current_number: 1,
      reset_frequency: 'never',
      include_year: false,
      include_month: false,
      include_quarter: false,
      date_format: 'YYYY',
      is_default: false
    });
    setPreviewNumber('');
  };

  // Open create dialog
  const openCreateDialog = () => {
    resetForm();
    setCurrentScheme(null);
    setIsCreateDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (scheme) => {
    setFormData({
      scheme_name: scheme.scheme_name,
      prefix: scheme.prefix,
      suffix: scheme.suffix,
      sequence_length: scheme.sequence_length,
      current_number: scheme.current_number,
      reset_frequency: scheme.reset_frequency,
      include_year: scheme.include_year,
      include_month: scheme.include_month,
      include_quarter: scheme.include_quarter,
      date_format: scheme.date_format,
      is_default: scheme.is_default
    });
    setCurrentScheme(scheme);
    setIsEditDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create new scheme
  const handleCreateScheme = async () => {
    try {
      if (!formData.scheme_name.trim()) {
        toast({
          title: "Error",
          description: "Scheme name is required",
          variant: "destructive"
        });
        return;
      }

      const response = await apiClient(API_ENDPOINTS.numberingSchemes, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Numbering scheme created successfully",
        });
        setIsCreateDialogOpen(false);
        resetForm();
        await loadSchemes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create scheme",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating scheme:', error);
      toast({
        title: "Error",
        description: "Failed to create scheme",
        variant: "destructive"
      });
    }
  };

  // Update existing scheme
  const handleUpdateScheme = async () => {
    try {
      const response = await apiClient(API_ENDPOINTS.numberingScheme(currentScheme.id), {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Numbering scheme updated successfully",
        });
        setIsEditDialogOpen(false);
        setCurrentScheme(null);
        resetForm();
        await loadSchemes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update scheme",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating scheme:', error);
      toast({
        title: "Error",
        description: "Failed to update scheme",
        variant: "destructive"
      });
    }
  };

  // Delete scheme
  const handleDeleteScheme = async (schemeId) => {
    if (!confirm('Are you sure you want to delete this numbering scheme?')) return;

    try {
      const response = await apiClient(API_ENDPOINTS.numberingScheme(schemeId), {
        method: 'DELETE'
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Numbering scheme deleted successfully",
        });
        await loadSchemes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete scheme",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting scheme:', error);
      toast({
        title: "Error",
        description: "Failed to delete scheme",
        variant: "destructive"
      });
    }
  };

  // Set default scheme
  const handleSetDefault = async (schemeId) => {
    try {
      const response = await apiClient(API_ENDPOINTS.numberingSchemeDefault(schemeId), {
        method: 'PUT'
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Default scheme updated successfully",
        });
        await loadSchemes();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to set default scheme",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error setting default scheme:', error);
      toast({
        title: "Error",
        description: "Failed to set default scheme",
        variant: "destructive"
      });
    }
  };

  // Render scheme card
  const renderSchemeCard = (scheme) => (
    <Card key={scheme.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CardTitle className="text-lg">{scheme.scheme_name}</CardTitle>
              {scheme.is_default && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
            <CardDescription>
              {scheme.pattern_preview}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {!scheme.is_default && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetDefault(scheme.id)}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                <Star className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(scheme)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteScheme(scheme.id)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Prefix:</span>
              <span className="ml-2 font-mono">{scheme.prefix || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Suffix:</span>
              <span className="ml-2 font-mono">{scheme.suffix || 'None'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Length:</span>
              <span className="ml-2">{scheme.sequence_length} digits</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Current:</span>
              <span className="ml-2">{scheme.current_number}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <Badge variant="outline" className="text-xs">
              {scheme.reset_frequency === 'never' ? 'No Reset' : `Reset ${scheme.reset_frequency}`}
            </Badge>
            <div className="flex space-x-1">
              {scheme.include_year && <Badge variant="secondary" className="text-xs">Year</Badge>}
              {scheme.include_month && <Badge variant="secondary" className="text-xs">Month</Badge>}
              {scheme.include_quarter && <Badge variant="secondary" className="text-xs">Quarter</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render form dialog
  const renderSchemeDialog = (isEdit = false) => (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? 'Edit Numbering Scheme' : 'Create New Numbering Scheme'}
        </DialogTitle>
        <DialogDescription>
          Configure your custom invoice numbering pattern with prefix, suffix, and sequence options.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <Label className="text-sm font-medium">Live Preview</Label>
          <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border text-lg font-mono text-center">
            {previewNumber || 'Enter details to see preview'}
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="scheme_name">Scheme Name</Label>
            <Input
              id="scheme_name"
              value={formData.scheme_name}
              onChange={(e) => handleInputChange('scheme_name', e.target.value)}
              placeholder="e.g., Standard Numbering, Project-Based, etc."
            />
          </div>
        </div>

        {/* Numbering Pattern */}
        <div className="space-y-4">
          <h4 className="font-medium">Numbering Pattern</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={formData.prefix}
                onChange={(e) => handleInputChange('prefix', e.target.value)}
                placeholder="e.g., INV, PROJ"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="suffix">Suffix</Label>
              <Input
                id="suffix"
                value={formData.suffix}
                onChange={(e) => handleInputChange('suffix', e.target.value)}
                placeholder="e.g., -USD, -FINAL"
                maxLength={10}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sequence_length">Sequence Length</Label>
              <Select value={formData.sequence_length.toString()} onValueChange={(value) => handleInputChange('sequence_length', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} digits</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="current_number">Starting Number</Label>
              <Input
                id="current_number"
                type="number"
                min="1"
                value={formData.current_number}
                onChange={(e) => handleInputChange('current_number', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        {/* Date Components */}
        <div className="space-y-4">
          <h4 className="font-medium">Date Components</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.include_year}
                onCheckedChange={(checked) => handleInputChange('include_year', checked)}
              />
              <Label>Include Year</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.include_month}
                onCheckedChange={(checked) => handleInputChange('include_month', checked)}
              />
              <Label>Include Month</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.include_quarter}
                onCheckedChange={(checked) => handleInputChange('include_quarter', checked)}
              />
              <Label>Include Quarter</Label>
            </div>
            {formData.include_year && (
              <div>
                <Label>Year Format</Label>
                <Select value={formData.date_format} onValueChange={(value) => handleInputChange('date_format', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY">Full Year (2024)</SelectItem>
                    <SelectItem value="YY">Short Year (24)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Reset Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Reset Options</h4>
          <div>
            <Label>Reset Frequency</Label>
            <Select value={formData.reset_frequency} onValueChange={(value) => handleInputChange('reset_frequency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never Reset</SelectItem>
                <SelectItem value="yearly">Reset Yearly</SelectItem>
                <SelectItem value="quarterly">Reset Quarterly</SelectItem>
                <SelectItem value="monthly">Reset Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Default Setting */}
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_default}
            onCheckedChange={(checked) => handleInputChange('is_default', checked)}
          />
          <Label>Set as default numbering scheme</Label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              if (isEdit) {
                setIsEditDialogOpen(false);
              } else {
                setIsCreateDialogOpen(false);
              }
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={isEdit ? handleUpdateScheme : handleCreateScheme}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEdit ? 'Update Scheme' : 'Create Scheme'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <DashboardLayout
      title="Invoice Numbering"
      description="Create and manage custom invoice numbering schemes"
      currentTab="numbering"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Numbering Schemes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Customize invoice numbering patterns for your business
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Scheme
              </Button>
            </DialogTrigger>
            {renderSchemeDialog(false)}
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading numbering schemes...</p>
          </div>
        ) : schemes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No numbering schemes found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first numbering scheme or initialize the default scheme.
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={initializeSchemes} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20">
                  Initialize Default Scheme
                </Button>
                <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scheme
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map(renderSchemeCard)}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {renderSchemeDialog(true)}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}