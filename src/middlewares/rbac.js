const allow = (...permissionGroups) => {
  const allowedRoles = permissionGroups.flat();

  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      console.log("ROLE:", req.user.role, "ALLOWED:", allowedRoles);
      return res.status(403).json({
        message: `Forbidden: role '${req.user.role}' not allowed`,
        allowed: allowedRoles
      });
    }
    next();
  };
};

module.exports = allow;