const express = require("express");
const router = express.Router();
const allow = require("../middlewares/rbac");
const permission = require("../middlewares/permissions");
const requireAuth = require("../middlewares/requireAuth");

const {
  exportPatientsCSV,
  exportDispenseCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
  exportAntenatalCSV,
  exportAbortionsCSV,
  exportDeliveriesCSV,
  exportPostnatalCSV,
  exportReferralsCSV,
} = require("../controllers/report.controller");

router.use(requireAuth);

router.get("/patients/csv",
    allow(permission.REGISTER_PATIENT,permission.MANAGE_USERS),
     exportPatientsCSV
);

router.get("/dispense/csv",
    allow(permission.DISPENSE,permission.MANAGE_USERS),
      exportDispenseCSV
);

router.get("/prescriptions/csv",
    allow(permission.PRESCRIBE,permission.MANAGE_USERS),
       exportPrescriptionsCSV
);

router.get("/labs/csv",
    allow(permission.LAB_RESULT,permission.MANAGE_USERS),
       exportLabsCSV
);

router.get("/medicalRecords/csv",
    allow(permission.DISPENSE,permission.MANAGE_USERS),
        exportMedicalRecordsCSV
);

router.get("/ exportAntenatal/csv",
    allow(permission.MATERNITY,permission.MANAGE_USERS),
        exportAntenatalCSV
);

router.get("/exportAbortions/csv",
    allow(permission.MATERNITY,permission.MANAGE_USERS),
       exportAbortionsCSV
);

router.get("/exportDeliveries/csv",
    allow(permission.MATERNITY,permission.MANAGE_USERS),
      exportDeliveriesCSV
);

router.get("/exportPostnatal/csv",
    allow(permission.MATERNITY,permission.MANAGE_USERS),
     exportPostnatalCSV
);

router.get("/ exportReferrals/csv",
    allow(permission.MATERNITY,permission.MANAGE_USERS),
     exportReferralsCSV
);

module.exports = router;