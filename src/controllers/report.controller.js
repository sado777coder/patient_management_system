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
const redis = require("../config/redis");

// ---------------------- CSV ----------------------
const sendCSV = (res, rows, filename, fields) => {
  const parser = new Parser({ fields, quote: '"', header: true });
  const csv = parser.parse(rows);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  return res.status(200).send(csv);
};

// ---------------------- DATE ----------------------
const formatDate = (date) =>
  date ? date.toISOString().slice(0, 10) : "";

// ---------------------- COMMON FILTER ----------------------
const applyCommonFilters = (query, hospital, allowSearch = false) => {
  const { from, to, unit, q } = query;

  const filter = { hospital };

  if (from || to) {
    filter.createdAt = {};

    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }

    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (unit) filter.unit = unit;

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

// ---------------------- MATERNITY DATE FILTER ----------------------
const applyDateFilter = (field, query) => {
  const { from, to } = query;

  if (!from && !to) return {};

  return {
    [field]: {
      ...(from && { $gte: new Date(from + "T00:00:00.000Z") }),
      ...(to && { $lte: new Date(to + "T23:59:59.999Z") })
    }
  };
};

// ---------------------- CACHE ----------------------
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

// ---------------------- PREVIEW ----------------------
const makePreview = (Model, populate = null, allowSearch = false) => async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital, allowSearch);

    let query = Model.find(filter).limit(50);

    if (populate) query = query.populate(populate);

    const data = await query.lean();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ======================================================
// ===================== CSV EXPORTS =====================
// ======================================================

// PATIENTS
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

