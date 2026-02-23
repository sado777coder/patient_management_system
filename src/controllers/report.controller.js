const { Parser } = require("json2csv");
const Dispense = require("../models/Dispense");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const redis = require("../config/redis");

/**
 * SAFE SHARED CSV GENERATOR
 */
const generateCSVReport = async ({ req, cacheKey, queryBuilder, mapFn }) => {
  const fullCacheKey = `${cacheKey}:${JSON.stringify(req.query)}`;

  // 🔹 Check cache
  const cached = await redis.get(fullCacheKey);
  if (cached) return cached;

  // 🔹 Fetch data
  const docs = await queryBuilder(req);

  let rows = [];

  for (const doc of docs) {
    const mapped = mapFn(doc);
    if (Array.isArray(mapped)) rows.push(...mapped);
    else rows.push(mapped);
  }

  if (!rows.length) rows.push({ message: "No data" });

  const parser = new Parser({ fields: Object.keys(rows[0]) });
  const csv = parser.parse(rows);

  // 🔹 Cache CSV
  await redis.set(fullCacheKey, csv, "EX", 600);

  return csv;
};

/**
 * SEND CSV HELPER
 */
const sendCSV = (res, csv, filename) => {
  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
};

/**
 * PATIENTS CSV
 */
const exportPatientsCSV = async (req, res, next) => {
  try {
    const csv = await generateCSVReport({
      req,
      cacheKey: "csv:patients",
      queryBuilder: () =>
        Patient.find({ isDeleted: false })
          .populate("unit", "name code")
          .lean(),
      mapFn: (p) => ({
        hospitalId: p.hospitalId,
        patientName: `${p.firstName || ""} ${p.lastName || ""}`,
        unit: p.unit?.name || "",
      }),
    });

    sendCSV(res, csv, "patients-report.csv");
  } catch (err) {
    next(err);
  }
};

/**
 * DISPENSE CSV
 */
const exportDispenseCSV = async (req, res, next) => {
  try {
    const csv = await generateCSVReport({
      req,
      cacheKey: "csv:dispense",
      queryBuilder: () =>
        Dispense.find({ isDeleted: false })
          .populate("patient", "hospitalId firstName lastName")
          .populate("dispensedBy", "firstName lastName")
          .populate("items.medication", "name drugName")
          .lean(),
      mapFn: (dispense) =>
        (dispense.items || []).map((item) => ({
          hospitalId: dispense.patient?.hospitalId || "",
          patient: `${dispense.patient?.firstName || ""} ${dispense.patient?.lastName || ""}`,
          medication: item.medication?.name || item.medication?.drugName || "",
          quantity: item.quantity || 0,
          unitPrice: item.price || 0,
          totalAmount: dispense.totalAmount || 0,
          dispensedBy: `${dispense.dispensedBy?.firstName || ""} ${dispense.dispensedBy?.lastName || ""}`,
          date: dispense.createdAt?.toISOString().slice(0, 10) || "",
        })),
    });

    sendCSV(res, csv, "dispense-report.csv");
  } catch (err) {
    next(err);
  }
};

/**
 * PRESCRIPTIONS CSV
 */
const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const csv = await generateCSVReport({
      req,
      cacheKey: "csv:prescriptions",
      queryBuilder: () =>
        Prescription.find({ isDeleted: false })
          .populate({
            path: "visit",
            populate: { path: "patient", select: "hospitalId firstName lastName" },
          })
          .lean(),
      mapFn: (p) =>
        (p.medications || []).map((med) => ({
          hospitalId: p.visit?.patient?.hospitalId || "",
          patient: `${p.visit?.patient?.firstName || ""} ${p.visit?.patient?.lastName || ""}`,
          medication: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          date: p.createdAt?.toISOString().slice(0, 10) || "",
        })),
    });

    sendCSV(res, csv, "prescriptions-report.csv");
  } catch (err) {
    next(err);
  }
};

/**
 * LABS CSV
 */
const exportLabsCSV = async (req, res, next) => {
  try {
    const csv = await generateCSVReport({
      req,
      cacheKey: "csv:labs",
      queryBuilder: () =>
        Lab.find({ isDeleted: false })
          .populate("patient", "hospitalId firstName lastName")
          .lean(),
      mapFn: (l) => ({
        hospitalId: l.patient?.hospitalId || "",
        patient: `${l.patient?.firstName || ""} ${l.patient?.lastName || ""}`,
        test: l.testName,
        result: l.result,
        status: l.status,
        date: l.createdAt?.toISOString().slice(0, 10) || "",
      }),
    });

    sendCSV(res, csv, "labs-report.csv");
  } catch (err) {
    next(err);
  }
};

/**
 * MEDICAL RECORDS CSV
 */
const exportMedicalRecordsCSV = async (req, res, next) => {
  try {
    const csv = await generateCSVReport({
      req,
      cacheKey: "csv:medical",
      queryBuilder: () =>
        MedicalRecord.find({ isDeleted: false })
          .populate("patient", "hospitalId firstName lastName")
          .lean(),
      mapFn: (r) => ({
        hospitalId: r.patient?.hospitalId || "",
        patient: `${r.patient?.firstName || ""} ${r.patient?.lastName || ""}`,
        diagnosis: r.diagnosis,
        notes: r.notes,
        doctor: r.doctor,
        date: r.createdAt?.toISOString().slice(0, 10) || "",
      }),
    });

    sendCSV(res, csv, "medical-records-report.csv");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportPatientsCSV,
  exportDispenseCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
};