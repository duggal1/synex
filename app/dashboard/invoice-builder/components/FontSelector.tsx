import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FontSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
  const fonts = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: "'Helvetica Neue', Helvetica, sans-serif", label: 'Helvetica' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
    { value: "'Segoe UI', sans-serif", label: 'Segoe UI' },
    { value: "'Open Sans', sans-serif", label: 'Open Sans' },
    { value: "'Roboto', sans-serif", label: 'Roboto' }
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="font-selector">Font Family</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="font-selector">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent>
          {fonts.map(font => (
            <SelectItem 
              key={font.value} 
              value={font.value}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 