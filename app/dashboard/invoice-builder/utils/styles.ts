export const injectStyles = (template: string, css: string): string => {
  // Check if there's an existing style tag
  const hasStyle = /<style[^>]*>[\s\S]*?<\/style>/i.test(template);
  
  if (hasStyle) {
    // Append CSS to existing style tag
    return template.replace(
      /(<style[^>]*>)([\s\S]*?)(<\/style>)/i,
      `$1$2\n${css}$3`
    );
  } else {
    // Add new style tag before closing head tag or at the start of the template
    const hasHead = /<\/head>/i.test(template);
    if (hasHead) {
      return template.replace(
        '</head>',
        `<style>${css}</style></head>`
      );
    } else {
      return `<style>${css}</style>${template}`;
    }
  }
};
