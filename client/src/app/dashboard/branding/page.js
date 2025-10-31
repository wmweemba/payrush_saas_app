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
      // First check if database tables exist
      console.log('Checking database tables...');
      const tableCheck = await apiClient('/api/branding/check-tables', { 
        method: 'GET'
      });
      console.log('Table check response:', tableCheck);
      
      if (!tableCheck.success) {
        console.error('Database tables missing:', tableCheck.error);
        toast({
          title: "Database Setup Required",
          description: "Please run migration 019_ensure_brand_assets_table.sql in Supabase",
          variant: "destructive"
        });
        return;
      }

      // Then initialize storage bucket
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
      if (error.message?.includes('brand_assets')) {
        toast({
          title: "Database Setup Required",
          description: "The brand_assets table is missing. Please run the database migration.",
          variant: "destructive"
        });
      }
    }
  };

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
      console.log('Loading assets from /api/branding/assets...');
      const response = await apiClient('/api/branding/assets', { method: 'GET' });
      console.log('Assets API response:', response);
      
      if (response.success) {
        console.log('Assets loaded successfully:', response.data);
        setAssets(response.data);
      } else {
        console.warn('Assets API returned unsuccessful response:', response);
        setAssets([]);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
      setAssets([]);
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading stats from /api/branding/stats...');
      const response = await apiClient('/api/branding/stats', { method: 'GET' });
      console.log('Stats API response:', response);
      
      if (response.success) {
        console.log('Stats loaded successfully:', response.data);
        setStats(response.data);
      } else {
        console.warn('Stats API returned unsuccessful response:', response);
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
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
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "File type not supported. Please upload images, PDF, or DOC files.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
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

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set isDragOver to false if we're leaving the drop zone entirely
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processSelectedFile(file);
    }
  };

  const handleUploadAsset = async () => {
    console.log('=== STARTING ASSET UPLOAD ===');
    console.log('Upload form state:', uploadForm);
    
    if (!uploadForm.file) {
      console.log('❌ No file selected');
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Creating FormData...');
      
      const formData = new FormData();
      formData.append('asset', uploadForm.file);
      formData.append('assetType', uploadForm.assetType);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('altText', uploadForm.altText);

      console.log('📝 FormData contents:');
      console.log('- File:', uploadForm.file.name, uploadForm.file.type, uploadForm.file.size);
      console.log('- Asset Type:', uploadForm.assetType);
      console.log('- Name:', uploadForm.name);
      console.log('- Description:', uploadForm.description);
      console.log('- Alt Text:', uploadForm.altText);

      console.log('🚀 Sending upload request to /api/branding/upload...');
      const response = await apiClient('/api/branding/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
        }
      });

      console.log('📥 Upload API response:', response);

      if (response.success) {
        console.log('✅ Upload successful, response data:', response.data);
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
        setIsDragOver(false);
        
        // Reset file input
        const fileInput = document.getElementById('assetFile');
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Reload data
        console.log('🔄 Reloading branding data after successful upload...');
        await loadBrandingData();
        await loadAssets();
        await loadStats();
        console.log('✅ Data reloaded after upload');
      } else {
        console.error('❌ Upload failed with response:', response);
        toast({
          title: "Error",
          description: response.error || "Failed to upload asset",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Upload error caught:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
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
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-lg border">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Professional Brand Identity</h2>
            <p className="text-gray-600 dark:text-gray-400">Create a professional brand identity for your invoices and business communications</p>
          </div>
          <Button 
            onClick={handleSaveBranding} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Save Changes
          </Button>
        </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_assets}</p>
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
          
          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
          
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-slate-800 h-12 p-1 rounded-lg border">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="colors"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <Palette className="w-4 h-4 mr-2" />
            Colors & Fonts
          </TabsTrigger>
          <TabsTrigger 
            value="assets"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-start">
                  <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">i</div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Two-step upload process</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Select your file and fill in the details, then click the upload button to save it to your brand library.
                    </p>
                  </div>
                </div>
              </div>
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
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="assetFile">Select File</Label>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Step 1 of 2</span>
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : uploadForm.file
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    id="assetFile"
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <label
                    htmlFor="assetFile"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadForm.file ? (
                      <>
                        <div className="w-8 h-8 mb-2 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-green-700 font-medium mb-1">
                          File selected successfully!
                        </p>
                        <p className="text-xs text-green-600">
                          Complete the form below, then click upload
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className={`w-8 h-8 mb-2 transition-colors ${
                          isDragOver ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium text-blue-600 hover:text-blue-500">
                            {isDragOver ? 'Drop file here' : 'Click to select file'}
                          </span> 
                          {!isDragOver && ' or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Images (PNG, JPG, SVG), PDF, DOC, DOCX. Max size: 10MB
                        </p>
                      </>
                    )}
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

              {/* Upload Progress Indicator */}
              {uploadForm.file && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Ready to upload</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Step 2 of 2</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Click the button below to complete the upload and add this asset to your brand library.
                  </p>
                  <Button 
                    onClick={handleUploadAsset} 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Complete Upload & Save Asset
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Show upload button in muted state when no file selected */}
              {!uploadForm.file && (
                <Button 
                  disabled={true}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select a file above to upload
                </Button>
              )}
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
                      
                      {asset.file_url && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(asset.file_url, '_blank')}
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
                              link.href = asset.file_url;
                              link.download = asset.file_name || asset.asset_name;
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