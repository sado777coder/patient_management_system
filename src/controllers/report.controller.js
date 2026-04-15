const { Parser } = require("json2csv");
const crypto = require("crypto");

const Dispense = require("../models/Dispense");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const Diagnosis = require("../models/Diagnosis");
const Abortion = require("../models/Abortion");
const AntenatalVisit = require("../models/AntenatalVisit");
const Delivery = require("../models/Delivery");
const PostnatalVisit = require("../models/PostnatalVisit");
const Referral = require("../models/Referral");
const Pregnancy = require("../models/Pregnancy");
const redis = require("../config/redis");

// ---------------------- SHARED CSV HELPER ----------------------
const sendCSV = (res, rows, filename, fields) => {
  const parser = new Parser({ fields, quote: '"', header: true });
  const csv = parser.parse(rows);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  return res.status(200).send(csv);
};

//-----------Date format-----------------
const formatDate = (date) =>
  date ? date.toISOString().slice(0, 10) : "";

// ---------------------- FILTER BUILDER (FIXED) ----------------------
const applyCommonFilters = (query, hospital, allowSearch = false) => {
  const { from, to, unit, q } = query;

  const filter = { hospital };

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  if (unit) {
    filter.unit = unit;
  }

  if (allowSearch && q) {
    const regex = new RegExp(q, "i");
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { phone: regex }
    ];
  }

  return filter;
};

