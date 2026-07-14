const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const type = req.user.type; // 'parent' or 'staff'
        const role = req.user.role; // 'viewer', 'staff', 'admin' or undefined
        
        // 1. Parent/User endpoints
        if (requiredRole === 'parent' || requiredRole === 'user') {
            if (type !== 'parent' && type !== 'past_student') {
                return res.status(403).json({ message: 'Access denied. Basic users only.' });
            }
            return next();
        }

        // 2. Staff endpoint handling
        if (type !== 'staff') {
            return res.status(403).json({ message: 'Access denied. Staff only.' });
        }

        // Broad staff actions (like fetching requests or verifying)
        if (requiredRole === 'staff') {
            // Rigid VIEWER sandbox preventing creation, updates, and deletes system-wide
            if (role === 'viewer' && req.method !== 'GET') {
                return res.status(403).json({ message: 'Access denied. Viewers are restricted to strictly read-only mode.' });
            }
            return next();
        }

        // 3. Admin tier (manages all users and staff on the site)
        if (requiredRole === 'admin' || requiredRole === 'super_admin') {
            if (role !== 'admin' && role !== 'super_admin') {
                return res.status(403).json({ message: 'Access denied. Admin tier authorization required.' });
            }
            return next();
        }

        return res.status(403).json({ message: 'Access denied. Invalid target role parameters.' });
    }
};

module.exports = requireRole;
