const requireConsultationFee = async (req, res, next) => {
  try {
    const { patient, type } = req.body;

    if (type !== "outpatient") return next();

    const patientDoc = await Patient.findById(patient);

    if (!patientDoc) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const today = new Date();

    const hasValidInsurance =
      patientDoc.insurance?.isActive &&
      patientDoc.insurance?.expiryDate > today;

    if (hasValidInsurance) return next();

    // get or create wallet account
    let account = await Billing.findOne({
      patient,
      hospital: req.user.hospital,
    });

    if (!account) {
      account = await Billing.create({
        patient,
        hospital: req.user.hospital,
      });
    }

    //  NEW: Prevent duplicate charges (idempotency)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existingCharge = await Ledger.findOne({
      patient,
      hospital: req.user.hospital,
      type: "charge",
      description: "Outpatient Consultation Fee",
      createdAt: { $gte: startOfDay }, // same day
    });

    if (existingCharge) {
      // Already charged today → skip
      return next();
    }

    // create immutable charge entry
    await Ledger.create({
      hospital: req.user.hospital,
      account: account._id,
      patient,
      type: "charge",
      description: "Outpatient Consultation Fee",
      amount: CONSULT_FEE,
      createdBy: req.user?._id,
      meta: {
        source: "consultation_auto_charge",
      },
    });

    // update balance
    account.balance += CONSULT_FEE;
    await account.save();

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = requireConsultationFee;