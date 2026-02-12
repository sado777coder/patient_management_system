const allow = (permissionRoles) => {
  return (req, res, next) => {
    if (!permissionRoles.includes(req.user.role)) {
      console.log("ROLE:", req.user.role, "ALLOWED:", permissionRoles);
      return res.status(403).json({
        message: `Forbidden: role '${req.user.role}' not allowed`,
        allowed: permissionRoles
      });
    }
    next();
  };
};

module.exports = allow;