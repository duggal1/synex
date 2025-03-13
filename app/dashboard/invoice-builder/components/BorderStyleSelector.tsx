import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { BorderStyle } from '../types';

interface BorderStyleSelectorProps {
  value: BorderStyle;
  onChange: (value: BorderStyle) => void;
}

export const BorderStyleSelector: React.FC<BorderStyleSelectorProps> = ({ value, onChange }) => {
  const borderStyles: { value: BorderStyle; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' }
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="border-style-selector">Border Style</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="border-style-selector">
          <SelectValue placeholder="Select border style" />
        </SelectTrigger>
        <SelectContent>
          {borderStyles.map(style => (
            <SelectItem 
              key={style.value} 
              value={style.value}
            >
              <div className="flex items-center">
                <div 
                  className="mr-2 w-12 h-4" 
                  style={{ 
                    borderBottom: style.value === 'none' 
                      ? 'none' 
                      : `2px ${style.value} #000` 
                  }}
                />
                {style.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 