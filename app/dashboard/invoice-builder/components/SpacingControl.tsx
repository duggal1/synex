import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface SpacingControlProps {
  label: string;
  value: string | number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: string | number) => void;
}

export const SpacingControl: React.FC<SpacingControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = 'px',
  onChange
}) => {
  // Convert string value to number for slider
  const numericValue = typeof value === 'string' 
    ? parseInt(value) || min
    : value;
  
  const handleSliderChange = (newValue: number[]) => {
    const value = newValue[0];
    onChange(unit ? `${value}${unit}` : value);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value);
    if (!isNaN(inputValue) && inputValue >= min && inputValue <= max) {
      onChange(unit ? `${inputValue}${unit}` : inputValue);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center">
          <Input
            type="number"
            value={numericValue}
            onChange={handleInputChange}
            className="w-16 h-8 text-right"
            min={min}
            max={max}
            step={step}
          />
          {unit && <span className="ml-1 text-gray-500 text-sm">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[numericValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
      />
    </div>
  );
};