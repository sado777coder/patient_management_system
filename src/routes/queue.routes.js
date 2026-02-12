const express = require("express");
const router = express.Router();
const requireAuth = require("../middlewares/requireAuth");

const {
  addToQueue,
  nextPatient,
  getUnitQueue,
  transferPatient,
  getTodayAttendance,
  getDashboardStats,
} = require("../controllers/queue.controller");

router.use(requireAuth);

router.post("/", addToQueue);
router.patch("/next/:unitId", nextPatient);
router.get("/:unitId", getUnitQueue);
router.post("/transfer", transferPatient);

router.get("/attendance/today", getTodayAttendance);
router.get("/dashboard/queue", getDashboardStats);

module.exports = router;