const mongoose = require("mongoose");
const DispenseModel = require("../models/Dispense");
const BillingModel = require("../models/Billing");
const LedgerModel = require("../models/LedgerTransaction");
const MedicationStock = require("../models/MedicationStock");

/**
 * CREATE DISPENSE 
 */
const createDispense = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { patient, prescription, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    let createdDispense;

    await session.withTransaction(async () => {
      let totalAmount = 0;
      const processedItems = [];

      for (const item of items) {
        const medication = await MedicationStock.findOne({
          _id: item.medication,
          hospital: req.user.hospital,
        })
          .populate("medication", "name")
          .session(session);

        if (!medication) throw new Error("Medication not found");

        if (medication.quantity < item.quantity)
          throw new Error(
            `Insufficient stock for ${medication.medication?.name}`
          );

        if (medication.expiryDate && medication.expiryDate < new Date())
          throw new Error(`${medication.medication?.name} is expired`);

        const priceInPesewas = Math.round(medication.unitPrice * 100);
        const amount = priceInPesewas * item.quantity;

        totalAmount += amount;

        medication.quantity -= item.quantity;
        await medication.save({ session });

        processedItems.push({
          medication: medication._id,
          quantity: item.quantity,
          price: priceInPesewas,
        });
      }

      const dispense = await DispenseModel.create(
        [
          {
            hospital: req.user.hospital,
            patient,
            prescription,
            items: processedItems,
            totalAmount,
            dispensedBy: req.user._id,
          },
        ],
        { session }
      );

      createdDispense = dispense[0];

      let account = await BillingModel.findOne({
        patient,
        hospital: req.user.hospital,
      }).session(session);

      if (!account) {
        const created = await BillingModel.create(
          [{ patient, hospital: req.user.hospital }],
          { session }
        );
        account = created[0];
      }

      if (account.isFrozen) throw new Error("Account is frozen");

      await LedgerModel.create(
        [
          {
            hospital: req.user.hospital,
            account: account._id,
            patient,
            type: "charge",
            amount: totalAmount,
            description: "Medication Dispense",
            createdBy: req.user._id,
          },
        ],
        { session }
      );

      account.balance += totalAmount;
      await account.save({ session });
    });

    return res.status(201).json({
      success: true,
      message: "Medication dispensed",
      data: {
        ...createdDispense.toObject(),
        totalAmount: createdDispense.totalAmount / 100,
      },
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * GET DISPENSES 
 */
const getDispenses = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {
      hospital: req.user.hospital,
      isDeleted: false, 
    };

    const [records, total] = await Promise.all([
      DispenseModel.find(filter)
        .populate("patient", "firstName lastName registrationNumber") 
        .populate("dispensedBy", "firstName lastName")
        .populate("items.medication", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      DispenseModel.countDocuments(filter),
    ]);

    const formatted = records.map((r) => ({
      ...r,
      totalAmount: r.totalAmount / 100,
    }));

    res.json({
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE DISPENSE (SAFE UPDATE LIKE PRESCRIPTION)
 */
const updateDispense = async (req, res, next) => {
  try {
    delete req.body.hospital;
    delete req.body.patient;
    delete req.body.totalAmount;
    delete req.body.dispensedBy;
    delete req.body.isDeleted;

    const updated = await DispenseModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({
        success: false,
        message: "Dispense not found",
      });

    res.json({
      success: true,
      message: "Dispense updated",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SOFT DELETE
 */
const deleteDispense = async (req, res, next) => {
  try {
    const deleted = await DispenseModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!deleted)
      return res.status(404).json({
        success: false,
        message: "Dispense not found",
      });

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SEARCH (NOW SUPPORT REGISTRATION NUMBER)
 */
const searchDispenses = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword)
      return res.status(400).json({ message: "Search required" });

    const results = await DispenseModel.aggregate([
      { $match: { hospital: req.user.hospital, isDeleted: false } },

      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      {
        $match: {
          $or: [
            { "patient.firstName": { $regex: keyword, $options: "i" } },
            { "patient.lastName": { $regex: keyword, $options: "i" } },
            { "patient.registrationNumber": { $regex: keyword, $options: "i" } }, 
          ],
        },
      },

      {
        $project: {
          totalAmount: { $divide: ["$totalAmount", 100] },
          createdAt: 1,
          patient: {
            firstName: "$patient.firstName",
            lastName: "$patient.lastName",
            registrationNumber: "$patient.registrationNumber",
          },
        },
      },
    ]);

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDispense,
  getDispenses,
  updateDispense,
  deleteDispense,
  searchDispenses,
};