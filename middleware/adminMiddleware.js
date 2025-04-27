const adminOnly = (req, res, next) => {
  try {
    // Check if user exists and is an admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    next(); // User is admin, continue to the next middleware/controller
  } catch (err) {
    console.error('Admin middleware error:', err.message);
    res.status(500).json({ msg: 'Server error in admin check.' });
  }
};

module.exports = adminOnly;
