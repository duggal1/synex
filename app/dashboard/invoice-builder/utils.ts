export const validateTemplate = (html: string): boolean => {
  // Required elements with alternative classes/selectors
  const requiredElements = [
    {
      name: 'Container',
      selectors: ['.email-container', '.main-table', 'body', 'table', 'tr', 'td']
    },
    {
      name: 'Header',
      selectors: ['.header-container', 'header', '.header', 'h1', '.invoice-title', 'bgcolor']
    },
    {
      name: 'Content',
      selectors: [
        '.content-container', 
        '.invoice-items', 
        '.main-content', 
        '.items-table', 
        '.summary-container',
        '.parties-container',
        '.note-section',
        '.button-container',
        '.payment-info'
      ]
    },
    {
      name: 'Items Table',
      selectors: ['.items-table', 'table', 'thead', 'tbody', 'th', 'td']
    }
  ];
  
  const htmlLower = html.toLowerCase();
  
  console.debug('Validating template HTML:', html.substring(0, 100) + '...');
  
  // Log found selectors for debugging
  requiredElements.forEach(element => {
    element.selectors.forEach(selector => {
      const found = htmlLower.includes(selector.toLowerCase());
      console.debug(`Selector ${selector} for ${element.name}: ${found ? 'Found' : 'Not found'}`);
    });
  });
  
  // Check if at least one selector from each required element exists
  const validStructure = requiredElements.every(element => {
    const hasSelector = element.selectors.some(selector => {
      const selectorExists = htmlLower.includes(selector.toLowerCase());
      if (!selectorExists) {
        console.debug(`Missing selector: ${selector} for ${element.name}`);
      }
      return selectorExists;
    });
    
    if (!hasSelector) {
      console.error(`Missing required element: ${element.name}`);
    }
    return hasSelector;
  });
  
  // Special case for table-based templates
  const isTableBased = htmlLower.includes('class="main-table"') || 
                       htmlLower.includes('cellpadding="0"') ||
                       htmlLower.includes('cellspacing="0"');
                       
  // If it's a table-based template and we failed validation, let's be more lenient
  if (isTableBased && !validStructure) {
    console.debug('Table-based template detected, using more lenient validation');
    // For table-based templates, we'll consider it valid if it has tables and some basic structure
    const hasBasicStructure = 
      htmlLower.includes('table') && 
      htmlLower.includes('tr') && 
      htmlLower.includes('td') &&
      (htmlLower.includes('header') || htmlLower.includes('h1') || htmlLower.includes('title'));
      
    if (hasBasicStructure) {
      console.debug('Table-based template has basic structure, considering it valid');
      return true;
    }
  }
  
  if (!validStructure) {
    console.debug('Template structure validation failed. HTML preview:', html.substring(0, 500));
  } else {
    console.debug('Template validation successful');
  }
  
  return validStructure;
};