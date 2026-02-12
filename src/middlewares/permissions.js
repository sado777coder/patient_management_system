const Triage = require("../models/Triage");

const permissions = {
  REGISTER_PATIENT: ["admin", "record_officer"],

  PRESCRIBE: ["doctor", "physician_assistant"],

  DISPENSE: ["pharmacist"],

  MATERNITY:["midwife"],

  BILL: ["revenue_officer"],

  LAB_RESULT: ["lab_technician"],

  TRIAGE:  ["nurse"],

  ADMIN: ["doctor","physician_assistant"],

  VIEW_ALL_RECORDS: ["admin","record_officer", "doctor"],

  MANAGE_USERS: ["admin"],
};

module.exports = permissions;