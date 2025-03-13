
/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, value, onChange }) => {
  const [activeTab, setActiveTab] = useState<string>("url");
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a URL for the uploaded file
      const fileUrl = URL.createObjectURL(file);
      onChange(fileUrl);
    }
  };
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="url" className="flex items-center">
            <Link className="mr-2 w-4 h-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center">
            <Upload className="mr-2 w-4 h-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="mt-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={value}
            onChange={handleUrlChange}
          />
          {value && (
            <div className="mt-2 p-2 border rounded-md">
              <img 
                src={value} 
                alt={label} 
                className="mx-auto max-w-full max-h-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x200/e2e8f0/64748b?text=Invalid+Image';
                }}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upload" className="mt-2">
          <div className="flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-md text-center">
            <Upload className="mb-2 w-8 h-8 text-gray-400" />
            <p className="mb-2 text-gray-500 text-sm">Drag and drop an image, or click to browse</p>
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              id={`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline" 
              onClick={() => {
                document.getElementById(`file-upload-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click();
              }}
            >
              Select Image
            </Button>
          </div>
          
          {value && value.startsWith('blob:') && (
            <div className="mt-2 p-2 border rounded-md">
              <img 
                src={value} 
                alt={label} 
                className="mx-auto max-w-full max-h-20 object-contain" 
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 