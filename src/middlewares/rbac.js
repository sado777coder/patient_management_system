const allow = (...permissionGroups) => {
  const allowedRoles = permissionGroups.flat().filter(Boolean);

  if (!allowedRoles.length) {
    // fallback to an empty middleware function
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: no user attached" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: role '${req.user.role}' not allowed`,
        allowed: allowedRoles
      });
    }

    next();
  };
};

module.exports = allow;