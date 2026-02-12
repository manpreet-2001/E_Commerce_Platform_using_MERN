/**
 * Converts relative image URLs to absolute URLs for production
 * @param {string} imageUrl - The image URL from the backend (can be relative or absolute)
 * @returns {string} - Absolute URL for the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If already absolute URL (starts with http:// or https://), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If relative path (starts with /), prepend backend URL
  if (imageUrl.startsWith('/')) {
    const backendUrl = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';
    // Remove trailing slash from backend URL if present
    const baseUrl = backendUrl.replace(/\/$/, '');
    return baseUrl + imageUrl;
  }
  
  // Return as-is if it's neither absolute nor relative
  return imageUrl;
};
