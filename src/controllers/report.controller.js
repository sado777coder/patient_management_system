const { Parser } = require("json2csv");

const Patient = require("../models/Patient");
const Dispense = require("../models/Dispense");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const redis = require("../config/redis");

  // SHARED CSV HELPER (single source of truth)

const sendCSV = (res, rows, filename) => {
  if (!rows.length) rows.push({ message: "No data" });

  const parser = new Parser({ fields: Object.keys(rows[0]) });
  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
};

  // PATIENT EXPORT (advanced filters)

const exportPatientsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:patients:${JSON.stringify(req.query)}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.header("Content-Type", "text/csv");
      res.attachment("patients-report.csv");
      return res.send(cached);
    }

    const { from, to, unit, q } = req.query;

    const filter = { isDeleted: false };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (unit) filter.unit = unit;

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { hospitalId: regex },
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
      ];
    }

    const patients = await Patient.find(filter)
      .populate("unit", "name code")
      .lean();

    const rows = patients.map((p) => ({
      hospitalId: p.hospitalId,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      gender: p.gender,
      unit: p.unit?.name || "",
      unitCode: p.unit?.code || "",
      createdAt: p.createdAt?.toISOString().slice(0, 10),
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || { message: "" }) });
    const csv = parser.parse(rows.length ? rows : [{ message: "No data" }]);

    await redis.set(cacheKey, csv, "EX", 600); // 10 min

    res.header("Content-Type", "text/csv");
    res.attachment("patients-report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

  // DISPENSE EXPORT

const exportDispenseCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:dispense`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.header("Content-Type", "text/csv");
      res.attachment("dispense-report.csv");
      return res.send(cached);
    }

    const data = await Dispense.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((d) => ({
      hospitalId: d.patient?.hospitalId,
      patient: `${d.patient?.firstName} ${d.patient?.lastName}`,
      medication: d.medication,
      quantity: d.quantity,
      date: d.createdAt,
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || { message: "" }) });
    const csv = parser.parse(rows.length ? rows : [{ message: "No data" }]);

    await redis.set(cacheKey, csv, "EX", 600);

    res.header("Content-Type", "text/csv");
    res.attachment("dispense-report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

   //PRESCRIPTION EXPORT

const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:prescriptions`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.header("Content-Type", "text/csv");
      res.attachment("prescriptions-report.csv");
      return res.send(cached);
    }

    const data = await Prescription.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((p) => ({
      hospitalId: p.patient?.hospitalId,
      patient: `${p.patient?.firstName} ${p.patient?.lastName}`,
      drug: p.drug,
      dosage: p.dosage,
      frequency: p.frequency,
      date: p.createdAt,
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || { message: "" }) });
    const csv = parser.parse(rows.length ? rows : [{ message: "No data" }]);

    await redis.set(cacheKey, csv, "EX", 600);

    res.header("Content-Type", "text/csv");
    res.attachment("prescriptions-report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

  // LAB EXPORT

const exportLabsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:labs`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.header("Content-Type", "text/csv");
      res.attachment("labs-report.csv");
      return res.send(cached);
    }

    const data = await Lab.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((l) => ({
      hospitalId: l.patient?.hospitalId,
      patient: `${l.patient?.firstName} ${l.patient?.lastName}`,
      test: l.testName,
      result: l.result,
      status: l.status,
      date: l.createdAt,
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || { message: "" }) });
    const csv = parser.parse(rows.length ? rows : [{ message: "No data" }]);

    await redis.set(cacheKey, csv, "EX", 600);

    res.header("Content-Type", "text/csv");
    res.attachment("labs-report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

  // MEDICAL RECORD EXPORT

const exportMedicalRecordsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:medical`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      res.header("Content-Type", "text/csv");
      res.attachment("medical-records-report.csv");
      return res.send(cached);
    }

    const data = await MedicalRecord.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((r) => ({
      hospitalId: r.patient?.hospitalId,
      patient: `${r.patient?.firstName} ${r.patient?.lastName}`,
      diagnosis: r.diagnosis,
      notes: r.notes,
      doctor: r.doctor,
      date: r.createdAt,
    }));

    const parser = new Parser({ fields: Object.keys(rows[0] || { message: "" }) });
    const csv = parser.parse(rows.length ? rows : [{ message: "No data" }]);

    await redis.set(cacheKey, csv, "EX", 600);

    res.header("Content-Type", "text/csv");
    res.attachment("medical-records-report.csv");
    res.send(csv);
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