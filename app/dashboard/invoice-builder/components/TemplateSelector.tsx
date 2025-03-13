import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TemplateSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ value, onChange }) => {
  const templates = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Clean and professional invoice layout',
      thumbnail: 'https://placehold.co/300x200/e2e8f0/64748b?text=Standard'
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Contemporary design with bold elements',
      thumbnail: 'https://placehold.co/300x200/dbeafe/3b82f6?text=Modern'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple and elegant with minimal styling',
      thumbnail: 'https://placehold.co/300x200/f3f4f6/6b7280?text=Minimal'
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional template for business use',
      thumbnail: 'https://placehold.co/300x200/e0f2fe/0ea5e9?text=Corporate'
    }
  ];

  return (
    <div className="space-y-4">
      <Label>Select Template</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="gap-4 grid grid-cols-2"
      >
        {templates.map(template => (
          <div key={template.id} className="relative">
            <RadioGroupItem
              value={template.id}
              id={`template-${template.id}`}
              className="sr-only"
            />
            <label
              htmlFor={`template-${template.id}`}
              className="cursor-pointer"
            >
              <Card className={`overflow-hidden transition-all ${value === template.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                <CardContent className="p-0">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-gray-500 text-xs">{template.description}</p>
                  </div>
                </CardContent>
              </Card>
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}; 