const { Parser } = require("json2csv");

const Patient = require("../models/Patient");
const Dispense = require("../models/Dispense");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const redis = require("../config/redis");


// SHARED CSV HELPER

const sendCSV = (res, rows, filename) => {
  if (!rows.length) rows.push({ message: "No data" });

  const parser = new Parser({
    fields: Object.keys(rows[0]),
  });

  const csv = parser.parse(rows);

  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
};


// PATIENT EXPORT

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

    const parser = new Parser({
      fields: Object.keys(rows[0] || { message: "" }),
    });

    const csv = parser.parse(rows.length ? rows : [{ message: "No data" }]);

    await redis.set(cacheKey, csv, "EX", 600);

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

    // Supports items array
    const rows = data.flatMap((d) =>
      (d.items || []).map((item) => ({
        hospitalId: d.patient?.hospitalId,
        patient: `${d.patient?.firstName || ""} ${d.patient?.lastName || ""}`,
        medication: item.name,
        quantity: item.quantity,
        unit: item.unit,
        date: d.createdAt?.toISOString().slice(0, 10),
      }))
    );

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);

    sendCSV(res, rows, "dispense-report.csv");

  } catch (err) {
    next(err);
  }
};


// PRESCRIPTION EXPORT

const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:prescriptions`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendCSV(res, JSON.parse(cached), "prescriptions-report.csv");
    }

    const data = await Prescription.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((p) => ({
      hospitalId: p.patient?.hospitalId,
      patient: `${p.patient?.firstName || ""} ${p.patient?.lastName || ""}`,
      drug: p.drug,
      dosage: p.dosage,
      frequency: p.frequency,
      date: p.createdAt?.toISOString().slice(0, 10),
    }));

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);

    sendCSV(res, rows, "prescriptions-report.csv");

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
      return sendCSV(res, JSON.parse(cached), "labs-report.csv");
    }

    const data = await Lab.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((l) => ({
      hospitalId: l.patient?.hospitalId,
      patient: `${l.patient?.firstName || ""} ${l.patient?.lastName || ""}`,
      test: l.testName,
      result: l.result,
      status: l.status,
      date: l.createdAt?.toISOString().slice(0, 10),
    }));

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);

    sendCSV(res, rows, "labs-report.csv");

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
      return sendCSV(res, JSON.parse(cached), "medical-records-report.csv");
    }

    const data = await MedicalRecord.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((r) => ({
      hospitalId: r.patient?.hospitalId,
      patient: `${r.patient?.firstName || ""} ${r.patient?.lastName || ""}`,
      diagnosis: r.diagnosis,
      notes: r.notes,
      doctor: r.doctor,
      date: r.createdAt?.toISOString().slice(0, 10),
    }));

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);

    sendCSV(res, rows, "medical-records-report.csv");

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