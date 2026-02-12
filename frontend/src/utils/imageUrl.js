/**
 * Converts relative image URLs to absolute URLs for production
 * @param {string} imageUrl - The image URL from the backend (can be relative or absolute)
 * @returns {string|null} - Absolute URL for the image, or null if invalid
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
    let backendUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';
    
    // If no backend URL is set, log detailed error
    if (!backendUrl) {
      console.error('❌ REACT_APP_API_BASE environment variable is not set!');
      console.error('   Image URL:', trimmedUrl);
      console.error('   This will cause images to fail loading in production.');
      console.error('   Solution: Set REACT_APP_API_BASE in your deployment platform:');
      console.error('   - Render: Go to your frontend service → Environment → Add REACT_APP_API_BASE');
      console.error('   - Value should be your backend URL, e.g., https://your-backend.onrender.com');
      // Still return the relative URL - browser might handle it if same origin
      // But it will likely fail and trigger onError handler
      return trimmedUrl;
    }
    
    // Remove trailing slash from backend URL if present
    const baseUrl = backendUrl.replace(/\/$/, '');
    const fullUrl = baseUrl + trimmedUrl;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Image URL conversion:', { original: trimmedUrl, backendUrl, fullUrl });
    }
    
    return fullUrl;
  }
  
  // Return as-is if it's neither absolute nor relative (might be a data URL or other format)
  return trimmedUrl;
};
