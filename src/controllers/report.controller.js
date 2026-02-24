const { Parser } = require("json2csv");
const Dispense = require("../models/Dispense");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const redis = require("../config/redis");
const MedicationStock = require("../models/MedicationStock");

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
    const cached = null;

    if (cached) {
      return res
        .header("Content-Type", "text/csv")
        .attachment("patients-report.csv")
        .send(cached);
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

   // await redis.set(cacheKey, csv, "EX", 600);

    res.header("Content-Type", "text/csv");
    res.attachment("patients-report.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// PRESCRIPTION EXPORT
const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:prescriptions:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return sendCSV(res, JSON.parse(cached), "prescriptions-report.csv");
    }

    const data = await Prescription.find({ isDeleted: false })
      .populate({
        path: "visit",
        populate: {
          path: "patient",
          select: "hospitalId firstName lastName",
        },
      })
      .lean();

    const rows = data.flatMap((p) =>
      (p.medications || []).map((med) => ({
        hospitalId: p.visit?.patient?.hospitalId || "",
        patient: `${p.visit?.patient?.firstName || ""} ${p.visit?.patient?.lastName || ""}`,
        medication: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        date: p.createdAt?.toISOString().slice(0, 10),
      }))
    );

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);

    sendCSV(res, rows, "prescriptions-report.csv");
  } catch (err) {
    next(err);
  }
};

// LAB EXPORT
const exportLabsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:labs:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return sendCSV(res, JSON.parse(cached), "labs-report.csv");
    }

    const data = await Lab.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((l) => ({
      hospitalId: l.patient?.hospitalId || "",
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
    const cacheKey = `csv:medical:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return sendCSV(res, JSON.parse(cached), "medical-records-report.csv");
    }

    const data = await MedicalRecord.find()
      .populate("patient", "hospitalId firstName lastName")
      .lean();

    const rows = data.map((r) => ({
      hospitalId: r.patient?.hospitalId || "",
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

// DISPENSE EXPORT
const exportDispenseCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:dispense:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return sendCSV(res, JSON.parse(cached), "dispense-report.csv");
    }

    const data = await Dispense.find()
      .populate("patient", "firstName lastName")
      .populate("dispensedBy", "name")
      .populate("items.medication", "name");

    const rows = data.flatMap((dispense) =>
      (dispense.items || []).map((item) => ({
        hospitalId: dispense.patient?.hospitalId || "",
        patient: `${dispense.patient?.firstName || ""} ${dispense.patient?.lastName || ""}`,
        medication: item.medication?.name || item.medication?.drugName || "",
        quantity: item.quantity || 0,
        unitPrice: item.price || 0,
        totalAmount: dispense.totalAmount || 0,
        dispensedBy: `${dispense.dispensedBy?.firstName || ""} ${dispense.dispensedBy?.lastName || ""}`,
        date: dispense.createdAt ? dispense.createdAt.toISOString().slice(0, 10) : "",
      }))
    );

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);

    sendCSV(res, rows, "dispense-report.csv");
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