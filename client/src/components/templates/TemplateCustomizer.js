'use client';

import { useState } from 'react';
import { Palette, Type, Layout, Sliders } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import ColorPicker from './ColorPicker';
import FontSelector from './FontSelector';

export default function TemplateCustomizer({ templateData, onChange }) {
  const [activeSection, setActiveSection] = useState('colors');

  // Handle color changes
  const handleColorChange = (colorKey, color) => {
    onChange({
      colors: {
        ...templateData.colors,
        [colorKey]: color
      }
    });
  };

  // Handle font changes
  const handleFontChange = (fontKey, property, value) => {
    // If value is an object, it's a complete font config replacement
    if (typeof value === 'object' && value !== null) {
      onChange({
        fonts: {
          ...templateData.fonts,
          [fontKey]: value
        }
      });
    } else {
      // Individual property update
      onChange({
        fonts: {
          ...templateData.fonts,
          [fontKey]: {
            ...templateData.fonts[fontKey],
            [property]: value
          }
        }
      });
    }
  };

  // Handle layout changes
  const handleLayoutChange = (property, value) => {
    onChange({
      layout: {
        ...templateData.layout,
        [property]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="fonts" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Color Scheme</CardTitle>
              <CardDescription>
                Customize the colors used throughout your template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <ColorPicker
                    color={templateData.colors.primary}
                    onChange={(color) => handleColorChange('primary', color)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Main brand color for headers and highlights
                  </p>
                </div>
                
                <div>
                  <Label>Secondary Color</Label>
                  <ColorPicker
                    color={templateData.colors.secondary}
                    onChange={(color) => handleColorChange('secondary', color)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supporting color for accents and borders
                  </p>
                </div>
                
                <div>
                  <Label>Text Color</Label>
                  <ColorPicker
                    color={templateData.colors.text}
                    onChange={(color) => handleColorChange('text', color)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Main text color for content
                  </p>
                </div>
                
                <div>
                  <Label>Accent Color</Label>
                  <ColorPicker
                    color={templateData.colors.accent}
                    onChange={(color) => handleColorChange('accent', color)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Background and table colors
                  </p>
                </div>
              </div>

              {/* Preset color schemes */}
              <div>
                <Label className="text-sm font-medium">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => onChange({
                      colors: {
                        primary: '#2563eb',
                        secondary: '#64748b',
                        text: '#1f2937',
                        accent: '#f8fafc'
                      }
                    })}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2563eb' }}></div>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#64748b' }}></div>
                    </div>
                    <span className="text-sm">Professional</span>
                  </button>
                  
                  <button
                    onClick={() => onChange({
                      colors: {
                        primary: '#7c3aed',
                        secondary: '#a855f7',
                        text: '#374151',
                        accent: '#f3f4f6'
                      }
                    })}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7c3aed' }}></div>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#a855f7' }}></div>
                    </div>
                    <span className="text-sm">Modern</span>
                  </button>
                  
                  <button
                    onClick={() => onChange({
                      colors: {
                        primary: '#000000',
                        secondary: '#666666',
                        text: '#333333',
                        accent: '#f9f9f9'
                      }
                    })}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#000000' }}></div>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#666666' }}></div>
                    </div>
                    <span className="text-sm">Minimal</span>
                  </button>
                  
                  <button
                    onClick={() => onChange({
                      colors: {
                        primary: '#1f2937',
                        secondary: '#4b5563',
                        text: '#374151',
                        accent: '#f3f4f6'
                      }
                    })}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1f2937' }}></div>
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#4b5563' }}></div>
                    </div>
                    <span className="text-sm">Classic</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4 mt-4">
          <div className="space-y-4">
            {/* Font Selectors for each text element */}
            <FontSelector
              fontConfig={templateData.fonts.heading}
              onChange={(newConfig) => handleFontChange('heading', null, newConfig)}
              elementType="heading"
              showPresets={true}
            />
            
            <FontSelector
              fontConfig={templateData.fonts.subheading}
              onChange={(newConfig) => handleFontChange('subheading', null, newConfig)}
              elementType="subheading"
              showPresets={false}
            />
            
            <FontSelector
              fontConfig={templateData.fonts.body}
              onChange={(newConfig) => handleFontChange('body', null, newConfig)}
              elementType="body"
              showPresets={false}
            />
            
            <FontSelector
              fontConfig={templateData.fonts.small}
              onChange={(newConfig) => handleFontChange('small', null, newConfig)}
              elementType="small"
              showPresets={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layout Settings</CardTitle>
              <CardDescription>
                Adjust spacing, margins, and layout dimensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header Height */}
              <div>
                <Label htmlFor="header-height">Header Height</Label>
                <Slider
                  id="header-height"
                  min={20}
                  max={80}
                  step={5}
                  value={[templateData.layout.headerHeight]}
                  onValueChange={([value]) => handleLayoutChange('headerHeight', value)}
                  className="mt-2"
                />
                <div className="text-xs text-center mt-1">{templateData.layout.headerHeight}px</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Height of the header section with business information
                </p>
              </div>

              {/* Horizontal Margins */}
              <div>
                <Label htmlFor="margin-x">Horizontal Margins</Label>
                <Slider
                  id="margin-x"
                  min={10}
                  max={50}
                  step={5}
                  value={[templateData.layout.marginX]}
                  onValueChange={([value]) => handleLayoutChange('marginX', value)}
                  className="mt-2"
                />
                <div className="text-xs text-center mt-1">{templateData.layout.marginX}px</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Left and right margins for the content
                </p>
              </div>

              {/* Vertical Margins */}
              <div>
                <Label htmlFor="margin-y">Vertical Margins</Label>
                <Slider
                  id="margin-y"
                  min={10}
                  max={50}
                  step={5}
                  value={[templateData.layout.marginY]}
                  onValueChange={([value]) => handleLayoutChange('marginY', value)}
                  className="mt-2"
                />
                <div className="text-xs text-center mt-1">{templateData.layout.marginY}px</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Top and bottom margins for the content
                </p>
              </div>

              {/* Layout Preview */}
              <div>
                <Label>Layout Preview</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  <div 
                    className="border border-gray-300 bg-white mx-auto"
                    style={{
                      width: '120px',
                      height: '160px',
                      padding: `${templateData.layout.marginY * 0.3}px ${templateData.layout.marginX * 0.3}px`
                    }}
                  >
                    <div 
                      className="bg-blue-100 border border-blue-200 mb-2"
                      style={{ height: `${templateData.layout.headerHeight * 0.3}px` }}
                    ></div>
                    <div className="space-y-1">
                      <div className="bg-gray-200 h-1"></div>
                      <div className="bg-gray-200 h-1 w-3/4"></div>
                      <div className="bg-gray-200 h-1 w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}