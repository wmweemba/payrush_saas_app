'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft, Eye, Download, Undo, Redo, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from '@/lib/apiConfig';
import TemplateCustomizer from '@/components/templates/TemplateCustomizer';
import TemplatePreview from '@/components/templates/TemplatePreview';

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id;
  const isNewTemplate = templateId === 'new';

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(!isNewTemplate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('design');

  // Template form data
  const [templateData, setTemplateData] = useState({
    template_name: '',
    description: '',
    template_type: 'custom',
    template_data: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        text: '#1f2937',
        accent: '#f8fafc'
      },
      fonts: {
        heading: { 
          family: 'Arial, sans-serif',
          size: 24, 
          weight: 'bold',
          lineHeight: 1.2,
          letterSpacing: 0,
          textTransform: 'none'
        },
        subheading: { 
          family: 'Arial, sans-serif',
          size: 12, 
          weight: 'bold',
          lineHeight: 1.3,
          letterSpacing: 0,
          textTransform: 'none'
        },
        body: { 
          family: 'Arial, sans-serif',
          size: 10, 
          weight: 'normal',
          lineHeight: 1.4,
          letterSpacing: 0,
          textTransform: 'none'
        },
        small: { 
          family: 'Arial, sans-serif',
          size: 8, 
          weight: 'normal',
          lineHeight: 1.3,
          letterSpacing: 0,
          textTransform: 'none'
        }
      },
      layout: {
        headerHeight: 40,
        marginX: 20,
        marginY: 20
      }
    }
  });

  // Sample invoice data for preview
  const sampleInvoice = {
    id: 'INV-001',
    customer_name: 'Sample Customer',
    customer_email: 'customer@example.com',
    amount: 1500.00,
    currency: 'USD',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    status: 'sent',
    line_items: [
      {
        description: 'Professional Services',
        quantity: 10,
        unit_price: 100.00,
        total: 1000.00
      },
      {
        description: 'Consultation',
        quantity: 5,
        unit_price: 100.00,
        total: 500.00
      }
    ]
  };

  const sampleProfile = {
    business_name: 'Your Business Name',
    name: 'John Smith',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, City, State 12345',
    website: 'www.yourbusiness.com'
  };

  // Fetch template if editing existing
  useEffect(() => {
    if (!isNewTemplate) {
      fetchTemplate();
    }
  }, [templateId, isNewTemplate]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/api/templates/${templateId}`);
      
      if (response.success) {
        setTemplate(response.data);
        setTemplateData({
          template_name: response.data.template_name,
          description: response.data.description || '',
          template_type: response.data.template_type,
          template_data: response.data.template_data
        });
      } else {
        setError('Template not found');
      }
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  // Save template
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!templateData.template_name.trim()) {
        setError('Template name is required');
        return;
      }

      const endpoint = isNewTemplate 
        ? '/api/templates'
        : `/api/templates/${templateId}`;
      
      const method = isNewTemplate ? 'POST' : 'PUT';

      const response = await apiClient(endpoint, {
        method,
        body: JSON.stringify(templateData)
      });

      if (response.success) {
        setHasUnsavedChanges(false);
        if (isNewTemplate) {
          // Redirect to edit mode for the new template
          router.push(`/dashboard/templates/editor/${response.data.id}`);
        } else {
          setTemplate(response.data);
        }
      } else {
        setError(response.error || 'Failed to save template');
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Handle template data changes
  const handleTemplateDataChange = (newData) => {
    setTemplateData(prev => ({
      ...prev,
      template_data: {
        ...prev.template_data,
        ...newData
      }
    }));
    setHasUnsavedChanges(true);
  };

  // Handle basic info changes
  const handleBasicInfoChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/templates')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNewTemplate ? 'Create Template' : `Edit ${template?.template_name}`}
            </h1>
            <p className="text-muted-foreground">
              {isNewTemplate 
                ? 'Design a new invoice template for your business'
                : 'Customize your invoice template design and layout'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('preview')}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasUnsavedChanges}
            className="min-w-[100px]"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Editor */}
        <Card className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Template Editor</CardTitle>
            <CardDescription>
              Customize your template design and layout
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <div className="mt-4 h-full overflow-y-auto">
                <TabsContent value="design" className="space-y-4 mt-0">
                  <TemplateCustomizer
                    templateData={templateData.template_data}
                    onChange={handleTemplateDataChange}
                  />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template_name">Template Name</Label>
                      <Input
                        id="template_name"
                        value={templateData.template_name}
                        onChange={(e) => handleBasicInfoChange('template_name', e.target.value)}
                        placeholder="Enter template name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template_type">Template Type</Label>
                      <Select 
                        value={templateData.template_type} 
                        onValueChange={(value) => handleBasicInfoChange('template_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={templateData.description}
                        onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                        placeholder="Describe this template"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-0 h-full">
                  <div className="lg:hidden">
                    <TemplatePreview
                      templateData={templateData.template_data}
                      invoiceData={sampleInvoice}
                      profileData={sampleProfile}
                    />
                  </div>
                  <div className="hidden lg:block text-center py-8 text-muted-foreground">
                    <p>Preview is shown in the right panel on larger screens</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Panel - Preview */}
        <Card className="hidden lg:flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              See how your template will look on invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <TemplatePreview
              templateData={templateData.template_data}
              invoiceData={sampleInvoice}
              profileData={sampleProfile}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}