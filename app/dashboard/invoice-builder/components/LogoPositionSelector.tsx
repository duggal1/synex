import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { LogoPosition } from '../types';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface LogoPositionSelectorProps {
  value: LogoPosition;
  onChange: (value: LogoPosition) => void;
}

export const LogoPositionSelector: React.FC<LogoPositionSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>Logo Position</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange as (value: string) => void}
        className="flex space-x-2"
      >
        <div className="flex flex-col items-center space-y-1">
          <div className="hover:bg-gray-100 p-2 border rounded-md transition-colors cursor-pointer">
            <RadioGroupItem value="left" id="logo-left" className="sr-only" />
            <label htmlFor="logo-left" className="cursor-pointer">
              <AlignLeft className="w-5 h-5" />
            </label>
          </div>
          <span className="text-xs">Left</span>
        </div>
        
        <div className="flex flex-col items-center space-y-1">
          <div className="hover:bg-gray-100 p-2 border rounded-md transition-colors cursor-pointer">
            <RadioGroupItem value="center" id="logo-center" className="sr-only" />
            <label htmlFor="logo-center" className="cursor-pointer">
              <AlignCenter className="w-5 h-5" />
            </label>
          </div>
          <span className="text-xs">Center</span>
        </div>
        
        <div className="flex flex-col items-center space-y-1">
          <div className="hover:bg-gray-100 p-2 border rounded-md transition-colors cursor-pointer">
            <RadioGroupItem value="right" id="logo-right" className="sr-only" />
            <label htmlFor="logo-right" className="cursor-pointer">
              <AlignRight className="w-5 h-5" />
            </label>
          </div>
          <span className="text-xs">Right</span>
        </div>
      </RadioGroup>
    </div>
  );
}; 