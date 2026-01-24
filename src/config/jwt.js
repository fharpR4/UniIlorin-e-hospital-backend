const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d'
  });
};

// Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate token
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Cookie options
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict'
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message: 'Authentication successful',
      token,
      refreshToken,
      user
    });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  sendTokenResponse
};





























// ============ former jwt.js ============


// const jwt = require('jsonwebtoken');

// const jwtConfig = {
//   secret: process.env.JWT_SECRET,
//   expiresIn: process.env.JWT_EXPIRE || '7d',
//   refreshSecret: process.env.REFRESH_TOKEN_SECRET,
//   refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d',
//   cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7
// };

// // Generate JWT token
// const generateToken = (userId, role) => {
//   return jwt.sign(
//     { id: userId, role: role },
//     jwtConfig.secret,
//     { expiresIn: jwtConfig.expiresIn }
//   );
// };

// // Generate refresh token
// const generateRefreshToken = (userId) => {
//   return jwt.sign(
//     { id: userId },
//     jwtConfig.refreshSecret,
//     { expiresIn: jwtConfig.refreshExpiresIn }
//   );
// };

// // Verify token
// const verifyToken = (token) => {
//   try {
//     return jwt.verify(token, jwtConfig.secret);
//   } catch (error) {
//     throw new Error('Invalid or expired token');
//   }
// };

// // Verify refresh token
// const verifyRefreshToken = (token) => {
//   try {
//     return jwt.verify(token, jwtConfig.refreshSecret);
//   } catch (error) {
//     throw new Error('Invalid or expired refresh token');
//   }
// };

// // Send token response with cookie
// const sendTokenResponse = (user, statusCode, res) => {
//   // Create token
//   const token = generateToken(user._id, user.role);
//   const refreshToken = generateRefreshToken(user._id);

//   // Cookie options
//   const cookieOptions = {
//     expires: new Date(Date.now() + jwtConfig.cookieExpire * 24 * 60 * 60 * 1000),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict'
//   };

//   // Remove password from output
//   user.password = undefined;

//   res
//     .status(statusCode)
//     .cookie('token', token, cookieOptions)
//     .cookie('refreshToken', refreshToken, cookieOptions)
//     .json({
//       success: true,
//       token,
//       refreshToken,
//       user
//     });
// };

// module.exports = {
//   jwtConfig,
//   generateToken,
//   generateRefreshToken,
//   verifyToken,
//   verifyRefreshToken,
//   sendTokenResponse
// };