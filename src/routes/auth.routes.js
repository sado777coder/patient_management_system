const router = require("express").Router();

const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const allowRoles = require("../middlewares/rbac");
const permissions = require("../middlewares/permissions");

const {
  registerUser,
  loginUser,
} = require("../controllers/user.controller");

const {
  registerUserValidator,
  loginUserValidator,
} = require("../validators/user.validator");


// login is public
router.post("/login", validate(loginUserValidator), loginUser);


// everything below requires auth
router.use(requireAuth);

router.post(
  "/register",
  allowRoles(permissions.MANAGE_USERS),
  validate(registerUserValidator),
  registerUser
);

module.exports = router;