const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = !!(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

/**
 * Upload a file buffer to Cloudinary (base64 data URI).
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} [mimetype] - e.g. image/jpeg
 * @param {string} [folder] - Optional folder in Cloudinary (e.g. 'products')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadBuffer(buffer, mimetype, folder = 'ecommerce') {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  }
  const dataUri = `data:${mimetype || 'image/jpeg'};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image'
  });
  if (!result || !result.secure_url) throw new Error('No URL returned from Cloudinary');
  return { url: result.secure_url, publicId: result.public_id };
}

// Use Cloudinary when credentials are set, unless USE_CLOUDINARY is explicitly 'false'
const useCloudinary = isConfigured && process.env.USE_CLOUDINARY !== 'false';

module.exports = {
  cloudinary,
  isConfigured: useCloudinary,
  uploadBuffer
};
