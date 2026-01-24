// Success response
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Created response
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data
  });
};

// Error response
const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Validation error response
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors
  });
};

// Not found response
const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message
  });
};

// Unauthorized response
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    message
  });
};

// Forbidden response
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

// Paginated response
const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
};

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse
};
















// =================== former responseHandler.js ===================



// const { HTTP_STATUS } = require('./constants');

// // Success response
// const successResponse = (res, data, message = 'Success', statusCode = HTTP_STATUS.OK) => {
//   return res.status(statusCode).json({
//     success: true,
//     message,
//     data
//   });
// };

// // Error response
// const errorResponse = (res, message = 'Error', statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) => {
//   const response = {
//     success: false,
//     message
//   };

//   if (errors) {
//     response.errors = errors;
//   }

//   return res.status(statusCode).json(response);
// };

// // Created response (201)
// const createdResponse = (res, data, message = 'Resource created successfully') => {
//   return res.status(HTTP_STATUS.CREATED).json({
//     success: true,
//     message,
//     data
//   });
// };

// // Updated response (200)
// const updatedResponse = (res, data, message = 'Resource updated successfully') => {
//   return res.status(HTTP_STATUS.OK).json({
//     success: true,
//     message,
//     data
//   });
// };

// // Deleted response (200)
// const deletedResponse = (res, message = 'Resource deleted successfully') => {
//   return res.status(HTTP_STATUS.OK).json({
//     success: true,
//     message
//   });
// };

// // Not found response (404)
// const notFoundResponse = (res, message = 'Resource not found') => {
//   return res.status(HTTP_STATUS.NOT_FOUND).json({
//     success: false,
//     message
//   });
// };

// // Unauthorized response (401)
// const unauthorizedResponse = (res, message = 'Unauthorized access') => {
//   return res.status(HTTP_STATUS.UNAUTHORIZED).json({
//     success: false,
//     message
//   });
// };

// // Forbidden response (403)
// const forbiddenResponse = (res, message = 'Access forbidden') => {
//   return res.status(HTTP_STATUS.FORBIDDEN).json({
//     success: false,
//     message
//   });
// };

// // Validation error response (400)
// const validationErrorResponse = (res, errors, message = 'Validation failed') => {
//   return res.status(HTTP_STATUS.BAD_REQUEST).json({
//     success: false,
//     message,
//     errors
//   });
// };

// // Conflict response (409)
// const conflictResponse = (res, message = 'Resource already exists') => {
//   return res.status(HTTP_STATUS.CONFLICT).json({
//     success: false,
//     message
//   });
// };

// // Server error response (500)
// const serverErrorResponse = (res, message = 'Internal server error') => {
//   return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
//     success: false,
//     message
//   });
// };

// // Paginated response
// const paginatedResponse = (res, data, pagination, message = 'Success') => {
//   return res.status(HTTP_STATUS.OK).json({
//     success: true,
//     message,
//     data,
//     pagination: {
//       total: pagination.total,
//       page: pagination.page,
//       limit: pagination.limit,
//       totalPages: pagination.totalPages,
//       hasNextPage: pagination.hasNextPage,
//       hasPrevPage: pagination.hasPrevPage
//     }
//   });
// };

// // File upload success response
// const fileUploadSuccessResponse = (res, fileInfo, message = 'File uploaded successfully') => {
//   return res.status(HTTP_STATUS.OK).json({
//     success: true,
//     message,
//     file: fileInfo
//   });
// };

// // Custom response
// const customResponse = (res, statusCode, success, message, data = null) => {
//   const response = {
//     success,
//     message
//   };

//   if (data) {
//     response.data = data;
//   }

//   return res.status(statusCode).json(response);
// };

// module.exports = {
//   successResponse,
//   errorResponse,
//   createdResponse,
//   updatedResponse,
//   deletedResponse,
//   notFoundResponse,
//   unauthorizedResponse,
//   forbiddenResponse,
//   validationErrorResponse,
//   conflictResponse,
//   serverErrorResponse,
//   paginatedResponse,
//   fileUploadSuccessResponse,
//   customResponse
// };