'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { defaultStyles, stylePresets } from './styles';
import { validateTemplate } from './utils';
import { injectStyles } from './utils/styles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from './components/ColorPicker';
import { PresetSelector } from './components/PresetSelector';
import { SpacingControl } from './components/SpacingControl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Copy, Download, Eye, Info, Plus, Save, Trash } from 'lucide-react';
import type { InvoiceStyles, InvoiceLayout, TableStyle, StylePresetName } from './types';
import { FontSelector } from './components/FontSelector';
import { BorderStyleSelector } from './components/BorderStyleSelector';
import { LogoPositionSelector } from './components/LogoPositionSelector';
import { ImageUploader } from './components/ImageUploader';
import { TemplateSelector } from './components/TemplateSelector';

const tableStyleClasses: Record<TableStyle, string> = {
  simple: 'items-table items-table-simple',
  bordered: 'items-table items-table-bordered',
  striped: 'items-table items-table-striped',
  clean: 'items-table items-table-clean',
  modern: 'items-table items-table-modern'
};

// Function to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  // Remove the hash if it exists
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is light (luminance > 0.5)
  return luminance > 0.5;
};

const InvoiceBuilder = () => {
  const [template, setTemplate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<StylePresetName>('modern');
  const [styles, setStyles] = useState<InvoiceStyles>(defaultStyles);
  const [layout, setLayout] = useState<InvoiceLayout>({
    showLogo: false,
    logoPosition: 'left',
    showHeaderImage: false,
    headerImageUrl: '',
    showCompanyDetails: true,
    showClientDetails: true,
    showPaymentButton: true,
    showFooter: true,
    tableStyle: 'simple',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 4,
    fontSize: 14,
    lineHeight: 1.5,
    headerSpacing: 40,
    contentSpacing: 30,
    footerSpacing: 40,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load template and apply preset
  useEffect(() => {
    loadTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset]);

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/template/default');
      if (!res.ok) {
        throw new Error(`Failed to load template: ${res.status}`);
      }
      let html = await res.text();
      
      console.debug('Raw template from API:', html.substring(0, 200) + '...');
      
      // Clean and normalize HTML but preserve structure
      html = html.trim()
        .replace(/<!--[\s\S]*?-->/g, '');
      
      // Extract body content if full HTML document
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        html = bodyMatch[1].trim();
        console.debug('Extracted body content');
      }
      
      console.debug('Template HTML before validation:', html.substring(0, 200) + '...');
      
      if (!validateTemplate(html)) {
        console.error('Template validation failed');
        console.debug('Clean HTML:', html);
        
        // Even if validation fails, try to proceed with the template
        // This is a fallback to handle unexpected template structures
        console.debug('Attempting to proceed with template despite validation failure');
        setTemplate(html);
        applyPresetStyles(selectedPreset);
        return;
      }
      
      setTemplate(html);
      applyPresetStyles(selectedPreset);
    } catch (err) {
      toast.error('Failed to load template');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPresetStyles = (presetName: StylePresetName) => {
    const preset = stylePresets[presetName];
    const newStyles = { ...styles, ...preset };
    setStyles(newStyles);
    updateTemplate(newStyles, layout);
  };

  // Style update handlers
  const handleStyleChange = (property: string, value: string) => {
    const newStyles = { ...styles, [property]: value };
    setStyles(newStyles);
    updateTemplate(newStyles, layout);
  };

  const handleLayoutChange = (property: string, value: any) => {
    const newLayout = { ...layout, [property]: value };
    setLayout(newLayout);
    updateTemplate(styles, newLayout);
  };

  const updateTableStyle = (template: string, style: TableStyle) => {
    const tableClass = tableStyleClasses[style];
    
    // First remove all existing table style classes
    template = template.replace(
      /(class="[^"]*)(items-table-simple|items-table-bordered|items-table-striped|items-table-clean|items-table-modern)([^"]*")/g,
      '$1$3'
    );
    
    // Then add the new table style class
    template = template.replace(
      /(class="[^"]*items-table[^"]*")/g,
      `$1 ${tableClass}`
    );
    
    // Force table styling by adding inline styles
    const tableStyles = {
      simple: 'style="border-collapse:collapse;"',
      bordered: 'style="border-collapse:collapse; border:1px solid #e5e7eb;"',
      striped: 'style="border-collapse:collapse;"',
      clean: 'style="border-collapse:collapse;"',
      modern: 'style="border-collapse:collapse; box-shadow:0 1px 3px rgba(0,0,0,0.1); border-radius:8px;"'
    };
    
    template = template.replace(
      /(<table[^>]*class="[^"]*items-table[^"]*"[^>]*)(>)/g,
      `$1 ${tableStyles[style]}$2`
    );
    
    return template;
  };

  const updateTemplate = (newStyles: InvoiceStyles, newLayout: InvoiceLayout) => {
    if (!template) return; // Prevent processing if template isn't loaded yet
    
    let updatedTemplate = template;

    // Determine if we're dealing with a table-based or div-based template
    const isTableBased = updatedTemplate.includes('class="main-table"') || 
                         updatedTemplate.includes('class="invoice-title"') ||
                         updatedTemplate.includes('cellpadding="0"') ||
                         updatedTemplate.includes('cellspacing="0"');

    console.debug(`Template type: ${isTableBased ? 'Table-based' : 'Div-based'}`);

    try {
      // First, handle common updates for both template types
      
      // Update text colors based on header background
      const headerTextColor = isLightColor(newStyles.headerColor) ? '#000000' : '#ffffff';
      
      // Update header background and text colors
      if (isTableBased) {
        // For table-based templates
        updatedTemplate = updatedTemplate
          .replace(/(bgcolor=")[^"]+(")/gi, `$1${newStyles.headerColor}$2`);
          
        // Update text colors in header
        const headerElements = ['h1', 'h2', 'h3', 'p', 'span', 'div'];
        headerElements.forEach(element => {
          const regex = new RegExp(`(<${element}[^>]*class="[^"]*(?:invoice-title|invoice-subtitle|meta-label|meta-value)[^"]*"[^>]*style="[^"]*)color:[^;"]+(;|")`, 'gi');
          updatedTemplate = updatedTemplate.replace(regex, `$1color:${headerTextColor}$2`);
        });
      } else {
        // For div-based templates
        updatedTemplate = updatedTemplate
          .replace(/(class="[^"]*header[^"]*"[^>]*style="[^"]*)background-color:[^;"]+(;|")/gi, 
                  `$1background-color:${newStyles.headerColor}$2`)
          .replace(/(class="[^"]*header[^"]*"[^>]*style="[^"]*)color:[^;"]+(;|")/gi, 
                  `$1color:${headerTextColor}$2`);
      }
      
      // Update button colors
      updatedTemplate = updatedTemplate
        .replace(/(class="[^"]*button[^"]*"[^>]*style="[^"]*)background-color:[^;"]+(;|")/gi, 
                `$1background-color:${newStyles.buttonColor}$2`)
        .replace(/(class="[^"]*pay-button[^"]*"[^>]*style="[^"]*)background-color:[^;"]+(;|")/gi, 
                `$1background-color:${newStyles.payButtonColor}$2`);
      
      // Update font family
      updatedTemplate = updatedTemplate
        .replace(/font-family:[^;"]+(;|")/gi, `font-family:${newStyles.fontFamily}$1`);
      
      // Update border styles
      if (newLayout.borderStyle !== 'none') {
        updatedTemplate = updatedTemplate
          .replace(/border:[^;"]+(;|")/gi, `border:${newLayout.borderWidth}px ${newLayout.borderStyle} ${newLayout.borderColor}$1`)
          .replace(/border-radius:[^;"]+(;|")/gi, `border-radius:${newLayout.borderRadius}px$1`);
      } else {
        updatedTemplate = updatedTemplate
          .replace(/border:[^;"]+(;|")/gi, `border:none$1`)
          .replace(/border-radius:[^;"]+(;|")/gi, `border-radius:0$1`);
      }
      
      // Update font size and line height
      updatedTemplate = updatedTemplate
        .replace(/font-size:[^;"]+(;|")/gi, `font-size:${newLayout.fontSize}px$1`)
        .replace(/line-height:[^;"]+(;|")/gi, `line-height:${newLayout.lineHeight}$1`);

      // Update spacing
      updatedTemplate = updatedTemplate
        .replace(/(class="[^"]*header[^"]*"[^>]*style="[^"]*)padding:[^;"]+(;|")/gi, 
                `$1padding:${newLayout.headerSpacing}px$2`)
        .replace(/(class="[^"]*content[^"]*"[^>]*style="[^"]*)padding:[^;"]+(;|")/gi, 
                `$1padding:${newLayout.contentSpacing}px$2`)
        .replace(/(class="[^"]*footer[^"]*"[^>]*style="[^"]*)padding:[^;"]+(;|")/gi, 
                `$1padding:${newLayout.footerSpacing}px$2`);
      
      // Handle header image
      if (newLayout.showHeaderImage && newLayout.headerImageUrl) {
        const headerImageHtml = `<img class="header-image" src="${newLayout.headerImageUrl}" alt="Header" style="width:100%; max-height:200px; object-fit:cover; display:block;" />`;
        
        if (isTableBased) {
          // For table-based templates
          const headerImageRegex = /<img[^>]*class="[^"]*header-image[^"]*"[^>]*>/i;
          if (headerImageRegex.test(updatedTemplate)) {
            updatedTemplate = updatedTemplate.replace(headerImageRegex, headerImageHtml);
          } else {
            // Try to add after header container
            const headerContainerEndRegex = /<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>/i;
            if (headerContainerEndRegex.test(updatedTemplate)) {
              updatedTemplate = updatedTemplate.replace(
                headerContainerEndRegex,
                `</td></tr></table></td></tr><tr><td style="padding:0;">${headerImageHtml}</td></tr>`
              );
            } else {
              // Try to add at the beginning of content
              const contentStartRegex = /<tr>\s*<td[^>]*class="[^"]*content[^"]*"[^>]*>/i;
              if (contentStartRegex.test(updatedTemplate)) {
                updatedTemplate = updatedTemplate.replace(
                  contentStartRegex,
                  `<tr><td style="padding:0;">${headerImageHtml}</td></tr>$&`
                );
              }
            }
          }
        } else {
          // For div-based templates
          const headerImageRegex = /<img[^>]*class="[^"]*header-image[^"]*"[^>]*>/i;
          if (headerImageRegex.test(updatedTemplate)) {
            updatedTemplate = updatedTemplate.replace(headerImageRegex, headerImageHtml);
          } else {
            // Try to add after header container
            const headerContainerEndRegex = /<\/div>\s*(?=<div[^>]*class="[^"]*content[^"]*")/i;
            if (headerContainerEndRegex.test(updatedTemplate)) {
              updatedTemplate = updatedTemplate.replace(
                headerContainerEndRegex,
                `</div>${headerImageHtml}`
              );
            }
          }
        }
      } else {
        // Remove header image if it exists
        updatedTemplate = updatedTemplate.replace(
          /<img[^>]*class="[^"]*header-image[^"]*"[^>]*>/gi,
          ''
        );
      }
      
      // Handle logo
      if (newLayout.showLogo && newLayout.logoUrl) {
        const logoStyle = `style="max-width:150px; max-height:80px; ${
          newLayout.logoPosition === 'center' ? 'margin:0 auto; display:block;' :
          newLayout.logoPosition === 'right' ? 'margin-left:auto; display:block;' :
          'margin-right:auto; display:block;'
        }"`;
        
        const logoHtml = `<img class="logo" src="${newLayout.logoUrl}" alt="Logo" ${logoStyle} />`;
        
        if (isTableBased) {
          // For table-based templates
          const logoRegex = /<img[^>]*class="[^"]*logo[^"]*"[^>]*>/i;
          if (logoRegex.test(updatedTemplate)) {
            updatedTemplate = updatedTemplate.replace(logoRegex, logoHtml);
          } else {
            // Try to add at the beginning of header
            const headerStartRegex = /<td[^>]*class="header-container"[^>]*>\s*<table/i;
            if (headerStartRegex.test(updatedTemplate)) {
              updatedTemplate = updatedTemplate.replace(
                headerStartRegex,
                `<td class="header-container" bgcolor="${newStyles.headerColor}"><div style="text-align:${newLayout.logoPosition};">${logoHtml}</div><table`
              );
            }
          }
        } else {
          // For div-based templates
          const logoRegex = /<img[^>]*class="[^"]*logo[^"]*"[^>]*>/i;
          if (logoRegex.test(updatedTemplate)) {
            updatedTemplate = updatedTemplate.replace(logoRegex, logoHtml);
          } else {
            // Try to add at the beginning of header
            const headerStartRegex = /<div[^>]*class="[^"]*header-container[^"]*"[^>]*>/i;
            if (headerStartRegex.test(updatedTemplate)) {
              updatedTemplate = updatedTemplate.replace(
                headerStartRegex,
                `$&<div style="text-align:${newLayout.logoPosition};">${logoHtml}</div>`
              );
            }
          }
        }
      } else {
        // Remove logo if it exists
        updatedTemplate = updatedTemplate.replace(
          /<img[^>]*class="[^"]*logo[^"]*"[^>]*>/gi,
          ''
        );
        updatedTemplate = updatedTemplate.replace(
          /<div[^>]*style="text-align:[^"]*"><\/div>/gi,
          ''
        );
      }

      // Toggle visibility of elements
      // Company details
      if (!newLayout.showCompanyDetails) {
        if (isTableBased) {
          updatedTemplate = updatedTemplate.replace(
            /(<td[^>]*>[\s\S]*?<div[^>]*class="[^"]*party-title[^"]*"[^>]*>From<\/div>[\s\S]*?<\/td>)/i,
            '<td style="display:none;">$1</td>'
          );
        } else {
          updatedTemplate = updatedTemplate.replace(
            /(<div[^>]*class="[^"]*company-details[^"]*"[^>]*>[\s\S]*?<\/div>)/i,
            '<div class="company-details" style="display:none;">$1</div>'
          );
        }
      } else {
        // Make sure company details are visible
        updatedTemplate = updatedTemplate.replace(
          /<td[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>([\s\S]*?<div[^>]*class="[^"]*party-title[^"]*"[^>]*>From<\/div>[\s\S]*?)<\/td>/i,
          '<td>$1</td>'
        );
        updatedTemplate = updatedTemplate.replace(
          /<div[^>]*class="[^"]*company-details[^"]*"[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>/i,
          '<div class="company-details">'
        );
      }

      // Client details
      if (!newLayout.showClientDetails) {
        if (isTableBased) {
          updatedTemplate = updatedTemplate.replace(
            /(<td[^>]*>[\s\S]*?<div[^>]*class="[^"]*party-title[^"]*"[^>]*>Bill To<\/div>[\s\S]*?<\/td>)/i,
            '<td style="display:none;">$1</td>'
          );
        } else {
          updatedTemplate = updatedTemplate.replace(
            /(<div[^>]*class="[^"]*client-details[^"]*"[^>]*>[\s\S]*?<\/div>)/i,
            '<div class="client-details" style="display:none;">$1</div>'
          );
        }
      } else {
        // Make sure client details are visible
        updatedTemplate = updatedTemplate.replace(
          /<td[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>([\s\S]*?<div[^>]*class="[^"]*party-title[^"]*"[^>]*>Bill To<\/div>[\s\S]*?)<\/td>/i,
          '<td>$1</td>'
        );
        updatedTemplate = updatedTemplate.replace(
          /<div[^>]*class="[^"]*client-details[^"]*"[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>/i,
          '<div class="client-details">'
        );
      }

      // Payment button
      if (!newLayout.showPaymentButton) {
        updatedTemplate = updatedTemplate.replace(
          /(<a[^>]*class="[^"]*pay-button[^"]*"[^>]*>[\s\S]*?<\/a>)/gi,
          '<span style="display:none;">$1</span>'
        );
        updatedTemplate = updatedTemplate.replace(
          /(<button[^>]*class="[^"]*pay-button[^"]*"[^>]*>[\s\S]*?<\/button>)/gi,
          '<button class="pay-button" style="display:none;">$1</button>'
        );
      } else {
        // Make sure payment button is visible
        updatedTemplate = updatedTemplate.replace(
          /<span[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>(<a[^>]*class="[^"]*pay-button[^"]*"[^>]*>[\s\S]*?<\/a>)<\/span>/gi,
          '$1'
        );
        updatedTemplate = updatedTemplate.replace(
          /<button[^>]*class="[^"]*pay-button[^"]*"[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>/gi,
          '<button class="pay-button">'
        );
      }

      // Footer
      if (!newLayout.showFooter) {
        if (isTableBased) {
          updatedTemplate = updatedTemplate.replace(
            /(<tr[^>]*>[\s\S]*?<td[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/td>[\s\S]*?<\/tr>)/i,
            '<tr style="display:none;">$1</tr>'
          );
        } else {
          updatedTemplate = updatedTemplate.replace(
            /(<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/div>)/i,
            '<div class="footer" style="display:none;">$1</div>'
          );
        }
      } else {
        // Make sure footer is visible
        updatedTemplate = updatedTemplate.replace(
          /<tr[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>([\s\S]*?<td[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/td>[\s\S]*?)<\/tr>/i,
          '<tr>$1</tr>'
        );
        updatedTemplate = updatedTemplate.replace(
          /<div[^>]*class="[^"]*footer[^"]*"[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>/i,
          '<div class="footer">'
        );
      }

      // Update table style
      updatedTemplate = updateTableStyle(updatedTemplate, newLayout.tableStyle);

      setTemplate(updatedTemplate);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error updating template:', err);
    }
  };

  const handleContentChange = (field: string, value: string) => {
    let newTemplate = template;
    
    const updateContent = (selectors: string[], newValue: string) => {
      selectors.forEach(selector => {
        const regex = new RegExp(selector, 'i');
        if (regex.test(newTemplate)) {
          newTemplate = newTemplate.replace(regex, (match) => {
            return match.replace(/>([^<]*)</, `>${newValue}<`);
          });
        }
      });
    };
    
    switch (field) {
      case 'companyName':
        updateContent([
          '<div[^>]*class="[^"]*party-name[^"]*"[^>]*>[^<]*<\/div>',
          '<div[^>]*class="[^"]*company-name[^"]*"[^>]*>[^<]*<\/div>',
          '<h2[^>]*>[^<]*<\/h2>'
        ], value);
        break;
        
      case 'clientName':
        updateContent([
          '<div[^>]*class="[^"]*client-name[^"]*"[^>]*>[^<]*<\/div>',
          '<div[^>]*class="[^"]*party-name[^"]*"[^>]*>[^<]*<\/div>'
        ], value);
        break;
        
      case 'thankYouMessage':
        updateContent([
          '<p[^>]*class="[^"]*invoice-subtitle[^"]*"[^>]*>[^<]*<\/p>',
          '<p[^>]*class="[^"]*thank-you[^"]*"[^>]*>[^<]*<\/p>'
        ], value);
        break;
        
      case 'note':
        updateContent([
          '<div[^>]*class="[^"]*note-content[^"]*"[^>]*>[^<]*<\/div>',
          '<div[^>]*class="[^"]*invoice-note[^"]*"[^>]*>[^<]*<\/div>'
        ], value);
        break;
    }
    
    setTemplate(newTemplate);
    setRefreshKey(prev => prev + 1);
  };

  const updateTemplateStyles = (styles: any) => {
    const css = `
      .main-table {
        border: ${styles.borderWidth}px ${styles.borderStyle} ${styles.borderColor};
        border-radius: ${styles.borderRadius}px;
      }
      .header-container { padding: ${styles.headerSpacing}px; }
      .content-container { padding: ${styles.contentSpacing}px; }
      .footer { padding-top: ${styles.footerSpacing}px; }
      .items-table { border-style: ${styles.tableStyle === 'simple' ? 'none' : styles.tableStyle}; }
    `;
    
    return injectStyles(template, css);
  };

  // Save changes
  const handleSave = async () => {
    try {
      const res = await fetch('/api/template/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          template,
          styles,
          layout 
        })
      });
      
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
      console.error(error);
    }
  };

  // Prepare iframe content with proper styling
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice Preview</title>
        <style>
        /* Reset styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
          body { 
          font-family: ${styles.fontFamily || 'Arial, sans-serif'};
          font-size: ${layout.fontSize || 14}px;
          line-height: ${layout.lineHeight || 1.5};
          color: #333;
          background-color: #ffffff;
          padding: 20px; 
        }
        
        /* Container styles */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background-color: #ffffff;
          ${layout.borderStyle !== 'none' ? `
            border: ${layout.borderWidth}px ${layout.borderStyle} ${layout.borderColor};
            border-radius: ${layout.borderRadius}px;
          ` : ''}
        }
        
        /* Header styles */
        .header-container {
          background-color: ${styles.headerColor};
          color: ${isLightColor(styles.headerColor) ? '#000000' : '#ffffff'};
          padding: ${layout.headerSpacing || 40}px;
        }
        
        /* Ensure text in header is visible regardless of background */
        .header-container h1, 
        .header-container h2, 
        .header-container h3, 
        .header-container p, 
        .header-container span,
        .header-container div,
        .invoice-title,
        .invoice-subtitle,
        .meta-label,
        .meta-value {
          color: ${isLightColor(styles.headerColor) ? '#000000' : '#ffffff'} !important;
          background-color: transparent !important;
        }
        
        /* Logo styles */
        .logo {
          max-width: 150px;
          max-height: 80px;
          ${layout.logoPosition === 'center' ? 'margin: 0 auto; display: block;' : 
            layout.logoPosition === 'right' ? 'margin-left: auto; display: block;' : 
            'margin-right: auto; display: block;'}
        }
        
        /* Header image styles */
        .header-image {
          width: 100%;
          height: auto;
          display: block;
          max-height: 200px;
          object-fit: cover;
        }
        
        /* Content styles */
        .content {
          padding: ${layout.contentSpacing || 30}px;
          background-color: #ffffff;
        }
        
        /* Invoice title */
        h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: ${styles.headerColor};
        }
        
        /* Section titles */
        h2, h3 {
          margin-bottom: 10px;
          color: ${styles.headerColor};
        }
        
        /* Company and client details */
        .company-details, .client-details {
          margin-bottom: 20px;
          background-color: #ffffff;
          padding: 15px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        /* Table styles */
        table {
            width: 100%;
            border-collapse: collapse;
          margin: 20px 0;
          background-color: #ffffff;
        }
        
        th {
          text-align: left;
          padding: 10px;
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        td {
            padding: 10px;
            background-color: #ffffff;
          }
        
          /* Simple table style */
          .items-table-simple th {
            border-bottom: 1px solid #ddd;
          }
        
          .items-table-simple td {
            border-bottom: 1px solid #eee;
          }
        
          /* Bordered table style */
          .items-table-bordered th, .items-table-bordered td {
            border: 1px solid #ddd;
          }
        
          /* Striped table style */
          .items-table-striped tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        
          .items-table-striped th {
            border-bottom: 1px solid #ddd;
          }
        
        /* Total row */
        .total-row {
          font-weight: bold;
          text-align: right;
          margin-top: 20px;
        }
        
        /* Button styles */
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: ${styles.buttonColor};
          color: ${isLightColor(styles.buttonColor) ? '#000000' : '#ffffff'};
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
          cursor: pointer;
          border: none;
          font-family: inherit;
          font-size: inherit;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        
        .button:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transform: translateY(-1px);
        }
        
        .pay-button {
          background-color: ${styles.payButtonColor};
          color: ${isLightColor(styles.payButtonColor) ? '#000000' : '#ffffff'};
          font-weight: bold;
          padding: 12px 24px;
        }
        
        /* Footer styles */
        .footer {
          padding: ${layout.footerSpacing || 40}px;
            text-align: center;
          font-size: 14px;
          color: #666;
          border-top: 1px solid #eee;
          background-color: #ffffff;
        }
        
        /* Template-specific styles */
        /* For table-based templates */
        .main-table {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        .invoice-title {
          color: ${isLightColor(styles.headerColor) ? '#000000' : '#ffffff'} !important;
          font-size: 24px;
          margin: 0;
          padding-bottom: 10px;
          background-color: transparent !important;
        }
        
        .invoice-subtitle {
          color: ${isLightColor(styles.headerColor) ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'} !important;
          font-size: 14px;
          margin: 0;
          background-color: transparent !important;
        }
        
        .meta-row td {
          padding: 5px 10px;
          background-color: transparent !important;
        }
        
        .meta-label {
          color: ${isLightColor(styles.headerColor) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'} !important;
          font-size: 12px;
          background-color: transparent !important;
        }
        
        .meta-value {
          color: ${isLightColor(styles.headerColor) ? '#000000' : '#ffffff'} !important;
          font-weight: 500;
          background-color: transparent !important;
        }
        
        /* Fix for table-based templates with nested tables in header */
        .header-container table,
        .header-container tr,
        .header-container td {
          background-color: transparent !important;
        }
        
        /* Fix for any nested elements in header */
        [class*="header"] * {
          background-color: transparent !important;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .status-paid {
          background-color: #d1fae5;
          color: #047857;
        }
        
        .status-pending {
          background-color: #fef3c7;
          color: #b45309;
        }
        
        .status-overdue {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .party-section {
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .party-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .party-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
          color: #1f2937;
        }
        
        .party-detail {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.4;
        }
        
        /* Responsive styles */
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .header-container, .content, .footer {
            padding: 20px;
          }
          
          table, th, td {
            display: block;
          }
          
          th {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          
          tr {
            border: 1px solid #ccc;
            margin-bottom: 10px;
          }
          
          td {
            border: none;
            position: relative;
            padding-left: 50%;
          }
          
          td:before {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            content: attr(data-label);
            font-weight: bold;
          }
          }

        /* Enhanced table styles */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .items-table-simple th,
        .items-table-simple td {
          border-bottom: 1px solid #eee;
          padding: 12px;
        }
        
        .items-table-bordered {
          border: 1px solid #e5e7eb;
        }
        
        .items-table-bordered th,
        .items-table-bordered td {
          border: 1px solid #e5e7eb;
          padding: 12px;
        }
        
        .items-table-striped tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .items-table-striped th {
          background-color: #f3f4f6;
        }
        
        .items-table-clean th {
          border-bottom: 2px solid #000;
          padding: 12px;
        }
        
        .items-table-clean td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        
        .items-table-modern {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .items-table-modern th {
          background-color: #f8fafc;
          padding: 16px;
          font-weight: 600;
        }
        
        .items-table-modern td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        /* Fix content rendering */
        .party-section {
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .party-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .party-detail {
          color: #4b5563;
          margin-bottom: 2px;
        }

        .note-section {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
        }
        
        .note-content {
          color: #4b5563;
          line-height: 1.5;
        }
        </style>
      </head>
    <body>
      ${template}
    </body>
    </html>
  `;

  return (
    <div className="mx-auto px-4 py-6 max-w-[1600px] container">
      <h1 className="mb-6 font-bold text-2xl">Invoice Builder</h1>
      
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 h-screen">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              <div className="bg-white border rounded-md h-full overflow-hidden">
                <iframe
                  key={refreshKey}
                  srcDoc={iframeContent}
                  className="border-0 w-full h-full min-h-[calc(100vh-200px)]"
                  title="Invoice Preview"
                  style={{ minWidth: '600px', maxWidth: '800px', margin: '0 auto' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="style">
                <TabsList className="mb-4">
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

                <TabsContent value="template" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">Invoice.io Style</h3>
                        <p className="text-sm text-gray-500">Clean, modern design inspired by Invoice.io</p>
                        <img 
                          src="https://placehold.co/300x200/dbeafe/3b82f6?text=Invoice.io" 
                          alt="Invoice.io Template"
                          className="mt-2 rounded-md w-full"
                        />
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">QuickBooks Style</h3>
                        <p className="text-sm text-gray-500">Professional template inspired by QuickBooks</p>
                        <img 
                          src="https://placehold.co/300x200/dcfce7/22c55e?text=QuickBooks" 
                          alt="QuickBooks Template"
                          className="mt-2 rounded-md w-full"
                        />
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">FreshBooks Style</h3>
                        <p className="text-sm text-gray-500">Modern design inspired by FreshBooks</p>
                        <img 
                          src="https://placehold.co/300x200/fef3c7/d97706?text=FreshBooks" 
                          alt="FreshBooks Template"
                          className="mt-2 rounded-md w-full"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="style" className="space-y-4">
                  <PresetSelector
                    value={selectedPreset}
                    onChange={(value) => {
                      setSelectedPreset(value as StylePresetName);
                    }}
                  />
                  
                  <div className="gap-4 grid grid-cols-1 md:grid-cols-2 mt-4">
                    <ColorPicker
                      label="Header Color"
                      value={styles.headerColor}
                      onChange={(value) => handleStyleChange('headerColor', value)}
                  />
                  
                  <ColorPicker
                    label="Button Color"
                    value={styles.buttonColor}
                      onChange={(value) => handleStyleChange('buttonColor', value)}
                  />
                  
                  <ColorPicker
                    label="Pay Button Color"
                    value={styles.payButtonColor}
                      onChange={(value) => handleStyleChange('payButtonColor', value)}
                    />
                    
                    <ColorPicker
                      label="Border Color"
                      value={layout.borderColor}
                      onChange={(value) => handleLayoutChange('borderColor', value)}
                    />
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <FontSelector
                      value={styles.fontFamily}
                      onChange={(value) => handleStyleChange('fontFamily', value)}
                    />

                  <SpacingControl
                      label="Font Size"
                      value={layout.fontSize}
                      min={10}
                      max={20}
                      step={1}
                      unit="px"
                      onChange={(value) => handleLayoutChange('fontSize', value)}
                    />
                    
                    <SpacingControl
                      label="Line Height"
                      value={layout.lineHeight}
                      min={1}
                      max={2}
                      step={0.1}
                      unit="x"
                      onChange={(value) => handleLayoutChange('lineHeight', value)}
                    />
                    
                    <BorderStyleSelector
                      value={layout.borderStyle}
                      onChange={(value) => handleLayoutChange('borderStyle', value)}
                    />
                    
                    <SpacingControl
                      label="Border Width"
                      value={layout.borderWidth}
                      min={0}
                      max={5}
                      step={1}
                      unit="px"
                      onChange={(value) => handleLayoutChange('borderWidth', value)}
                    />
                    
                    <SpacingControl
                      label="Border Radius"
                      value={layout.borderRadius}
                      min={0}
                      max={16}
                      step={1}
                      unit="px"
                      onChange={(value) => handleLayoutChange('borderRadius', value)}
                    />
                    
                    <SpacingControl
                      label="Header Spacing"
                      value={layout.headerSpacing}
                      min={10}
                      max={100}
                      step={5}
                      unit="px"
                      onChange={(value) => handleLayoutChange('headerSpacing', value)}
                    />
                    
                    <SpacingControl
                      label="Content Spacing"
                      value={layout.contentSpacing}
                      min={10}
                      max={100}
                      step={5}
                      unit="px"
                      onChange={(value) => handleLayoutChange('contentSpacing', value)}
                    />
                    
                    <SpacingControl
                      label="Footer Spacing"
                      value={layout.footerSpacing}
                      min={10}
                      max={100}
                      step={5}
                      unit="px"
                      onChange={(value) => handleLayoutChange('footerSpacing', value)}
                    />
                  </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                    <Label>Invoice Title</Label>
                    <Input
                        placeholder="Invoice #12345"
                        onChange={(e) => {
                        let newTemplate = template;
                        const value = e.target.value;
                        
                        // For div-based templates
                        const h1Regex = /<h1[^>]*>(.*?)<\/h1>/i;
                        if (h1Regex.test(newTemplate)) {
                          newTemplate = newTemplate.replace(h1Regex, `<h1>${value}</h1>`);
                        }
                        
                        // For table-based templates
                        const titleRegex = /<h1[^>]*class="[^"]*invoice-title[^"]*"[^>]*>(.*?)<\/h1>/i;
                        if (titleRegex.test(newTemplate)) {
                          newTemplate = newTemplate.replace(titleRegex, `<h1 class="invoice-title">${value}</h1>`);
                        }
                        
                        // Try with span or div that might contain "title"
                        const anyTitleRegex = /<(span|div)[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/\1>/i;
                        if (anyTitleRegex.test(newTemplate)) {
                          newTemplate = newTemplate.replace(anyTitleRegex, (match, tag, content) => {
                            return match.replace(content, value);
                          });
                        }
                        
                        // Try with {{invoiceName}} placeholder
                        newTemplate = newTemplate.replace(/{{invoiceName}}/g, value);
                        
                        setTemplate(newTemplate);
                        setRefreshKey(prev => prev + 1);
                      }}
                    />
                  </div>
                  
                    <div>
                    <Label>Company Name</Label>
                    <Input
                        placeholder="Your Company Name"
                        onChange={(e) => {
                          let newTemplate = template;
                          const value = e.target.value;
                          
                          // For div-based templates
                          const companyNameRegex = /<div[^>]*class="[^"]*company-details[^"]*"[^>]*>[\s\S]*?<h2[^>]*>(.*?)<\/h2>/i;
                          if (companyNameRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(companyNameRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // For table-based templates - party name in From section
                          const partyNameRegex = /<div[^>]*class="[^"]*party-title[^"]*"[^>]*>From<\/div>[\s\S]*?<div[^>]*class="[^"]*party-name[^"]*"[^>]*>(.*?)<\/div>/i;
                          if (partyNameRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(partyNameRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with company-name class
                          const companyNameClassRegex = /<[^>]*class="[^"]*company-name[^"]*"[^>]*>(.*?)<\/[^>]*>/i;
                          if (companyNameClassRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(companyNameClassRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with {{fromName}} placeholder
                          newTemplate = newTemplate.replace(/{{fromName}}/g, value);
                          
                          setTemplate(newTemplate);
                          setRefreshKey(prev => prev + 1);
                      }}
                    />
                  </div>
                  
                    <div>
                    <Label>Client Name</Label>
                    <Input
                        placeholder="Client Name"
                        onChange={(e) => {
                          let newTemplate = template;
                          const value = e.target.value;
                          
                          // For div-based templates
                          const clientNameRegex = /<div[^>]*class="[^"]*client-details[^"]*"[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>/i;
                          if (clientNameRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(clientNameRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // For table-based templates - party name in Bill To section
                          const partyNameRegex = /<div[^>]*class="[^"]*party-title[^"]*"[^>]*>Bill To<\/div>[\s\S]*?<div[^>]*class="[^"]*party-name[^"]*"[^>]*>(.*?)<\/div>/i;
                          if (partyNameRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(partyNameRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with client-name class
                          const clientNameClassRegex = /<[^>]*class="[^"]*client-name[^"]*"[^>]*>(.*?)<\/[^>]*>/i;
                          if (clientNameClassRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(clientNameClassRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with {{clientName}} placeholder
                          newTemplate = newTemplate.replace(/{{clientName}}/g, value);
                          
                          setTemplate(newTemplate);
                          setRefreshKey(prev => prev + 1);
                        }}
                      />
                    </div>
                  
                    <div>
                    <Label>Thank You Message</Label>
                    <Input
                        placeholder="Thank you for your business!"
                        onChange={(e) => {
                          let newTemplate = template;
                          const value = e.target.value;
                          
                          // For div-based templates
                          const thankYouRegex = /<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<p[^>]*>(.*?)<\/p>/i;
                          if (thankYouRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(thankYouRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // For table-based templates
                          const footerPRegex = /<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<p[^>]*>(.*?)<\/p>/i;
                          if (footerPRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(footerPRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with thank-you class
                          const thankYouClassRegex = /<[^>]*class="[^"]*thank-you[^"]*"[^>]*>(.*?)<\/[^>]*>/i;
                          if (thankYouClassRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(thankYouClassRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with invoice-subtitle class (often used for thank you messages)
                          const subtitleRegex = /<p[^>]*class="[^"]*invoice-subtitle[^"]*"[^>]*>(.*?)<\/p>/i;
                          if (subtitleRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(subtitleRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          setTemplate(newTemplate);
                          setRefreshKey(prev => prev + 1);
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label>Invoice Note</Label>
                      <Textarea 
                        placeholder="Add a note to your invoice..."
                        onChange={(e) => {
                          let newTemplate = template;
                          const value = e.target.value;
                          
                          // For div-based templates
                          const noteRegex = /<div[^>]*class="[^"]*note[^"]*"[^>]*>[\s\S]*?<p[^>]*>(.*?)<\/p>/i;
                          if (noteRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(noteRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // For table-based templates
                          const noteContentRegex = /<div[^>]*class="[^"]*note-content[^"]*"[^>]*>(.*?)<\/div>/i;
                          if (noteContentRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(noteContentRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with invoice-note class
                          const invoiceNoteRegex = /<[^>]*class="[^"]*invoice-note[^"]*"[^>]*>(.*?)<\/[^>]*>/i;
                          if (invoiceNoteRegex.test(newTemplate)) {
                            newTemplate = newTemplate.replace(invoiceNoteRegex, (match, p1) => {
                              return match.replace(p1, value);
                            });
                          }
                          
                          // Try with {{note}} placeholder
                          newTemplate = newTemplate.replace(/{{note}}/g, value);
                          
                          setTemplate(newTemplate);
                          setRefreshKey(prev => prev + 1);
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="layout" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="show-logo">Show Logo</Label>
                      <Switch
                        id="show-logo"
                        checked={layout.showLogo}
                        onCheckedChange={(checked) => handleLayoutChange('showLogo', checked)}
                      />
                    </div>
                    
                    {layout.showLogo && (
                      <>
                        <ImageUploader
                          label="Logo Image"
                          value={layout.logoUrl || ''}
                          onChange={(value) => handleLayoutChange('logoUrl', value)}
                        />
                        
                        <LogoPositionSelector
                          value={layout.logoPosition}
                          onChange={(value) => handleLayoutChange('logoPosition', value)}
                        />
                      </>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="show-header-image">Show Header Image</Label>
                      <Switch
                        id="show-header-image"
                        checked={layout.showHeaderImage}
                        onCheckedChange={(checked) => handleLayoutChange('showHeaderImage', checked)}
                      />
                    </div>
                    
                    {layout.showHeaderImage && (
                      <ImageUploader
                        label="Header Image"
                        value={layout.headerImageUrl}
                        onChange={(value) => handleLayoutChange('headerImageUrl', value)}
                      />
                    )}
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="show-company-details">Show Company Details</Label>
                      <Switch
                        id="show-company-details"
                        checked={layout.showCompanyDetails}
                        onCheckedChange={(checked) => handleLayoutChange('showCompanyDetails', checked)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="show-client-details">Show Client Details</Label>
                      <Switch
                        id="show-client-details"
                        checked={layout.showClientDetails}
                        onCheckedChange={(checked) => handleLayoutChange('showClientDetails', checked)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="show-payment-button">Show Payment Button</Label>
                      <Switch
                        id="show-payment-button"
                        checked={layout.showPaymentButton}
                        onCheckedChange={(checked) => handleLayoutChange('showPaymentButton', checked)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="show-footer">Show Footer</Label>
                      <Switch
                        id="show-footer"
                        checked={layout.showFooter}
                        onCheckedChange={(checked) => handleLayoutChange('showFooter', checked)}
                      />
                    </div>
                    
                    <div>
                      <Label>Table Style</Label>
                      <Select
                        value={layout.tableStyle}
                        onValueChange={(value) => handleLayoutChange('tableStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select table style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="bordered">Bordered</SelectItem>
                          <SelectItem value="striped">Striped</SelectItem>
                          <SelectItem value="clean">Clean</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
                </CardContent>
              </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => loadTemplate()}>
                  Reset
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 w-4 h-4" />
                  Save
                </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBuilder;