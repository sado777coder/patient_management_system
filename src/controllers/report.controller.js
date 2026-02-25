const { Parser } = require("json2csv");
const Dispense = require("../models/Dispense");
const Patient = require("../models/Patient");
const Prescription = require("../models/Prescription");
const Lab = require("../models/LabResult");
const MedicalRecord = require("../models/MedicalRecord");
const Abortion = require("../models/Abortion");
const AntenatalVisit = require("../models/AntenatalVisit");
const Delivery = require("../models/Delivery");
const PostnatalVisit = require("../models/PostnatalVisit");
const Referral = require("../models/Referral");
const redis = require("../config/redis");

// SHARED CSV HELPER
const sendCSV = (res, rows, filename) => {
  if (!rows.length) rows.push({ message: "No data" });
  const parser = new Parser({ fields: Object.keys(rows[0]) });
  const csv = parser.parse(rows);
  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
};

// ---------------------- PATIENTS ----------------------
const exportPatientsCSV = async (req, res, next) => {
  try {
    const { from, to, unit, q } = req.query;
    const filter = { isDeleted: false };
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
    if (unit) filter.unit = unit;
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ hospitalId: regex }, { firstName: regex }, { lastName: regex }, { phone: regex }];
    }

    const patients = await Patient.find(filter).populate("unit", "name code").lean();
    const rows = patients.map((p) => ({
      hospitalId: p.hospitalId || "",
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      phone: p.phone || "",
      gender: p.gender || "",
      unit: p.unit?.name || "",
      unitCode: p.unit?.code || "",
      createdAt: p.createdAt ? p.createdAt.toISOString().slice(0, 10) : "",
    }));

    sendCSV(res, rows, "patients-report.csv");
  } catch (err) {
    next(err);
  }
};

// ---------------------- PRESCRIPTIONS ----------------------
const exportPrescriptionsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:prescriptions:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return sendCSV(res, JSON.parse(cached), "prescriptions-report.csv");

    const data = await Prescription.find({ isDeleted: false })
      .populate({ path: "visit", populate: { path: "patient", select: "hospitalId firstName lastName" } })
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

// ---------------------- LAB RESULTS ----------------------
const exportLabsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:labs:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return sendCSV(res, JSON.parse(cached), "labs-report.csv");

    const data = await Lab.find().populate("patient", "hospitalId firstName lastName").lean();
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

// ---------------------- MEDICAL RECORDS ----------------------
const exportMedicalRecordsCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:medical:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return sendCSV(res, JSON.parse(cached), "medical-records-report.csv");

    const data = await MedicalRecord.find().populate("patient", "hospitalId firstName lastName").lean();
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