// DIAGNOSIS
const exportDiagnosisCSV = async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital);

    const rows = await cacheCSV("diagnoses", req.user.hospital, req.query, async () => {
      const data = await Diagnosis.find(filter)
        .populate({ path: "visit", populate: { path: "patient" } })
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

// PRESCRIPTIONS
const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital);

    const rows = await cacheCSV("prescriptions", req.user.hospital, req.query, async () => {
      const prescriptions = await Prescription.find({
        ...filter,
        isDeleted: false
      })
        .populate({ path: "visit", populate: { path: "patient" } })
        .populate({ path: "medications.medication", select: "name" })
        .lean();

      return prescriptions.flatMap(p =>
        (p.medications || []).map(m => ({
          hospital: p.visit?.patient?.hospital || "",
          patient: `${p.visit?.patient?.firstName || ""} ${p.visit?.patient?.lastName || ""}`,
          medication: m.medication?.name || "",
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

// LABS
const exportLabsCSV = async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital);

    const rows = await cacheCSV("labs", req.user.hospital, req.query, async () => {
      const data = await Lab.find()
        .populate({ path: "patient", match: filter })
        .lean();

      return data.filter(l => l.patient).map(l => ({
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

// MEDICAL RECORDS
const exportMedicalRecordsCSV = async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital);

    const rows = await cacheCSV("medical", req.user.hospital, req.query, async () => {
      const data = await MedicalRecord.find(filter)
        .populate("patient")
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

// DISPENSE
const exportDispenseCSV = async (req, res, next) => {
  try {
    const filter = applyCommonFilters(req.query, req.user.hospital);

    const rows = await cacheCSV("dispense", req.user.hospital, req.query, async () => {
      const data = await Dispense.find(filter)
        .populate("patient")
        .populate("dispensedBy")
        .populate({ path: "items.medication", populate: { path: "medication" } })
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

// ======================================================
// ===================== MATERNITY =======================
// ======================================================

const exportAntenatalCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("antenatal", req.user.hospital, req.query, async () => {
      const visits = await AntenatalVisit.find({
        ...applyDateFilter("visitDate", req.query)
      })
        .populate({ path: "pregnancy", match: { hospital: req.user.hospital }, populate: { path: "patient" } })
        .lean();

      return visits.filter(v => v.pregnancy).map(v => ({
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

    sendCSV(res, rows, "antenatal-visits-report.csv", Object.keys(rows[0] || {}));
  } catch (err) { next(err); }
};

const exportAbortionsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("abortions", req.user.hospital, req.query, async () => {
      const data = await Abortion.find({
        ...applyDateFilter("date", req.query)
      })
        .populate({ path: "pregnancy", match: { hospital: req.user.hospital }, populate: { path: "patient" } })
        .lean();

      return data.filter(a => a.pregnancy).map(a => ({
        hospital: a.pregnancy?.hospital || "",
        patient: `${a.pregnancy?.patient?.firstName || ""} ${a.pregnancy?.patient?.lastName || ""}`,
        date: formatDate(a.date),
        type: a.type || "",
        complications: a.complications || ""
      }));
    });

    sendCSV(res, rows, "abortions-report.csv", Object.keys(rows[0] || {}));
  } catch (err) { next(err); }
};

const exportDeliveriesCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("deliveries", req.user.hospital, req.query, async () => {
      const data = await Delivery.find({
        ...applyDateFilter("deliveryDate", req.query)
      })
        .populate({ path: "pregnancy", match: { hospital: req.user.hospital }, populate: { path: "patient" } })
        .lean();

      return data.filter(d => d.pregnancy).map(d => ({
        hospital: d.pregnancy?.hospital || "",
        patient: `${d.pregnancy?.patient?.firstName || ""} ${d.pregnancy?.patient?.lastName || ""}`,
        deliveryDate: formatDate(d.deliveryDate),
        type: d.type || "",
        babyWeight: d.babyWeight || "",
        babyGender: d.babyGender || ""
      }));
    });

    sendCSV(res, rows, "deliveries-report.csv", Object.keys(rows[0] || {}));
  } catch (err) { next(err); }
};

const exportPostnatalCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("postnatal", req.user.hospital, req.query, async () => {
      const data = await PostnatalVisit.find({
        ...applyDateFilter("visitDate", req.query)
      })
        .populate({ path: "pregnancy", match: { hospital: req.user.hospital }, populate: { path: "patient" } })
        .lean();

      return data.filter(v => v.pregnancy).map(v => ({
        hospital: v.pregnancy?.hospital || "",
        patient: `${v.pregnancy?.patient?.firstName || ""} ${v.pregnancy?.patient?.lastName || ""}`,
        visitDate: formatDate(v.visitDate),
        motherCondition: v.motherCondition || "",
        bloodPressure: v.bloodPressure || ""
      }));
    });

    sendCSV(res, rows, "postnatal-visits-report.csv", Object.keys(rows[0] || {}));
  } catch (err) { next(err); }
};

const exportReferralsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("referrals", req.user.hospital, req.query, async () => {
      const data = await Referral.find({
        ...applyDateFilter("referralDate", req.query)
      })
        .populate({ path: "pregnancy", match: { hospital: req.user.hospital }, populate: { path: "patient" } })
        .lean();

      return data.filter(r => r.pregnancy).map(r => ({
        hospital: r.pregnancy?.hospital || "",
        patient: `${r.pregnancy?.patient?.firstName || ""} ${r.pregnancy?.patient?.lastName || ""}`,
        referredTo: r.referredTo || "",
        reason: r.reason || "",
        status: r.status || ""
      }));
    });

    sendCSV(res, rows, "referrals-report.csv", Object.keys(rows[0] || {}));
  } catch (err) { next(err); }
};

// ======================================================
// ===================== PREVIEWS ========================
// ======================================================

const previewPatients = makePreview(Patient, "unit", true);
const previewDiagnosis = makePreview(Diagnosis, { path: "visit", populate: { path: "patient" } });
const previewPrescriptions = makePreview(Prescription, { path: "visit", populate: { path: "patient" } });
const previewLabs = makePreview(Lab, "patient");
const previewMedicalRecords = makePreview(MedicalRecord, "patient");
const previewDispense = makePreview(Dispense, "patient");

const previewAntenatal = makePreview(AntenatalVisit, { path: "pregnancy", populate: { path: "patient" } });
const previewAbortions = makePreview(Abortion, { path: "pregnancy", populate: { path: "patient" } });
const previewDeliveries = makePreview(Delivery, { path: "pregnancy", populate: { path: "patient" } });
const previewPostnatal = makePreview(PostnatalVisit, { path: "pregnancy", populate: { path: "patient" } });
const previewReferrals = makePreview(Referral, { path: "pregnancy", populate: { path: "patient" } });

// ======================================================
// ===================== EXPORT ==========================
// ======================================================

module.exports = {
  exportPatientsCSV,
  exportDiagnosisCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
  exportDispenseCSV,

  exportAntenatalCSV,
  exportAbortionsCSV,
  exportDeliveriesCSV,
  exportPostnatalCSV,
  exportReferralsCSV,

  previewPatients,
  previewDiagnosis,
  previewPrescriptions,
  previewLabs,
  previewMedicalRecords,
  previewDispense,
  previewAntenatal,
  previewAbortions,
  previewDeliveries,
  previewPostnatal,
  previewReferrals
};