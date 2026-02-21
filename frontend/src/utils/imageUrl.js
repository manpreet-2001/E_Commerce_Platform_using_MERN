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
  
  // Relative path: leading slash (e.g. /uploads/xyz.jpg) or backend path without slash (e.g. uploads/xyz.jpg)
  const isRelativePath = trimmedUrl.startsWith('/') || trimmedUrl.startsWith('uploads/');
  if (isRelativePath) {
    const pathWithSlash = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
    const backendUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';

    if (!backendUrl) {
      console.error('❌ REACT_APP_API_BASE environment variable is not set!');
      console.error('   Image URL:', trimmedUrl);
      console.error('   Set REACT_APP_API_BASE to your backend URL in production (e.g. https://your-api.onrender.com).');
      return pathWithSlash;
    }

    const baseUrl = backendUrl.replace(/\/$/, '');
    const fullUrl = baseUrl + pathWithSlash;
    if (process.env.NODE_ENV === 'development') {
      console.log('Image URL conversion:', { original: trimmedUrl, fullUrl });
    }
    return fullUrl;
  }

  // data: URLs or other formats — return as-is
  return trimmedUrl;
};