// ---------------------- DISPENSE ----------------------
const exportDispenseCSV = async (req, res, next) => {
  try {
    const cacheKey = `csv:dispense:${JSON.stringify(req.query)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return sendCSV(res, JSON.parse(cached), "dispense-report.csv");

    const data = await Dispense.find()
      .populate("patient", "firstName lastName hospitalId")
      .populate("dispensedBy", "name")
      .populate("items.medication", "name")
      .lean();

    const rows = data.flatMap((dispense) =>
      (dispense.items || []).map((item) => ({
        hospitalId: dispense.patient?.hospitalId || "",
        patient: `${dispense.patient?.firstName || ""} ${dispense.patient?.lastName || ""}`,
        medication: item.medication?.name || item.medication?.drugName || "",
        quantity: item.quantity || 0,
        unitPrice: item.price || 0,
        totalAmount: dispense.totalAmount || 0,
        dispensedBy: dispense.dispensedBy?.name || "",
        date: dispense.createdAt ? dispense.createdAt.toISOString().slice(0, 10) : "",
      }))
    );

    await redis.set(cacheKey, JSON.stringify(rows), "EX", 600);
    sendCSV(res, rows, "dispense-report.csv");
  } catch (err) {
    next(err);
  }
};

// ---------------------- ANTENATAL ----------------------
const exportAntenatalCSV = async (req, res, next) => {
  try {
    const visits = await AntenatalVisit.find().populate({ path: "pregnancy", populate: "patient" }).lean();
    const rows = visits.map((v) => ({
      hospitalId: v.pregnancy?.patient?.hospitalId || "",
      patient: `${v.pregnancy?.patient?.firstName || ""} ${v.pregnancy?.patient?.lastName || ""}`,
      visitDate: v.visitDate?.toISOString().slice(0, 10) || "",
      gestationalAgeWeeks: v.gestationalAgeWeeks || "",
      bloodPressure: v.bloodPressure || "",
      weight: v.weight || "",
      fetalHeartRate: v.fetalHeartRate || "",
      riskLevel: v.riskLevel || "",
      notes: v.notes || "",
    }));
    sendCSV(res, rows, "antenatal-visits-report.csv");
  } catch (err) {
    next(err);
  }
};

// ---------------------- ABORTIONS ----------------------
const exportAbortionsCSV = async (req, res, next) => {
  try {
    const abortions = await Abortion.find().populate({ path: "pregnancy", populate: "patient" }).lean();
    const rows = abortions.map((a) => ({
      hospitalId: a.pregnancy?.patient?.hospitalId || "",
      patient: `${a.pregnancy?.patient?.firstName || ""} ${a.pregnancy?.patient?.lastName || ""}`,
      date: a.date?.toISOString().slice(0, 10) || "",
      type: a.type || "",
      gestationalAgeWeeks: a.gestationalAgeWeeks || "",
      complications: a.complications || "",
      notes: a.notes || "",
    }));
    sendCSV(res, rows, "abortions-report.csv");
  } catch (err) {
    next(err);
  }
};

// ---------------------- DELIVERIES ----------------------
const exportDeliveriesCSV = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find().populate({ path: "pregnancy", populate: "patient" }).lean();
    const rows = deliveries.map((d) => ({
      hospitalId: d.pregnancy?.patient?.hospitalId || "",
      patient: `${d.pregnancy?.patient?.firstName || ""} ${d.pregnancy?.patient?.lastName || ""}`,
      deliveryDate: d.deliveryDate?.toISOString().slice(0, 10) || "",
      type: d.type || "",
      babyWeight: d.babyWeight || "",
      babyGender: d.babyGender || "",
      complications: d.complications || "",
    }));
    sendCSV(res, rows, "deliveries-report.csv");
  } catch (err) {
    next(err);
  }
};

// ---------------------- POSTNATAL VISITS ----------------------
const exportPostnatalCSV = async (req, res, next) => {
  try {
    const visits = await PostnatalVisit.find().populate({ path: "pregnancy", populate: "patient" }).lean();
    const rows = visits.map((v) => ({
      hospitalId: v.pregnancy?.patient?.hospitalId || "",
      patient: `${v.pregnancy?.patient?.firstName || ""} ${v.pregnancy?.patient?.lastName || ""}`,
      visitDate: v.visitDate?.toISOString().slice(0, 10) || "",
      motherCondition: v.motherCondition || "",
      bloodPressure: v.bloodPressure || "",
      temperature: v.temperature || "",
      complications: v.complications || "",
      notes: v.notes || "",
    }));
    sendCSV(res, rows, "postnatal-visits-report.csv");
  } catch (err) {
    next(err);
  }
};

// ---------------------- REFERRALS ----------------------
const exportReferralsCSV = async (req, res, next) => {
  try {
    const referrals = await Referral.find().populate({ path: "pregnancy", populate: "patient" }).lean();
    const rows = referrals.map((r) => ({
      hospitalId: r.pregnancy?.patient?.hospitalId || "",
      patient: `${r.pregnancy?.patient?.firstName || ""} ${r.pregnancy?.patient?.lastName || ""}`,
      referredTo: r.referredTo || "",
      reason: r.reason || "",
      referralDate: r.referralDate?.toISOString().slice(0, 10) || "",
      status: r.status || "",
      notes: r.notes || "",
    }));
    sendCSV(res, rows, "referrals-report.csv");
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
  exportAntenatalCSV,
  exportAbortionsCSV,
  exportDeliveriesCSV,
  exportPostnatalCSV,
  exportReferralsCSV,
};