// ---------------------- REDIS CACHING HELPER ----------------------
const cacheCSV = async (keyPrefix, hospital, query, generatorFn) => {
  const sortedQuery = Object.keys(query || {})
    .sort()
    .reduce((acc, key) => {
      acc[key] = query[key];
      return acc;
    }, {});

  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(sortedQuery))
    .digest("hex");

  const cacheKey = `csv:${keyPrefix}:${hospital}:${hash}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const rows = await generatorFn();

  await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);
  return rows;
};

// ---------------------- PATIENTS ----------------------
const exportPatientsCSV = async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital, true);
    filter.isDeleted = false;

    const rows = await cacheCSV("patients", req.user.hospital, req.query, async () => {
      const patients = await Patient.find(filter)
        .populate("unit", "name code")
        .lean();

      return patients.map(p => ({
        hospital: p.hospital || "",
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        phone: p.phone || "",
        gender: p.gender || "",
        unit: p.unit?.name || "",
        unitCode: p.unit?.code || "",
        createdAt: formatDate(p.createdAt),
      }));
    });

    sendCSV(res, rows, "patients-report.csv", [
      "hospital","firstName","lastName","phone","gender","unit","unitCode","createdAt"
    ]);
  } catch (err) { next(err); }
};

// ---------------------- DIAGNOSIS ----------------------
const exportDiagnosisCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("diagnoses", req.user.hospital, req.query, async () => {
      const data = await Diagnosis.find({ hospital: req.user.hospital })
        .populate({
          path: "visit",
          populate: { path: "patient", select: "firstName lastName hospital" }
        })
        .populate("diagnosedBy", "name")
        .lean();

      return data.map(d => ({
        hospital: d.hospital || "",
        patient: `${d.visit?.patient?.firstName || ""} ${d.visit?.patient?.lastName || ""}`,
        diagnosedBy: d.diagnosedBy?.name || "",
        symptoms: d.symptoms || "",
        signs: d.signs || "",
        diagnosis: d.diagnosis || "",
        investigations: d.investigations?.join("; ") || "",
        notes: d.notes || "",
        date: formatDate(d.createdAt)
      }));
    });

    sendCSV(res, rows, "diagnoses-report.csv", [
      "hospital","patient","diagnosedBy","symptoms","signs","diagnosis","investigations","notes","date"
    ]);
  } catch (err) { next(err); }
};

// ---------------------- PRESCRIPTIONS ----------------------
const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("prescriptions", req.user.hospital, req.query, async () => {
      const prescriptions = await Prescription.find({
        hospital: req.user.hospital,
        isDeleted: false
      })
        .populate({
          path: "visit",
          populate: { path: "patient", select: "hospital firstName lastName" }
        })
        .populate({
          path: "medications.medication",
          model: "Medication",
          select: "name"
        })
        .lean();

      return prescriptions.flatMap(p =>
        (p.medications || []).map(m => ({
          hospital: p.visit?.patient?.hospital || "",
          patient: `${p.visit?.patient?.firstName || ""} ${p.visit?.patient?.lastName || ""}`,
          medication: m.medication?.name || "Unknown Medication",
          dosage: m.dosage || "",
          frequency: m.frequency || "",
          duration: m.duration || "",
          date: formatDate(p.createdAt)
        }))
      );
    });

    sendCSV(res, rows, "prescriptions-report.csv", [
      "hospital","patient","medication","dosage","frequency","duration","date"
    ]);
  } catch (err) { next(err); }
};

// ---------------------- LABS ----------------------
const exportLabsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("labs", req.user.hospital, req.query, async () => {
      const data = await Lab.find({})
        .populate({
          path: "patient",
          match: { hospital: req.user.hospital },
          select: "hospital firstName lastName"
        })
        .lean();

      return data
        .filter(l => l.patient)
        .map(l => ({
          hospital: l.patient?.hospital || "",
          patient: `${l.patient?.firstName || ""} ${l.patient?.lastName || ""}`,
          test: l.testName,
          result: l.result,
          status: l.status,
          date: formatDate(l.createdAt)
        }));
    });

    sendCSV(res, rows, "labs-report.csv", [
      "hospital","patient","test","result","status","date"
    ]);
  } catch (err) { next(err); }
};

// ---------------------- MEDICAL RECORDS ----------------------
const exportMedicalRecordsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("medical", req.user.hospital, req.query, async () => {
      const data = await MedicalRecord.find({ hospital: req.user.hospital })
        .populate("patient", "hospital firstName lastName")
        .lean();

      return data.map(r => ({
        hospital: r.patient?.hospital || "",
        patient: `${r.patient?.firstName || ""} ${r.patient?.lastName || ""}`,
        diagnosis: r.diagnosis,
        notes: r.notes,
        doctor: r.doctor,
        date: formatDate(r.createdAt)
      }));
    });

    sendCSV(res, rows, "medical-records-report.csv", [
      "hospital","patient","diagnosis","notes","doctor","date"
    ]);
  } catch (err) { next(err); }
};

// ---------------------- DISPENSE ----------------------
const exportDispenseCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("dispense", req.user.hospital, req.query, async () => {
      const data = await Dispense.find({ hospital: req.user.hospital })
        .populate("patient", "firstName lastName hospital")
        .populate("dispensedBy", "name")
        .populate({
          path: "items.medication",
          populate: { path: "medication", model: "Medication", select: "name" }
        })
        .lean();

      return data.flatMap(d =>
        (d.items || []).map(i => ({
          hospital: d.patient?.hospital || "",
          patient: `${d.patient?.firstName || ""} ${d.patient?.lastName || ""}`,
          medication: i.medication?.medication?.name || "",
          quantity: i.quantity || 0,
          unitPrice: i.price || 0,
          totalAmount: d.totalAmount || 0,
          dispensedBy: d.dispensedBy?.name || "",
          date: formatDate(d.createdAt)
        }))
      );
    });

    sendCSV(res, rows, "dispense-report.csv", [
      "hospital","patient","medication","quantity","unitPrice","totalAmount","dispensedBy","date"
    ]);
  } catch (err) { next(err); }
};

// ---------------------- MATERNITY  ----------------------

// Antenatal
const exportAntenatalCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("antenatal", req.user.hospital, req.query, async () => {
      const visits = await AntenatalVisit.find()
        .populate({
          path: "pregnancy",
          match: { hospital: req.user.hospital },
          populate: { path: "patient" }
        })
        .lean();

      return visits
        .filter(v => v.pregnancy)
        .map(v => ({
          hospital: v.pregnancy?.hospital || "",
          patient: `${v.pregnancy?.patient?.firstName || ""} ${v.pregnancy?.patient?.lastName || ""}`,
          visitDate: formatDate(v.visitDate),
          gestationalAgeWeeks: v.gestationalAgeWeeks || "",
          bloodPressure: v.bloodPressure || "",
          weight: v.weight || "",
          fetalHeartRate: v.fetalHeartRate || "",
          riskLevel: v.riskLevel || "",
          notes: v.notes || ""
        }));
    });

    sendCSV(res, rows, "antenatal-visits-report.csv", [
      "hospital","patient","visitDate","gestationalAgeWeeks","bloodPressure","weight","fetalHeartRate","riskLevel","notes"
    ]);
  } catch (err) { next(err); }
};

// Abortion
const exportAbortionsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("abortions", req.user.hospital, req.query, async () => {
      const abortions = await Abortion.find()
        .populate({
          path: "pregnancy",
          match: { hospital: req.user.hospital },
          populate: { path: "patient" }
        })
        .lean();

      return abortions
        .filter(a => a.pregnancy)
        .map(a => ({
          hospital: a.pregnancy?.hospital || "",
          patient: `${a.pregnancy?.patient?.firstName || ""} ${a.pregnancy?.patient?.lastName || ""}`,
          date: formatDate(a.date),
          type: a.type || "",
          gestationalAgeWeeks: a.gestationalAgeWeeks || "",
          complications: a.complications || "",
          notes: a.notes || ""
        }));
    });

    sendCSV(res, rows, "abortions-report.csv", [
      "hospital","patient","date","type","gestationalAgeWeeks","complications","notes"
    ]);
  } catch (err) { next(err); }
};

// Delivery
const exportDeliveriesCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("deliveries", req.user.hospital, req.query, async () => {
      const deliveries = await Delivery.find()
        .populate({
          path: "pregnancy",
          match: { hospital: req.user.hospital },
          populate: { path: "patient" }
        })
        .lean();

      return deliveries
        .filter(d => d.pregnancy)
        .map(d => ({
          hospital: d.pregnancy?.hospital || "",
          patient: `${d.pregnancy?.patient?.firstName || ""} ${d.pregnancy?.patient?.lastName || ""}`,
          deliveryDate: formatDate(d.deliveryDate),
          type: d.type || "",
          babyWeight: d.babyWeight || "",
          babyGender: d.babyGender || "",
          complications: d.complications || ""
        }));
    });

    sendCSV(res, rows, "deliveries-report.csv", [
      "hospital","patient","deliveryDate","type","babyWeight","babyGender","complications"
    ]);
  } catch (err) { next(err); }
};

// Postnatal
const exportPostnatalCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("postnatal", req.user.hospital, req.query, async () => {
      const visits = await PostnatalVisit.find()
        .populate({
          path: "pregnancy",
          match: { hospital: req.user.hospital },
          populate: { path: "patient" }
        })
        .lean();

      return visits
        .filter(v => v.pregnancy)
        .map(v => ({
          hospital: v.pregnancy?.hospital || "",
          patient: `${v.pregnancy?.patient?.firstName || ""} ${v.pregnancy?.patient?.lastName || ""}`,
          visitDate: formatDate(v.visitDate),
          motherCondition: v.motherCondition || "",
          bloodPressure: v.bloodPressure || "",
          temperature: v.temperature || "",
          complications: v.complications || "",
          notes: v.notes || ""
        }));
    });

    sendCSV(res, rows, "postnatal-visits-report.csv", [
      "hospital","patient","visitDate","motherCondition","bloodPressure","temperature","complications","notes"
    ]);
  } catch (err) { next(err); }
};

// Referrals
const exportReferralsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("referrals", req.user.hospital, req.query, async () => {
      const referrals = await Referral.find()
        .populate({
          path: "pregnancy",
          match: { hospital: req.user.hospital },
          populate: { path: "patient" }
        })
        .lean();

      return referrals
        .filter(r => r.pregnancy)
        .map(r => ({
          hospital: r.pregnancy?.hospital || "",
          patient: `${r.pregnancy?.patient?.firstName || ""} ${r.pregnancy?.patient?.lastName || ""}`,
          referredTo: r.referredTo || "",
          reason: r.reason || "",
          referralDate: formatDate(r.referralDate),
          status: r.status || "",
          notes: r.notes || ""
        }));
    });

    sendCSV(res, rows, "referrals-report.csv", [
      "hospital","patient","referredTo","reason","referralDate","status","notes"
    ]);
  } catch (err) { next(err); }
};

module.exports = {
  exportPatientsCSV,
  exportDispenseCSV,
  exportDiagnosisCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
  exportAntenatalCSV,
  exportAbortionsCSV,
  exportDeliveriesCSV,
  exportPostnatalCSV,
  exportReferralsCSV
};