const allow = (...permissionGroups) => {
  const allowedRoles = permissionGroups.flat().filter(Boolean); // remove undefined/null

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

    next(); // always call next
  };
};

module.exports = allow;