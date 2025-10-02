'use client';

import { useState } from 'react';
import { Copy, Star, Download, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TemplateLibrary({ 
  templates, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onSetDefault, 
  onPreview,
  loading = false 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
    if (onPreview) {
      onPreview(template);
    }
  };

  const getTemplateTypeColor = (type) => {
    const colors = {
      professional: 'bg-blue-100 text-blue-800',
      minimal: 'bg-gray-100 text-gray-800',
      modern: 'bg-purple-100 text-purple-800',
      classic: 'bg-green-100 text-green-800',
      custom: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || colors.custom;
  };

  const TemplateCard = ({ template }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{template.template_name}</CardTitle>
              {template.is_default && (
                <Badge variant="default" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
              {template.is_system_template && (
                <Badge variant="secondary" className="text-xs">System</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs capitalize ${getTemplateTypeColor(template.template_type)}`}
              >
                {template.template_type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Used {template.usage_count || 0} times
              </span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePreview(template)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {!template.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(template.id)}>
                  <Star className="w-4 h-4 mr-2" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.open(`/invoice-pdf-preview/${template.id}`, '_blank')}
                className="text-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample PDF
              </DropdownMenuItem>
              {!template.is_system_template && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(template.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {template.description && (
          <CardDescription className="text-sm">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Template preview placeholder */}
          <div 
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg h-40 flex items-center justify-center border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => handlePreview(template)}
          >
            <div className="text-center text-gray-500">
              <Eye className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm font-medium">Click to Preview</p>
              <p className="text-xs">See how your invoices will look</p>
            </div>
          </div>
          
          {/* Template colors preview */}
          {template.template_data?.colors && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Colors:</span>
              <div className="flex gap-1">
                {Object.entries(template.template_data.colors).slice(0, 4).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-4 h-4 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={`${key}: ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Template metadata */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
            {template.last_used_at && (
              <span>Last used {new Date(template.last_used_at).toLocaleDateString()}</span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(template)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePreview(template)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDuplicate(template.id)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gray-200 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded w-8"></div>
                <div className="h-8 bg-gray-200 rounded w-8"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.template_name} Preview
            </DialogTitle>
            <DialogDescription>
              Preview how your invoices will look with this template
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedTemplate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500 py-12">
                  <Eye className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Template Preview</p>
                  <p className="text-sm">
                    Full preview functionality coming soon...
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => onEdit(selectedTemplate)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Template
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}