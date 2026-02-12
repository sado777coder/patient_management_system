const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  getProfile,
  getUsers,
  getUserById,
  updateUser,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
} = require("../controllers/user.controller");

router.use(requireAuth);

router.get("/me", getProfile);

router.get("/", allowRoles(permissions.MANAGE_USERS), getUsers);

router.get("/:id", allowRoles(permissions.MANAGE_USERS), getUserById);

router.put("/:id", allowRoles(permissions.MANAGE_USERS), updateUser);

router.patch("/:id/role", allowRoles(permissions.MANAGE_USERS), changeUserRole);

router.patch("/:id/status", allowRoles(permissions.MANAGE_USERS), toggleUserStatus);

router.delete("/:id", allowRoles(permissions.MANAGE_USERS), deleteUser);

module.exports = router;