'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Edit, Copy, Trash2, Star, Download, Settings, Eye, Search, Filter, Upload, Palette, Image as ImageIcon, Save, RefreshCw, Zap, FileImage, Globe, Type, Paintbrush, Hash, Calendar, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, API_ENDPOINTS } from '@/lib/apiConfig';
import { useToast } from '@/hooks/use-toast';
import ColorPicker from '@/components/templates/ColorPicker';
import DashboardLayout from '@/components/layout/DashboardLayout';

// NumberingTabContent component extracted from NumberingSchemesPage
const NumberingTabContent = () => {
  const { toast } = useToast();
  
  // State management
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
      const response = await apiClient('/api/numbering-schemes');
      
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
      const response = await apiClient('/api/numbering-schemes/initialize', {
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

    const mockScheme = {
      ...formData,
      current_number: formData.current_number || 1
    };

    try {
      let preview = mockScheme.prefix || '';
      
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

      if (dateParts.length > 0) {
        if (preview) preview += '-';
        preview += dateParts.join('-');
      }

      const sequenceNumber = String(mockScheme.current_number).padStart(mockScheme.sequence_length, '0');
      if (preview) preview += '-';
      preview += sequenceNumber;

      if (mockScheme.suffix) {
        preview += mockScheme.suffix;
      }

      setPreviewNumber(preview);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewNumber('Error generating preview');
    }
  };

  useEffect(() => {
    updatePreview();
  }, [formData]);

  useEffect(() => {
    loadSchemes();
  }, []);

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

  const openCreateDialog = () => {
    resetForm();
    setCurrentScheme(null);
    setIsCreateDialogOpen(true);
  };

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

      const response = await apiClient('/api/numbering-schemes', {
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

  const handleUpdateScheme = async () => {
    try {
      const response = await apiClient(`/api/numbering-schemes/${currentScheme.id}`, {
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

  const handleDeleteScheme = async (schemeId) => {
    if (!confirm('Are you sure you want to delete this numbering scheme?')) return;

    try {
      const response = await apiClient(`/api/numbering-schemes/${schemeId}`, {
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

  const handleSetDefault = async (schemeId) => {
    try {
      const response = await apiClient(`/api/numbering-schemes/${schemeId}/default`, {
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

  const renderSchemeCard = (scheme) => (
    <Card key={scheme.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
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
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <SelectItem key={num} value={num.toString()} className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">{num} digits</SelectItem>
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
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Switch
                checked={formData.include_year}
                onCheckedChange={(checked) => handleInputChange('include_year', checked)}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label className="cursor-pointer flex-1" onClick={() => handleInputChange('include_year', !formData.include_year)}>
                Include Year
                <span className="text-sm text-gray-500 dark:text-gray-400 block">Add current year to invoice number</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Switch
                checked={formData.include_month}
                onCheckedChange={(checked) => handleInputChange('include_month', checked)}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label className="cursor-pointer flex-1" onClick={() => handleInputChange('include_month', !formData.include_month)}>
                Include Month
                <span className="text-sm text-gray-500 dark:text-gray-400 block">Add current month to invoice number</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Switch
                checked={formData.include_quarter}
                onCheckedChange={(checked) => handleInputChange('include_quarter', checked)}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label className="cursor-pointer flex-1" onClick={() => handleInputChange('include_quarter', !formData.include_quarter)}>
                Include Quarter
                <span className="text-sm text-gray-500 dark:text-gray-400 block">Add current quarter to invoice number</span>
              </Label>
            </div>
            {formData.include_year && (
              <div>
                <Label>Year Format</Label>
                <Select value={formData.date_format} onValueChange={(value) => handleInputChange('date_format', value)}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                    <SelectItem value="YYYY" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Full Year (2024)</SelectItem>
                    <SelectItem value="YY" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Short Year (24)</SelectItem>
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
              <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                <SelectItem value="never" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Never Reset</SelectItem>
                <SelectItem value="yearly" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Reset Yearly</SelectItem>
                <SelectItem value="quarterly" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Reset Quarterly</SelectItem>
                <SelectItem value="monthly" className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer">Reset Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Default Setting */}
        <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Switch
            checked={formData.is_default}
            onCheckedChange={(checked) => handleInputChange('is_default', checked)}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
          />
          <Label className="cursor-pointer flex-1" onClick={() => handleInputChange('is_default', !formData.is_default)}>
            Set as default numbering scheme
            <span className="text-sm text-gray-500 dark:text-gray-400 block">This scheme will be used for new invoices by default</span>
          </Label>
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
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isEdit ? 'Update Scheme' : 'Create Scheme'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-lg border">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Invoice Numbering Schemes</h3>
          <p className="text-gray-600 dark:text-gray-400">Customize invoice numbering patterns for your business</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
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
              <Button onClick={initializeSchemes} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20">
                Initialize Default Scheme
              </Button>
              <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700 text-white">
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
  );
};

// BrandingTabContent component extracted from BrandingPage
const BrandingTabContent = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState(null);
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Form states
  const [brandingForm, setBrandingForm] = useState({
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    text_color: '#1f2937',
    background_color: '#ffffff',
    primary_font: 'Inter, sans-serif',
    heading_font: 'Inter, sans-serif',
    company_name: '',
    company_tagline: '',
    company_website: '',
    apply_branding_to_templates: true,
    apply_branding_to_emails: true,
    // Payment Information Fields
    bank_name: '',
    account_number: '',
    routing_number: '',
    account_holder_name: '',
    payment_instructions: '',
    preferred_payment_methods: []
  });

  const [uploadForm, setUploadForm] = useState({
    file: null,
    assetType: 'logo',
    name: '',
    description: '',
    altText: ''
  });

  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load branding data on component mount
  useEffect(() => {
    loadBrandingData();
    loadAssets();
    loadStats();
    initializeStorage();
  }, []);

  const initializeStorage = async () => {
    try {
      console.log('Initializing storage bucket...');
      const response = await apiClient('/api/branding/initialize-storage', { 
        method: 'POST'
      });
      console.log('Storage initialization response:', response);
      
      if (response.success) {
        console.log('Storage initialized successfully');
      }
    } catch (error) {
      console.warn('Initialization failed:', error);
    }
  };

  const loadBrandingData = async () => {
    try {
      setLoading(true);
      const response = await apiClient('/api/branding', { method: 'GET' });
      
      if (response.success) {
        const brandingData = response.data;
        setBranding(brandingData);
        setBrandingForm({
          primary_color: brandingData.primary_color || '#2563eb',
          secondary_color: brandingData.secondary_color || '#64748b',
          accent_color: brandingData.accent_color || '#10b981',
          text_color: brandingData.text_color || '#1f2937',
          background_color: brandingData.background_color || '#ffffff',
          primary_font: brandingData.primary_font || 'Inter, sans-serif',
          heading_font: brandingData.heading_font || 'Inter, sans-serif',
          company_name: brandingData.company_name || '',
          company_tagline: brandingData.company_tagline || '',
          company_website: brandingData.company_website || '',
          apply_branding_to_templates: brandingData.apply_branding_to_templates ?? true,
          apply_branding_to_emails: brandingData.apply_branding_to_emails ?? true,
          // Payment Information Fields
          bank_name: brandingData.bank_name || '',
          account_number: brandingData.account_number || '',
          routing_number: brandingData.routing_number || '',
          account_holder_name: brandingData.account_holder_name || '',
          payment_instructions: brandingData.payment_instructions || '',
          preferred_payment_methods: brandingData.preferred_payment_methods || []
        });
      } else {
        setBrandingForm({
          primary_color: '#2563eb',
          secondary_color: '#64748b',
          accent_color: '#10b981',
          text_color: '#1f2937',
          background_color: '#ffffff',
          primary_font: 'Inter, sans-serif',
          heading_font: 'Inter, sans-serif',
          company_name: '',
          company_tagline: '',
          company_website: '',
          apply_branding_to_templates: true,
          apply_branding_to_emails: true,
          // Payment Information Fields
          bank_name: '',
          account_number: '',
          routing_number: '',
          account_holder_name: '',
          payment_instructions: '',
          preferred_payment_methods: []
        });
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      
      setBrandingForm({
        primary_color: '#2563eb',
        secondary_color: '#64748b',
        accent_color: '#10b981',
        text_color: '#1f2937',
        background_color: '#ffffff',
        primary_font: 'Inter, sans-serif',
        heading_font: 'Inter, sans-serif',
        company_name: '',
        company_tagline: '',
        company_website: '',
        apply_branding_to_templates: true,
        apply_branding_to_emails: true,
        // Payment Information Fields
        bank_name: '',
        account_number: '',
        routing_number: '',
        account_holder_name: '',
        payment_instructions: '',
        preferred_payment_methods: []
      });
      
      toast({
        title: "Error",
        description: "Failed to load branding information. Using defaults.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const response = await apiClient('/api/branding/assets', { method: 'GET' });
      
      if (response.success) {
        setAssets(response.data);
      } else {
        setAssets([]);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      setAssets([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient('/api/branding/stats', { method: 'GET' });
      
      if (response.success) {
        setStats(response.data);
      } else {
        setStats({
          total_assets: 0,
          total_storage_used: 0,
          templatesByType: {},
          defaultTemplate: null,
          mostUsedTemplate: null
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        total_assets: 0,
        total_storage_used: 0,
        templatesByType: {},
        defaultTemplate: null,
        mostUsedTemplate: null
      });
    }
  };

  const handleSaveBranding = async () => {
    try {
      setSaving(true);
      const response = await apiClient('/api/branding', { 
        method: 'PUT',
        body: JSON.stringify(brandingForm)
      });
      
      if (response.success) {
        setBranding(response.data);
        toast({
          title: "Success",
          description: "Branding updated successfully"
        });
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: "Failed to save branding",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "File type not supported. Please upload images or PDF files.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size too large. Please upload files smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadForm({
      ...uploadForm,
      file,
      name: uploadForm.name || file.name
    });

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUploadAsset = async () => {
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('asset', uploadForm.file);
      formData.append('assetType', uploadForm.assetType);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('altText', uploadForm.altText);

      const response = await apiClient('/api/branding/upload', {
        method: 'POST',
        body: formData
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Asset uploaded successfully"
        });
        
        setUploadForm({
          file: null,
          assetType: 'logo',
          name: '',
          description: '',
          altText: ''
        });
        setPreview(null);
        
        const fileInput = document.getElementById('assetFile');
        if (fileInput) {
          fileInput.value = '';
        }
        
        await loadBrandingData();
        await loadAssets();
        await loadStats();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to upload asset",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload asset: " + (error.message || "Unknown error"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      const response = await apiClient(`/api/branding/assets/${assetId}`, { method: 'DELETE' });
      if (response.success) {
        toast({
          title: "Success",
          description: "Asset deleted successfully"
        });
        loadAssets();
        loadStats();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const assetTypes = [
    { value: 'logo', label: 'Logo', icon: ImageIcon },
    { value: 'favicon', label: 'Favicon', icon: Globe },
    { value: 'letterhead', label: 'Letterhead', icon: FileImage },
    { value: 'signature', label: 'Signature', icon: Type },
    { value: 'background', label: 'Background', icon: Paintbrush }
  ];

  if (loading && !branding) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading branding...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-lg border">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Business Branding</h3>
          <p className="text-gray-600 dark:text-gray-400">Customize your brand identity for templates and communications</p>
        </div>
        <Button 
          onClick={handleSaveBranding} 
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_assets || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.total_storage_used ? formatFileSize(stats.total_storage_used) : '0 Bytes'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-pink-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <Palette className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brand Colors</p>
                  <div className="flex space-x-1 mt-1">
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: brandingForm.primary_color }}
                    />
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: brandingForm.secondary_color }}
                    />
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                      style={{ backgroundColor: brandingForm.accent_color }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-Apply</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {[
                      brandingForm.apply_branding_to_templates && 'Templates',
                      brandingForm.apply_branding_to_emails && 'Emails'
                    ].filter(Boolean).join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-tabs for Branding */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4 bg-purple-100 dark:bg-slate-800 h-12 p-1 rounded-lg border">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-purple-700 dark:text-gray-300 hover:text-purple-900 dark:hover:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="colors"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-purple-700 dark:text-gray-300 hover:text-purple-900 dark:hover:text-white transition-all duration-200"
          >
            <Palette className="w-4 h-4 mr-2" />
            Colors & Fonts
          </TabsTrigger>
          <TabsTrigger 
            value="assets"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-purple-700 dark:text-gray-300 hover:text-purple-900 dark:hover:text-white transition-all duration-200"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-purple-700 dark:text-gray-300 hover:text-purple-900 dark:hover:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={brandingForm.company_name}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      company_name: e.target.value
                    })}
                    placeholder="Your Company Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company_website">Website</Label>
                  <Input
                    id="company_website"
                    value={brandingForm.company_website}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      company_website: e.target.value
                    })}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="company_tagline">Tagline</Label>
                <Textarea
                  id="company_tagline"
                  value={brandingForm.company_tagline}
                  onChange={(e) => setBrandingForm({
                    ...brandingForm,
                    company_tagline: e.target.value
                  })}
                  placeholder="Your company tagline or motto"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Logo Display */}
          {branding?.logo_url && (
            <Card>
              <CardHeader>
                <CardTitle>Current Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img 
                    src={branding.logo_url} 
                    alt="Current Logo" 
                    className="h-16 w-auto object-contain border border-gray-200 rounded p-2"
                  />
                  <div>
                    <p className="text-sm text-gray-600">
                      {branding.logo_filename && `File: ${branding.logo_filename}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {branding.logo_size && `Size: ${formatFileSize(branding.logo_size)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          {/* Color Scheme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Brand Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label>Primary Color</Label>
                  <ColorPicker
                    color={brandingForm.primary_color}
                    onChange={(color) => setBrandingForm({
                      ...brandingForm,
                      primary_color: color
                    })}
                  />
                </div>
                
                <div>
                  <Label>Secondary Color</Label>
                  <ColorPicker
                    color={brandingForm.secondary_color}
                    onChange={(color) => setBrandingForm({
                      ...brandingForm,
                      secondary_color: color
                    })}
                  />
                </div>
                
                <div>
                  <Label>Accent Color</Label>
                  <ColorPicker
                    color={brandingForm.accent_color}
                    onChange={(color) => setBrandingForm({
                      ...brandingForm,
                      accent_color: color
                    })}
                  />
                </div>
                
                <div>
                  <Label>Text Color</Label>
                  <ColorPicker
                    color={brandingForm.text_color}
                    onChange={(color) => setBrandingForm({
                      ...brandingForm,
                      text_color: color
                    })}
                  />
                </div>
                
                <div>
                  <Label>Background Color</Label>
                  <ColorPicker
                    color={brandingForm.background_color}
                    onChange={(color) => setBrandingForm({
                      ...brandingForm,
                      background_color: color
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Type className="w-5 h-5 mr-2" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_font">Primary Font</Label>
                  <Input
                    id="primary_font"
                    value={brandingForm.primary_font}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      primary_font: e.target.value
                    })}
                    placeholder="Inter, sans-serif"
                  />
                </div>
                
                <div>
                  <Label htmlFor="heading_font">Heading Font</Label>
                  <Input
                    id="heading_font"
                    value={brandingForm.heading_font}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      heading_font: e.target.value
                    })}
                    placeholder="Inter, sans-serif"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          {/* Asset Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assetType">Asset Type</Label>
                  <select
                    id="assetType"
                    value={uploadForm.assetType}
                    onChange={(e) => setUploadForm({
                      ...uploadForm,
                      assetType: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {assetTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="assetName">Asset Name</Label>
                  <Input
                    id="assetName"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({
                      ...uploadForm,
                      name: e.target.value
                    })}
                    placeholder="Enter asset name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="assetDescription">Description</Label>
                <Textarea
                  id="assetDescription"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({
                    ...uploadForm,
                    description: e.target.value
                  })}
                  placeholder="Describe this asset"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="assetFile">Select File</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors">
                  <input
                    id="assetFile"
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <label htmlFor="assetFile" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-purple-600 hover:text-purple-500">Click to select file</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">Images (PNG, JPG, SVG) or PDF. Max size: 10MB</p>
                  </label>
                </div>
                
                {uploadForm.file && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{uploadForm.file.name}</span>
                      <span className="text-gray-500">({formatFileSize(uploadForm.file.size)})</span>
                    </div>
                  </div>
                )}
              </div>
              
              {preview && (
                <div>
                  <Label>Preview</Label>
                  <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-32 w-auto object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleUploadAsset} 
                disabled={loading || !uploadForm.file}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Asset
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Assets Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Brand Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No brand assets uploaded yet</p>
                  <p className="text-sm text-gray-400">Upload your logo and other brand assets above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {asset.asset_type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {asset.file_type && asset.file_type.startsWith('image/') && asset.file_url && (
                        <div className="mb-3">
                          <img 
                            src={asset.file_url} 
                            alt={asset.alt_text || asset.asset_name}
                            className="w-full h-24 object-contain border border-gray-100 rounded bg-gray-50"
                          />
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-900 truncate">{asset.asset_name}</h4>
                        {asset.description && (
                          <p className="text-sm text-gray-600 truncate">{asset.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(asset.file_size)}</span>
                          <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Branding Application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Apply branding to invoice templates</Label>
                  <p className="text-sm text-gray-600">Automatically apply your brand colors and logo to invoice templates</p>
                </div>
                <input
                  type="checkbox"
                  checked={brandingForm.apply_branding_to_templates}
                  onChange={(e) => setBrandingForm({
                    ...brandingForm,
                    apply_branding_to_templates: e.target.checked
                  })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Apply branding to email communications</Label>
                  <p className="text-sm text-gray-600">Use your brand colors and logo in automated email communications</p>
                </div>
                <input
                  type="checkbox"
                  checked={brandingForm.apply_branding_to_emails}
                  onChange={(e) => setBrandingForm({
                    ...brandingForm,
                    apply_branding_to_emails: e.target.checked
                  })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Information
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Configure payment details to include in invoice emails</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={brandingForm.bank_name}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      bank_name: e.target.value
                    })}
                    placeholder="Your Bank Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                  <Input
                    id="account_holder_name"
                    value={brandingForm.account_holder_name}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      account_holder_name: e.target.value
                    })}
                    placeholder="Account Holder Name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={brandingForm.account_number}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      account_number: e.target.value
                    })}
                    placeholder="Account Number"
                    type="password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="routing_number">Routing Number</Label>
                  <Input
                    id="routing_number"
                    value={brandingForm.routing_number}
                    onChange={(e) => setBrandingForm({
                      ...brandingForm,
                      routing_number: e.target.value
                    })}
                    placeholder="Routing Number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="payment_instructions">Payment Instructions</Label>
                <Textarea
                  id="payment_instructions"
                  value={brandingForm.payment_instructions}
                  onChange={(e) => setBrandingForm({
                    ...brandingForm,
                    payment_instructions: e.target.value
                  })}
                  placeholder="Additional payment instructions for your clients..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL parameter for tab, default to 'templates'
    const tabParam = searchParams?.get('tab');
    return ['templates', 'branding', 'numbering'].includes(tabParam) ? tabParam : 'templates';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [templateStats, setTemplateStats] = useState(null);
  const { toast } = useToast();

  // Handle URL parameter changes
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && ['templates', 'branding', 'numbering'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
          {/* Template preview with actual design preview */}
          <div className="bg-white rounded-lg h-32 border border-gray-200 overflow-hidden group-hover:border-blue-300 transition-colors relative">
            {/* Mini preview based on template type */}
            {template.template_type === 'professional' && (
              <div className="h-full relative">
                <div className="bg-blue-600 h-6 w-full"></div>
                <div className="p-2 space-y-1">
                  <div className="flex justify-between">
                    <div className="bg-gray-300 h-2 w-16 rounded"></div>
                    <div className="bg-gray-300 h-2 w-12 rounded"></div>
                  </div>
                  <div className="bg-gray-200 h-1 w-full rounded"></div>
                  <div className="bg-gray-200 h-1 w-3/4 rounded"></div>
                  <div className="bg-gray-200 h-1 w-1/2 rounded"></div>
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">TOTAL</div>
                </div>
              </div>
            )}
            {template.template_type === 'minimal' && (
              <div className="h-full p-3 space-y-2 relative">
                <div className="border-b border-gray-300 pb-1">
                  <div className="flex justify-between">
                    <div className="bg-gray-400 h-2 w-20 rounded"></div>
                    <div className="bg-gray-300 h-1 w-10 rounded"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="bg-gray-200 h-1 w-full rounded"></div>
                  <div className="bg-gray-200 h-1 w-4/5 rounded"></div>
                  <div className="bg-gray-200 h-1 w-3/5 rounded"></div>
                </div>
                <div className="absolute bottom-2 right-2 text-xs font-mono">$0.00</div>
              </div>
            )}
            {template.template_type === 'modern' && (
              <div className="h-full relative">
                <div className="bg-purple-600 h-8 w-full relative">
                  <div className="absolute top-1 right-1 bg-purple-400 w-3 h-3 rounded-full"></div>
                  <div className="absolute top-2 right-6 bg-purple-300 w-2 h-2"></div>
                </div>
                <div className="p-2 space-y-1">
                  <div className="flex justify-between">
                    <div className="bg-gray-300 h-2 w-18 rounded"></div>
                    <div className="bg-purple-300 h-2 w-14 rounded"></div>
                  </div>
                  <div className="bg-gray-200 h-1 w-full rounded"></div>
                  <div className="bg-gray-200 h-1 w-4/5 rounded"></div>
                  <div className="absolute bottom-2 right-2 bg-purple-600 text-white text-xs px-1 py-0.5 rounded font-bold">TOTAL</div>
                </div>
              </div>
            )}
            {template.template_type === 'classic' && (
              <div className="h-full border-2 border-gray-400 relative">
                <div className="border border-gray-300 m-1 h-[calc(100%-8px)] p-2">
                  <div className="border-b-2 border-gray-600 pb-1 mb-1">
                    <div className="bg-gray-600 h-2 w-20 rounded"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="grid grid-cols-4 gap-1">
                      <div className="bg-gray-300 h-1 rounded"></div>
                      <div className="bg-gray-300 h-1 rounded"></div>
                      <div className="bg-gray-300 h-1 rounded"></div>
                      <div className="bg-gray-300 h-1 rounded"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <div className="bg-gray-200 h-1 rounded"></div>
                      <div className="bg-gray-200 h-1 rounded"></div>
                      <div className="bg-gray-200 h-1 rounded"></div>
                      <div className="bg-gray-200 h-1 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-gray-600 text-white text-xs px-1 py-0.5">TOTAL</div>
                </div>
              </div>
            )}
            {!['professional', 'minimal', 'modern', 'classic'].includes(template.template_type) && (
              <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <div>
                  <Eye className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs font-medium">Custom Template</p>
                </div>
              </div>
            )}
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
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              console.log('🧪 Testing static templates...');
              const { testTemplateGeneration } = await import('@/lib/pdf/templates');
              await testTemplateGeneration();
            }} 
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400"
          >
            🧪 Test Templates
          </Button>
          {/* Custom template creation is still available */}
          <Button 
            onClick={() => window.open('/dashboard/templates/editor/new', '_blank')} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Custom Template
          </Button>
        </div>
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
                        Create Custom Template
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => window.open('/dashboard/templates/editor/new', '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom Template
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
          <BrandingTabContent />
        </TabsContent>

        <TabsContent value="numbering">
          <NumberingTabContent />
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}