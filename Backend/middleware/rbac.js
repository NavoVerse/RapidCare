/**
 * Role-Based Access Control Middleware
 * 
 * Ensures that the authenticated user has one of the allowed roles.
 * Must be used AFTER the authenticateToken middleware.
 * 
 * @param  {...string} allowedRoles - The roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
};

module.exports = { authorize };
