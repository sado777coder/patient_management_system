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

  await redis.set(cacheKey, JSON.stringify(rows), "EX", 600); // 10 minutes

  return rows;
};

// ---------------------- PATIENTS ----------------------
const exportPatientsCSV = async (req, res, next) => {
  try {
    const { from, to, unit, q } = req.query;
    const filter = { isDeleted: false, hospital: req.user.hospital };
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
    if (unit) filter.unit = unit;

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex }
      ];
    }

    const rows = await cacheCSV("patients", req.user.hospital, req.query, async () => {
      const patients = await Patient.find(filter).populate("unit", "name code").lean();
      return patients.map((p) => ({
        hospital: p.hospital || "",
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        phone: p.phone || "",
        gender: p.gender || "",
        unit: p.unit?.name || "",
        unitCode: p.unit?.code || "",
        createdAt: p.createdAt?.toISOString().slice(0, 10) || "",
      }));
    });

    const fields = ["hospital","firstName","lastName","phone","gender","unit","unitCode","createdAt"];
    sendCSV(res, rows, "patients-report.csv", fields);
  } catch (err) { next(err); }
};

//------------------------Export diagnoses-------------------
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
        date: d.createdAt?.toISOString().slice(0,10) || ""
      }));
    });

    const fields = ["hospital","patient","diagnosedBy","symptoms","signs","diagnosis","investigations","notes","date"];
    sendCSV(res, rows, "diagnoses-report.csv", fields);

  } catch (err) { next(err); }
};

// ---------------------- PRESCRIPTIONS ----------------------
const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("prescriptions", req.user.hospital, req.query, async () => {
      // Find prescriptions for this hospital that aren't deleted
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
        model: "Medication",   // explicitly specify the model
        select: "name"
      })
      .lean(); // lean() at the end for plain JS objects

      // Flatten medications array for CSV rows
      const csvRows = prescriptions.flatMap(prescription =>
        (prescription.medications || []).map(med => ({
          hospital: prescription.visit?.patient?.hospital || "",
          patient: `${prescription.visit?.patient?.firstName || ""} ${prescription.visit?.patient?.lastName || ""}`,
          medication: med.medication?.name || "Unknown Medication", // fallback if not populated
          dosage: med.dosage || "",
          frequency: med.frequency || "",
          duration: med.duration || "",
          date: prescription.createdAt?.toISOString().slice(0, 10) || ""
        }))
      );

      return csvRows;
    });

    const fields = ["hospital","patient","medication","dosage","frequency","duration","date"];
    sendCSV(res, rows, "prescriptions-report.csv", fields);

  } catch (err) {
    next(err);
  }
};

// ---------------------- LAB RESULTS ----------------------
const exportLabsCSV = async (req, res, next) => {
  try {
    const rows = await cacheCSV("labs", req.user.hospital, req.query, async () => {
      const data = await Lab.find({})
        .populate({
          path: "patient",
          match: { hospital: req.user.hospital },
          select: "hospital firstName lastName",
        })
        .lean();

      const filtered = data.filter(l => l.patient);

      return filtered.map(l => ({
        hospital: l.patient?.hospital || "",
        patient: `${l.patient?.firstName || ""} ${l.patient?.lastName || ""}`,
        test: l.testName,
        result: l.result,
        status: l.status,
        date: l.createdAt?.toISOString().slice(0,10)
      }));
    });

    const fields = ["hospital","patient","test","result","status","date"];
    sendCSV(res, rows, "labs-report.csv", fields);
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
        date: r.createdAt?.toISOString().slice(0,10)
      }));
    });

    const fields = ["hospital","patient","diagnosis","notes","doctor","date"];
    sendCSV(res, rows, "medical-records-report.csv", fields);
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

      return data.flatMap(dispense =>
        (dispense.items || []).map(item => ({
          hospital: dispense.patient?.hospital || "",
          patient: `${dispense.patient?.firstName || ""} ${dispense.patient?.lastName || ""}`,
          medication: item.medication?.medication?.name || "",
          quantity: item.quantity || 0,
          unitPrice: item.price || 0,
          totalAmount: dispense.totalAmount || 0,
          dispensedBy: dispense.dispensedBy?.name || "",
          date: dispense.createdAt?.toISOString().slice(0,10) || ""
        }))
      );
    });

    const fields = ["hospital","patient","medication","quantity","unitPrice","totalAmount","dispensedBy","date"];
    sendCSV(res, rows, "dispense-report.csv", fields);

  } catch (err) { next(err); }
};

// ---------------------- MATERNITY EXPORTS ----------------------
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

      const filtered = visits.filter(v => v.pregnancy);

      return filtered.map(v => ({
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

    const fields = ["hospital","patient","visitDate","gestationalAgeWeeks","bloodPressure","weight","fetalHeartRate","riskLevel","notes"];
    sendCSV(res, rows, "antenatal-visits-report.csv", fields);
  } catch (err) { next(err); }
};

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

      const filtered = abortions.filter(a => a.pregnancy);

      return filtered.map(a => ({
        hospital: a.pregnancy?.hospital || "",
        patient: `${a.pregnancy?.patient?.firstName || ""} ${a.pregnancy?.patient?.lastName || ""}`,
        date: formatDate(a.date),
        type: a.type || "",
        gestationalAgeWeeks: a.gestationalAgeWeeks || "",
        complications: a.complications || "",
        notes: a.notes || ""
      }));
    });

    const fields = ["hospital","patient","date","type","gestationalAgeWeeks","complications","notes"];
    sendCSV(res, rows, "abortions-report.csv", fields);
  } catch (err) { next(err); }
};

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

      const filtered = deliveries.filter(d => d.pregnancy);

      return filtered.map(d => ({
        hospital: d.pregnancy?.hospital || "",
        patient: `${d.pregnancy?.patient?.firstName || ""} ${d.pregnancy?.patient?.lastName || ""}`,
        deliveryDate: formatDate(d.deliveryDate),
        type: d.type || "",
        babyWeight: d.babyWeight || "",
        babyGender: d.babyGender || "",
        complications: d.complications || ""
      }));
    });

    const fields = ["hospital","patient","deliveryDate","type","babyWeight","babyGender","complications"];
    sendCSV(res, rows, "deliveries-report.csv", fields);
  } catch (err) { next(err); }
};

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

      const filtered = visits.filter(v => v.pregnancy);

      return filtered.map(v => ({
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

    const fields = ["hospital","patient","visitDate","motherCondition","bloodPressure","temperature","complications","notes"];
    sendCSV(res, rows, "postnatal-visits-report.csv", fields);
  } catch (err) { next(err); }
};

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

      const filtered = referrals.filter(r => r.pregnancy);

      return filtered.map(r => ({
        hospital: r.pregnancy?.hospital || "",
        patient: `${r.pregnancy?.patient?.firstName || ""} ${r.pregnancy?.patient?.lastName || ""}`,
        referredTo: r.referredTo || "",
        reason: r.reason || "",
        referralDate: formatDate(r.referralDate),
        status: r.status || "",
        notes: r.notes || ""
      }));
    });

    const fields = ["hospital","patient","referredTo","reason","referralDate","status","notes"];
    sendCSV(res, rows, "referrals-report.csv", fields);
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