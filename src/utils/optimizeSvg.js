/**
 * Optimizes SVG content for better compatibility and smaller file size
 * @param {string} svgDataUrl - The SVG data URL from html-to-image
 * @returns {string} - Optimized SVG data URL
 */
export function optimizeSvg(svgDataUrl) {
  try {
    // Extract SVG content from data URL
    const svgContent = atob(svgDataUrl.split(',')[1]);
    
    // Parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    // Remove unnecessary attributes and elements
    const elementsToRemove = svgElement.querySelectorAll('style[data-emotion], script, .semi-icon');
    elementsToRemove.forEach(el => el.remove());
    
    // Optimize inline styles - remove redundant CSS
    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style) {
        // Remove common redundant styles
        el.style.removeProperty('pointer-events');
        el.style.removeProperty('user-select');
        el.style.removeProperty('-webkit-user-select');
        el.style.removeProperty('cursor');
      }
    });
    
    // Set proper SVG attributes for better compatibility
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Ensure viewBox is set for proper scaling
    if (!svgElement.getAttribute('viewBox')) {
      const width = svgElement.getAttribute('width') || '800';
      const height = svgElement.getAttribute('height') || '600';
      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    
    // Serialize back to string
    const serializer = new XMLSerializer();
    const optimizedSvg = serializer.serializeToString(svgElement);
    
    // Create new data URL
    const optimizedDataUrl = `data:image/svg+xml;base64,${btoa(optimizedSvg)}`;
    
    return optimizedDataUrl;
  } catch (error) {
    console.warn('SVG optimization failed, returning original:', error);
    return svgDataUrl;
  }
}

/**
 * Estimates the file size reduction from SVG optimization
 * @param {string} originalSvg - Original SVG data URL
 * @param {string} optimizedSvg - Optimized SVG data URL  
 * @returns {object} - Size comparison object
 */
export function getSvgSizeComparison(originalSvg, optimizedSvg) {
  const originalSize = originalSvg.length;
  const optimizedSize = optimizedSvg.length;
  const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  
  return {
    originalSize: `${(originalSize / 1024).toFixed(1)} KB`,
    optimizedSize: `${(optimizedSize / 1024).toFixed(1)} KB`,
    reduction: `${reduction}%`
  };
}