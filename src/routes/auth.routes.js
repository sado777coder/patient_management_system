const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  registerUser,
  loginUser,
  changePassword
} = require("../controllers/user.controller");

const {
  registerUserValidator,
  loginUserValidator,
} = require("../validators/user.validator");


// login is public
router.post("/login", validate(loginUserValidator), loginUser);

// everything below requires auth
router.post(
  "/change-password",
  requireAuth,
  changePassword
);

router.post(
  "/register",
  requireAuth, 
  allowRoles(permissions.SUPER_ADMIN, permissions.MANAGE_USERS),
  validate(registerUserValidator),
  registerUser
);

module.exports = router;