'use client';

import { useState } from 'react';
import { Type, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial', category: 'Sans Serif' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica', category: 'Sans Serif' },
  { value: 'Roboto, sans-serif', label: 'Roboto', category: 'Sans Serif' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans', category: 'Sans Serif' },
  { value: 'Lato, sans-serif', label: 'Lato', category: 'Sans Serif' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat', category: 'Sans Serif' },
  { value: 'Times, serif', label: 'Times', category: 'Serif' },
  { value: 'Times New Roman, serif', label: 'Times New Roman', category: 'Serif' },
  { value: 'Georgia, serif', label: 'Georgia', category: 'Serif' },
  { value: 'Playfair Display, serif', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather, serif', label: 'Merriweather', category: 'Serif' },
  { value: 'Courier New, monospace', label: 'Courier New', category: 'Monospace' },
  { value: 'Monaco, monospace', label: 'Monaco', category: 'Monospace' },
  { value: 'Consolas, monospace', label: 'Consolas', category: 'Monospace' }
];

const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal (400)', weight: 400 },
  { value: 'medium', label: 'Medium (500)', weight: 500 },
  { value: 'semibold', label: 'Semi Bold (600)', weight: 600 },
  { value: 'bold', label: 'Bold (700)', weight: 700 },
  { value: 'extrabold', label: 'Extra Bold (800)', weight: 800 }
];

const FONT_PRESETS = {
  professional: {
    heading: { family: 'Arial, sans-serif', size: 24, weight: 'bold', lineHeight: 1.2 },
    subheading: { family: 'Arial, sans-serif', size: 14, weight: 'semibold', lineHeight: 1.3 },
    body: { family: 'Arial, sans-serif', size: 10, weight: 'normal', lineHeight: 1.4 },
    small: { family: 'Arial, sans-serif', size: 8, weight: 'normal', lineHeight: 1.3 }
  },
  modern: {
    heading: { family: 'Montserrat, sans-serif', size: 26, weight: 'bold', lineHeight: 1.1 },
    subheading: { family: 'Montserrat, sans-serif', size: 13, weight: 'semibold', lineHeight: 1.3 },
    body: { family: 'Open Sans, sans-serif', size: 10, weight: 'normal', lineHeight: 1.5 },
    small: { family: 'Open Sans, sans-serif', size: 8, weight: 'normal', lineHeight: 1.4 }
  },
  classic: {
    heading: { family: 'Times New Roman, serif', size: 24, weight: 'bold', lineHeight: 1.2 },
    subheading: { family: 'Times New Roman, serif', size: 13, weight: 'bold', lineHeight: 1.3 },
    body: { family: 'Times New Roman, serif', size: 10, weight: 'normal', lineHeight: 1.4 },
    small: { family: 'Times New Roman, serif', size: 8, weight: 'normal', lineHeight: 1.3 }
  },
  minimal: {
    heading: { family: 'Helvetica, sans-serif', size: 22, weight: 'normal', lineHeight: 1.2 },
    subheading: { family: 'Helvetica, sans-serif', size: 12, weight: 'bold', lineHeight: 1.3 },
    body: { family: 'Helvetica, sans-serif', size: 9, weight: 'normal', lineHeight: 1.4 },
    small: { family: 'Helvetica, sans-serif', size: 7, weight: 'normal', lineHeight: 1.3 }
  }
};

export default function FontSelector({ 
  fontConfig, 
  onChange, 
  elementType = 'body',
  showPresets = true,
  showAdvanced = false 
}) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);

  const handleFontChange = (property, value) => {
    onChange({
      ...fontConfig,
      [property]: value
    });
  };

  const applyFontPreset = (presetName) => {
    const preset = FONT_PRESETS[presetName];
    if (preset && preset[elementType]) {
      onChange(preset[elementType]);
    }
  };

  const incrementSize = () => {
    const newSize = Math.min(fontConfig.size + 1, 72);
    handleFontChange('size', newSize);
  };

  const decrementSize = () => {
    const newSize = Math.max(fontConfig.size - 1, 6);
    handleFontChange('size', newSize);
  };

  // Group fonts by category
  const fontsByCategory = FONT_FAMILIES.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Type className="w-4 h-4" />
          {elementType.charAt(0).toUpperCase() + elementType.slice(1)} Typography
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Presets */}
        {showPresets && (
          <div>
            <Label className="text-sm font-medium">Typography Presets</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.keys(FONT_PRESETS).map((presetName) => (
                <Button
                  key={presetName}
                  variant="outline"
                  size="sm"
                  onClick={() => applyFontPreset(presetName)}
                  className="justify-start text-xs h-8"
                >
                  {presetName.charAt(0).toUpperCase() + presetName.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Font Family */}
        <div>
          <Label htmlFor="font-family">Font Family</Label>
          <Select 
            value={fontConfig.family || 'Arial, sans-serif'} 
            onValueChange={(value) => handleFontChange('family', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(fontsByCategory).map(([category, fonts]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {fonts.map((font) => (
                    <SelectItem 
                      key={font.value} 
                      value={font.value}
                      className="pl-4"
                    >
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div>
          <Label htmlFor="font-size">Font Size</Label>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementSize}
              disabled={fontConfig.size <= 6}
              className="h-8 w-8 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <div className="flex-1">
              <Slider
                value={[fontConfig.size]}
                onValueChange={([value]) => handleFontChange('size', value)}
                min={6}
                max={72}
                step={1}
                className="flex-1"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={incrementSize}
              disabled={fontConfig.size >= 72}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <div className="text-sm text-center min-w-[40px] font-mono">
              {fontConfig.size}pt
            </div>
          </div>
        </div>

        {/* Font Weight */}
        <div>
          <Label htmlFor="font-weight">Font Weight</Label>
          <Select 
            value={fontConfig.weight || 'normal'} 
            onValueChange={(value) => handleFontChange('weight', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  <span style={{ fontWeight: weight.weight }}>
                    {weight.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Options Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="w-full text-xs"
        >
          {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
        </Button>

        {/* Advanced Typography Options */}
        {showAdvancedOptions && (
          <div className="space-y-3 pt-2 border-t">
            {/* Line Height */}
            <div>
              <Label htmlFor="line-height">Line Height</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[fontConfig.lineHeight || 1.4]}
                  onValueChange={([value]) => handleFontChange('lineHeight', value)}
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  className="flex-1"
                />
                <div className="text-sm text-center min-w-[35px] font-mono">
                  {(fontConfig.lineHeight || 1.4).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Letter Spacing */}
            <div>
              <Label htmlFor="letter-spacing">Letter Spacing</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[fontConfig.letterSpacing || 0]}
                  onValueChange={([value]) => handleFontChange('letterSpacing', value)}
                  min={-2}
                  max={5}
                  step={0.1}
                  className="flex-1"
                />
                <div className="text-sm text-center min-w-[35px] font-mono">
                  {(fontConfig.letterSpacing || 0).toFixed(1)}px
                </div>
              </div>
            </div>

            {/* Text Transform */}
            <div>
              <Label htmlFor="text-transform">Text Transform</Label>
              <Select 
                value={fontConfig.textTransform || 'none'} 
                onValueChange={(value) => handleFontChange('textTransform', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">UPPERCASE</SelectItem>
                  <SelectItem value="lowercase">lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Live Preview */}
        <div className="pt-3 border-t">
          <Label className="text-sm font-medium">Preview</Label>
          <div 
            className="mt-2 p-3 border rounded bg-white text-center"
            style={{
              fontFamily: fontConfig.family || 'Arial, sans-serif',
              fontSize: `${fontConfig.size || 10}px`,
              fontWeight: fontConfig.weight || 'normal',
              lineHeight: fontConfig.lineHeight || 1.4,
              letterSpacing: fontConfig.letterSpacing ? `${fontConfig.letterSpacing}px` : 'normal',
              textTransform: fontConfig.textTransform || 'none'
            }}
          >
            {elementType === 'heading' && 'Invoice Heading'}
            {elementType === 'subheading' && 'Section Subheading'}
            {elementType === 'body' && 'This is sample body text for preview'}
            {elementType === 'small' && 'Small text preview'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}