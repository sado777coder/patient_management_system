const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/requireAuth");
const allow = require("../middlewares/rbac");
const permission = require("../middlewares/permissions");

const {
  addToQueue,
  nextPatient,
  getUnitQueue,
  transferPatient,
  getTodayAttendance,
  getDashboardStats,
} = require("../controllers/queue.controller");

router.use(requireAuth);

router.post("/",
  allow(permission.TRIAGE,permission.REGISTER_PATIENT),
   addToQueue);
router.patch("/next/:unitId", 
  allow(permission.TRIAGE,permission.REGISTER_PATIENT),
  nextPatient);
router.get("/:unitId", getUnitQueue);
router.post("/transfer", 
  allow(permission.TRIAGE,permission.PRESCRIBE),
  transferPatient);

router.get("/attendance/today", getTodayAttendance);
router.get("/dashboard/queue", getDashboardStats);

module.exports = router;