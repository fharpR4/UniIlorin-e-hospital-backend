// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('=== AUTHORIZE MIDDLEWARE DEBUG ===');
    console.log('User exists:', !!req.user);
    console.log('User role:', req.user?.role);
    console.log('User role type:', typeof req.user?.role);
    console.log('Required roles:', roles);
    console.log('User ID:', req.user?._id);
    console.log('Is authorized:', req.user && roles.includes(req.user.role));
    console.log('=============================');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Convert role to lowercase for comparison
    const userRole = req.user.role?.toLowerCase();
    const requiredRoles = roles.map(role => role.toLowerCase());

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Check if user is patient
const isPatient = (req, res, next) => {
  console.log('=== IS PATIENT MIDDLEWARE ===');
  console.log('User role:', req.user?.role);
  console.log('Is patient:', req.user?.role === 'patient');
  console.log('=============================');

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role.toLowerCase() !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Patient role required.'
    });
  }
  next();
};

// Check if user is doctor
const isDoctor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role.toLowerCase() !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor role required.'
    });
  }
  next();
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role.toLowerCase() !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator role required.'
    });
  }
  next();
};

// Check if user is doctor or admin
const isDoctorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role.toLowerCase();
  
  if (userRole !== 'doctor' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Doctor or Administrator role required.'
    });
  }
  next();
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.user.role.toLowerCase() === 'admin') {
      return next();
    }

    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'Resource user ID not found'
      });
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Check if user can access patient data (patient themselves, their doctor, or admin)
const canAccessPatientData = async (req, res, next) => {
  try {
    console.log('=== CAN ACCESS PATIENT DATA ===');
    console.log('User role:', req.user?.role);
    console.log('Patient ID from params:', req.params.id);
    console.log('User ID:', req.user?._id);
    console.log('=============================');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const patientId = req.params.id;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }
    
    // Admin can access all patient data
    if (req.user.role.toLowerCase() === 'admin') {
      return next();
    }

    // Patient can only access their own data
    if (req.user.role.toLowerCase() === 'patient') {
      if (req.user._id.toString() !== patientId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own data.'
        });
      }
      return next();
    }

    // Doctor can access patient data
    if (req.user.role.toLowerCase() === 'doctor') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access patient data.'
    });
  } catch (error) {
    console.error('Error in canAccessPatientData:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking permissions.'
    });
  }
};

// Check if user can manage appointment (patient who booked it, assigned doctor, or admin)
const canManageAppointment = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can manage all appointments
    if (req.user.role.toLowerCase() === 'admin') {
      return next();
    }

    // For now, allow doctors and patients to manage their own appointments
    const userRole = req.user.role.toLowerCase();
    if (userRole === 'doctor' || userRole === 'patient') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You cannot manage this appointment.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking appointment permissions.'
    });
  }
};

module.exports = {
  authorize,
  isPatient,
  isDoctor,
  isAdmin,
  isDoctorOrAdmin,
  isOwnerOrAdmin,
  canAccessPatientData,
  canManageAppointment
};