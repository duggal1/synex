import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { StylePresetName } from '../types';

interface PresetSelectorProps {
  value: StylePresetName;
  onChange: (value: StylePresetName) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="preset-selector" className="whitespace-nowrap">Style Preset:</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="preset-selector" className="w-[140px]">
          <SelectValue placeholder="Select preset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="modern">Modern</SelectItem>
          <SelectItem value="classic">Classic</SelectItem>
          <SelectItem value="minimal">Minimal</SelectItem>
          <SelectItem value="bold">Bold</SelectItem>
          <SelectItem value="colorful">Colorful</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};