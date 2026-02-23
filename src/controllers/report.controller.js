const { Parser } = require("json2csv");
const Dispense = require("../models/Dispense");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const redis = require("../config/redis");

// ==============================
// SHARED CSV STREAM GENERATOR
// ==============================
const generateCSVReport = async ({
  req,
  res,
  cacheKey,
  filename,
  fields,
  queryBuilder,
  mapFn,
}) => {
  const fullCacheKey = `${cacheKey}:${JSON.stringify(req.query)}`;
  const cached = await redis.get(fullCacheKey);

  if (cached) {
    res.header("Content-Type", "text/csv");
    res.attachment(filename);
    return res.send(cached);
  }

  const query = queryBuilder(req);
  const cursor = query.cursor();

  const rows = [];
  for await (const doc of cursor) {
    const mapped = mapFn(doc);
    if (Array.isArray(mapped)) rows.push(...mapped);
    else rows.push(mapped);
  }

  if (!rows.length) rows.push({ message: "No data" });

  const parser = new Parser({ fields });
  const csv = parser.parse(rows);

  await redis.set(fullCacheKey, csv, "EX", 600);

  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
};

// ==============================
// WRAPPER TO CATCH ERRORS
// ==============================
const asyncCSVHandler = (fn) => (req, res, next) => {
  fn(req, res).catch(next);
};

// ==============================
// CSV EXPORT FUNCTIONS
// ==============================
const exportPatientsCSV = asyncCSVHandler((req, res) =>
  generateCSVReport({
    req,
    res,
    cacheKey: "csv:patients",
    filename: "patients-report.csv",
    fields: [
      "hospitalId",
      "firstName",
      "lastName",
      "phone",
      "gender",
      "unit",
      "unitCode",
      "createdAt",
    ],
    queryBuilder: (req) => {
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

      return Patient.find(filter).populate("unit", "name code").lean();
    },
    mapFn: (p) => ({
      hospitalId: p.hospitalId,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      gender: p.gender,
      unit: p.unit?.name || "",
      unitCode: p.unit?.code || "",
      createdAt: p.createdAt?.toISOString().slice(0, 10),
    }),
  })
);

// Similarly wrap the rest
const exportDispenseCSV = asyncCSVHandler((req, res) =>
  generateCSVReport({
    req,
    res,
    cacheKey: "csv:dispense",
    filename: "dispense-report.csv",
    fields: [
      "hospitalId",
      "patient",
      "medication",
      "quantity",
      "unitPrice",
      "totalAmount",
      "dispensedBy",
      "date",
    ],
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
  })
);

// Wrap the others similarly
const exportPrescriptionsCSV = asyncCSVHandler((req, res) =>
  generateCSVReport({
    req,
    res,
    cacheKey: "csv:prescriptions",
    filename: "prescriptions-report.csv",
    fields: [
      "hospitalId",
      "patient",
      "medication",
      "dosage",
      "frequency",
      "duration",
      "date",
    ],
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
        date: p.createdAt?.toISOString().slice(0, 10),
      })),
  })
);

const exportLabsCSV = asyncCSVHandler((req, res) =>
  generateCSVReport({
    req,
    res,
    cacheKey: "csv:labs",
    filename: "labs-report.csv",
    fields: ["hospitalId", "patient", "test", "result", "status", "date"],
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
      date: l.createdAt?.toISOString().slice(0, 10),
    }),
  })
);

const exportMedicalRecordsCSV = asyncCSVHandler((req, res) =>
  generateCSVReport({
    req,
    res,
    cacheKey: "csv:medical",
    filename: "medical-records-report.csv",
    fields: ["hospitalId", "patient", "diagnosis", "notes", "doctor", "date"],
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
      date: r.createdAt?.toISOString().slice(0, 10),
    }),
  })
);

module.exports = {
  exportPatientsCSV,
  exportDispenseCSV,
  exportPrescriptionsCSV,
  exportLabsCSV,
  exportMedicalRecordsCSV,
};