const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        
        if (!req.user) {
            return res.status(401).json({
                message: "Not logged in"
            })
        }

        // Admin full control
        if (req.user.role === "admin") {
            return next();
        }

        // Role Check
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Permission denied"
            });
        }

        next();
    }
}

module.exports = roleMiddleware;