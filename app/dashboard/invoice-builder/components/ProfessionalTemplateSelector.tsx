import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { professionalTemplates } from '../templates/professional';

interface ProfessionalTemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProfessionalTemplateSelector: React.FC<ProfessionalTemplateSelectorProps> = ({ 
  value, 
  onChange 
}) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {Object.entries(professionalTemplates).map(([id, template]) => (
        <div key={id} className="relative">
          <RadioGroupItem
            value={id}
            id={`template-${id}`}
            className="sr-only"
          />
          <label
            htmlFor={`template-${id}`}
            className="cursor-pointer block"
          >
            <Card className={`overflow-hidden transition-all ${
              value === id ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}>
              <CardContent className="p-0">
                <div className="h-32" style={{ backgroundColor: template.styles.headerColor }}>
                  <div className="p-4">
                    <h3 className="font-medium" style={{ color: template.styles.headerColor === '#ffffff' ? '#000000' : '#ffffff' }}>
                      {template.name}
                    </h3>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-500">Professional {template.name.toLowerCase()} design</p>
                </div>
              </CardContent>
            </Card>
          </label>
        </div>
      ))}
    </RadioGroup>
  );
};
