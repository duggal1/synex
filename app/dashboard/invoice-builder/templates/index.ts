export const invoiceTemplates = {
  modern: {
    name: 'Modern',
    styles: {
      headerColor: '#1a1a1a',
      spacing: '24px',
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      buttonColor: '#0284c7',
      payButtonColor: '#059669',
      borderStyle: 'solid',
      borderWidth: 1,
      borderRadius: 8,
    }
  },
  
  enterprise: {
    name: 'Enterprise',
    styles: {
      headerColor: '#1e40af',
      spacing: '32px',
      fontFamily: "'Inter', sans-serif",
      buttonColor: '#1e40af',
      payButtonColor: '#047857',
      borderStyle: 'none',
      borderRadius: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }
  },
  
  minimal: {
    name: 'Minimal',
    styles: {
      headerColor: '#ffffff',
      spacing: '24px',
      fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
      buttonColor: '#000000',
      payButtonColor: '#000000',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
    }
  }
};
