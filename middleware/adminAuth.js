module.exports = function (req, res, next) {
    // Check if user is authenticated and has admin role
    if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Admin access denied' });
    }
    next();
};
