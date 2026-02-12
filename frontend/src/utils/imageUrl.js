/**
 * Converts relative image URLs to absolute URLs for production
 * @param {string} imageUrl - The image URL from the backend (can be relative or absolute)
 * @returns {string} - Absolute URL for the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return null;
  }
  
  const trimmedUrl = imageUrl.trim();
  
  // If already absolute URL (starts with http:// or https://), return as-is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // If relative path (starts with /), prepend backend URL
  if (trimmedUrl.startsWith('/')) {
    const backendUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';
    
    // If no backend URL is set, log warning (but still return relative for dev)
    if (!backendUrl && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ REACT_APP_API_BASE not set - images may not load in production');
    }
    
    // Remove trailing slash from backend URL if present
    const baseUrl = backendUrl.replace(/\/$/, '');
    const fullUrl = baseUrl + trimmedUrl;
    
    // Debug in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Image URL conversion:', { original: trimmedUrl, backendUrl, fullUrl });
    }
    
    return fullUrl;
  }
  
  // Return as-is if it's neither absolute nor relative
  return trimmedUrl;
};
