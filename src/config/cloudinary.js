const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify Cloudinary configuration
const verifyCloudinaryConfig = () => {
  const isConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (isConfigured) {
    console.log('Cloudinary configuration verified successfully');
  } else {
    console.warn('Cloudinary configuration incomplete. File upload will be disabled.');
  }

  return isConfigured;
};

// Storage configurations for different file types
const createStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `e-hospital/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [{ quality: 'auto' }]
    }
  });
};

// Storage for profile images
const profileImageStorage = createStorage('profiles', ['jpg', 'jpeg', 'png']);

// Storage for medical documents
const medicalDocumentStorage = createStorage('medical-documents', ['jpg', 'jpeg', 'png', 'pdf']);

// Storage for lab results
const labResultStorage = createStorage('lab-results', ['jpg', 'jpeg', 'png', 'pdf']);

// Storage for prescription images
const prescriptionStorage = createStorage('prescriptions', ['jpg', 'jpeg', 'png', 'pdf']);

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'general') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `e-hospital/${folder}`,
      resource_type: 'auto'
    });

    return {
      public_id: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Generate optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const { width = 500, height = 500, crop = 'fill', quality = 'auto' } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality }
    ]
  });
};

module.exports = {
  cloudinary,
  verifyCloudinaryConfig,
  profileImageStorage,
  medicalDocumentStorage,
  labResultStorage,
  prescriptionStorage,
  uploadImage,
  deleteImage,
  getOptimizedImageUrl
};