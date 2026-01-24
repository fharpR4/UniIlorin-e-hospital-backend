const multer = require('multer');
const path = require('path');
const {
  profileImageStorage,
  medicalDocumentStorage,
  labResultStorage,
  prescriptionStorage
} = require('../config/cloudinary');

// File filter function
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    // Check file type
    const allowedMimeTypes = allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Only ${allowedMimeTypes.join(', ')} files are allowed.`
        ),
        false
      );
    }
  };
};

// File size limit
const fileSizeLimit = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

// Profile image upload
const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: {
    fileSize: fileSizeLimit
  },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg'])
});

// Medical document upload
const uploadMedicalDocument = multer({
  storage: medicalDocumentStorage,
  limits: {
    fileSize: fileSizeLimit
  },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
});

// Lab result upload
const uploadLabResult = multer({
  storage: labResultStorage,
  limits: {
    fileSize: fileSizeLimit
  },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
});

// Prescription upload
const uploadPrescription = multer({
  storage: prescriptionStorage,
  limits: {
    fileSize: fileSizeLimit
  },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
});

// Generic file upload with custom options
const createUpload = (options = {}) => {
  const {
    storage = profileImageStorage,
    maxSize = fileSizeLimit,
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  } = options;

  return multer({
    storage: storage,
    limits: {
      fileSize: maxSize
    },
    fileFilter: fileFilter(allowedTypes)
  });
};

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${fileSizeLimit / (1024 * 1024)}MB.`
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload.'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.'
    });
  }

  next();
};

// Validate uploaded file
const validateUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file.'
    });
  }
  next();
};

// Extract file info
const extractFileInfo = (req, res, next) => {
  if (req.file) {
    req.fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: req.file.path // Cloudinary returns path as URL
    };
  }

  if (req.files && Array.isArray(req.files)) {
    req.filesInfo = req.files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: file.path
    }));
  }

  next();
};

module.exports = {
  uploadProfileImage,
  uploadMedicalDocument,
  uploadLabResult,
  uploadPrescription,
  createUpload,
  handleUploadError,
  validateUpload,
  extractFileInfo
};