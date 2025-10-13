'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Palette, 
  Image as ImageIcon, 
  Save, 
  Download, 
  Trash2, 
  Eye,
  RefreshCw,
  Settings,
  Zap,
  FileImage,
  Globe,
  Type,
  Paintbrush
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ColorPicker from '@/components/templates/ColorPicker';
import { apiClient } from '@/lib/apiConfig';
import DashboardLayout from '@/components/layout/DashboardLayout';

const BrandingPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState(null);
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
    apply_branding_to_emails: true
  });

  const [uploadForm, setUploadForm] = useState({
    file: null,
    assetType: 'logo',
    name: '',
    description: '',
    altText: ''
  });

  const [preview, setPreview] = useState(null);

  // Load branding data on component mount
  useEffect(() => {
    loadBrandingData();
    loadAssets();
    loadStats();
  }, []);

  const loadBrandingData = async () => {
    try {
      setLoading(true);
      console.log('Loading branding data from /api/branding...');
      
      // Check authentication before making API call
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check before API call:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      });
      
      const response = await apiClient('/api/branding', { method: 'GET' });
      console.log('Branding API response:', response);
      
      if (response.success) {
        const brandingData = response.data;
        console.log('Branding data loaded successfully:', brandingData);
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
          apply_branding_to_emails: brandingData.apply_branding_to_emails ?? true
        });
      } else {
        console.warn('Branding API returned unsuccessful response:', response);
        // Initialize with default values if API call is unsuccessful
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
          apply_branding_to_emails: true
        });
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Log the full error object to see what's missing
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Initialize with default values if API call fails
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
        apply_branding_to_emails: true
      });
      
      // Show user-friendly message
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
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient('/api/branding/stats', { method: 'GET' });
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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
      setUploadForm({
        ...uploadForm,
        file,
        name: uploadForm.name || file.name
      });

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      }
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
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
        }
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Asset uploaded successfully"
        });
        
        // Reset form
        setUploadForm({
          file: null,
          assetType: 'logo',
          name: '',
          description: '',
          altText: ''
        });
        setPreview(null);
        
        // Reload data
        loadBrandingData();
        loadAssets();
        loadStats();
      }
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast({
        title: "Error",
        description: "Failed to upload asset",
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
      <DashboardLayout
        title="Business Branding"
        description="Customize your brand identity and manage assets"
        currentTab="branding"
      >
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading branding...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Business Branding"
      description="Customize your brand identity and manage assets"
      currentTab="branding"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Create a professional brand identity for your invoices and business communications</p>
          </div>
          <Button 
            onClick={handleSaveBranding} 
            disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ImageIcon className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_assets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Download className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatFileSize(stats.total_storage_used)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Palette className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brand Colors</p>
                  <div className="flex space-x-1 mt-1">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300" 
                      style={{ backgroundColor: brandingForm.primary_color }}
                    />
                    <div 
                      className="w-4 h-4 rounded border border-gray-300" 
                      style={{ backgroundColor: brandingForm.secondary_color }}
                    />
                    <div 
                      className="w-4 h-4 rounded border border-gray-300" 
                      style={{ backgroundColor: brandingForm.accent_color }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-Apply</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {brandingForm.apply_branding_to_templates ? 'Templates ✓' : ''}
                    {brandingForm.apply_branding_to_templates && brandingForm.apply_branding_to_emails ? ' & ' : ''}
                    {brandingForm.apply_branding_to_emails ? 'Emails ✓' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="colors">Colors & Fonts</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Label htmlFor="altText">Alt Text (for images)</Label>
                <Input
                  id="altText"
                  value={uploadForm.altText}
                  onChange={(e) => setUploadForm({
                    ...uploadForm,
                    altText: e.target.value
                  })}
                  placeholder="Descriptive text for accessibility"
                />
              </div>
              
              <div>
                <Label htmlFor="assetFile">Select File</Label>
                <Input
                  id="assetFile"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx"
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: Images (PNG, JPG, SVG), PDF, DOC, DOCX. Max size: 10MB
                </p>
              </div>
              
              {preview && (
                <div>
                  <Label>Preview</Label>
                  <div className="mt-2 p-4 border border-gray-200 rounded-md">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-32 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleUploadAsset} 
                disabled={!uploadForm.file || loading}
                className="w-full"
              >
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload Asset
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
                  <p className="text-sm text-gray-400">Upload your logo, favicon, and other brand assets above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          {assetTypes.find(t => t.value === asset.asset_type)?.icon && 
                            React.createElement(assetTypes.find(t => t.value === asset.asset_type).icon, {
                              className: "w-5 h-5 text-gray-500 mr-2"
                            })
                          }
                          <Badge variant="secondary" className="text-xs">
                            {asset.asset_type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {asset.file_type && asset.file_type.startsWith('image/') && asset.url && (
                        <div className="mb-3">
                          <img 
                            src={asset.url} 
                            alt={asset.alt_text || asset.name}
                            className="w-full h-24 object-contain border border-gray-100 rounded bg-gray-50"
                          />
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-900 truncate">{asset.name}</h4>
                        {asset.description && (
                          <p className="text-sm text-gray-600 truncate">{asset.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(asset.file_size)}</span>
                          <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {asset.url && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(asset.url, '_blank')}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = asset.url;
                              link.download = asset.filename || asset.name;
                              link.click();
                            }}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
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
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
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
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Brand Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Brand Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-6"
                style={{
                  backgroundColor: brandingForm.background_color,
                  color: brandingForm.text_color,
                  fontFamily: brandingForm.primary_font
                }}
              >
                <div className="flex items-center mb-4">
                  {branding?.logo_url && (
                    <img 
                      src={branding.logo_url} 
                      alt="Logo" 
                      className="h-12 w-auto mr-4"
                    />
                  )}
                  <div>
                    <h3 
                      className="text-xl font-bold"
                      style={{
                        color: brandingForm.primary_color,
                        fontFamily: brandingForm.heading_font
                      }}
                    >
                      {brandingForm.company_name || 'Your Company Name'}
                    </h3>
                    {brandingForm.company_tagline && (
                      <p className="text-sm opacity-75">{brandingForm.company_tagline}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <div 
                      className="px-4 py-2 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: brandingForm.primary_color }}
                    >
                      Primary Button
                    </div>
                    <div 
                      className="px-4 py-2 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: brandingForm.secondary_color }}
                    >
                      Secondary Button
                    </div>
                    <div 
                      className="px-4 py-2 rounded text-white text-sm font-medium"
                      style={{ backgroundColor: brandingForm.accent_color }}
                    >
                      Accent Button
                    </div>
                  </div>
                  
                  <div className="border-t pt-3" style={{ borderColor: brandingForm.secondary_color + '40' }}>
                    <h4 
                      className="font-semibold mb-2"
                      style={{ 
                        color: brandingForm.primary_color,
                        fontFamily: brandingForm.heading_font
                      }}
                    >
                      Sample Invoice Header
                    </h4>
                    <p className="text-sm">
                      This is how your branding will appear in invoices and other documents.
                      The colors, fonts, and logo will be automatically applied across your templates.
                    </p>
                  </div>
                </div>
                
                {brandingForm.company_website && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: brandingForm.secondary_color + '40' }}>
                    <p className="text-sm">
                      Website: <span style={{ color: brandingForm.accent_color }}>{brandingForm.company_website}</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BrandingPage;