/**
 * Role-Based Access Control middleware
 * allowedRoles = array of roles that can access the route
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // If user is not authenticated
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    // If user role is not allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied: insufficient permissions'
      });
    }

    // Role allowed → continue
    next();
  };
};
