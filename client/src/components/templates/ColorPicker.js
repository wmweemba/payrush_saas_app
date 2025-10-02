'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ColorPicker({ color, onChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);

  // Predefined color palette
  const presetColors = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff4500', '#ff8c00', '#ffd700', '#ffff00', '#adff2f',
    '#00ff00', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff',
    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#eff6ff',
    '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e0e7ff', '#f3f4f6',
    '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2',
    '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
    '#d97706', '#f59e0b', '#fbbf24', '#fde047', '#fef3c7', '#fffbeb'
  ];

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const handlePresetClick = (presetColor) => {
    setInputValue(presetColor);
    onChange(presetColor);
    setIsOpen(false);
  };

  const handleInputBlur = () => {
    // Reset to current color if invalid
    if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
      setInputValue(color);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="p-1 h-8 w-8"
          >
            <div
              className="w-full h-full rounded border"
              style={{ backgroundColor: color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Color Value</label>
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="#000000"
                className="mt-1 text-xs font-mono"
                disabled={disabled}
              />
            </div>
            
            <div>
              <label className="text-xs font-medium">Preset Colors</label>
              <div className="grid grid-cols-6 gap-1 mt-2">
                {presetColors.map((presetColor) => (
                  <button
                    key={presetColor}
                    onClick={() => handlePresetClick(presetColor)}
                    disabled={disabled}
                    className="w-8 h-8 rounded border border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">HTML Color Input</label>
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  onChange(e.target.value);
                }}
                disabled={disabled}
                className="mt-1 w-full h-8 rounded border cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="#000000"
        className="text-xs font-mono flex-1 max-w-20"
        disabled={disabled}
      />
    </div>
  );
}