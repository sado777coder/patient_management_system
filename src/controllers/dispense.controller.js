const mongoose = require("mongoose");
const DispenseModel = require("../models/Dispense");
const BillingModel = require("../models/Billing");
const LedgerModel = require("../models/LedgerTransaction");
const MedicationStock = require("../models/MedicationStock");

/**
 * CREATE DISPENSE (Stock Safe + Ledger Billing + Pesewas)
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

        if (!medication)
          throw new Error("Medication not found");

        if (medication.quantity < item.quantity)
          throw new Error(
            `Insufficient stock for ${medication.medication?.name}`
          );

        if (medication.expiryDate && medication.expiryDate < new Date())
          throw new Error(`${medication.medication?.name} is expired`);

        //  ALWAYS TRUST DATABASE PRICE
        const priceInPesewas = Math.round(medication.unitPrice * 100);
        const amount = priceInPesewas * item.quantity;

        totalAmount += amount;

        // Deduct stock
        medication.quantity -= item.quantity;
        await medication.save({ session });

        processedItems.push({
          medication: medication._id,
          quantity: item.quantity,
          price: priceInPesewas,
        });
      }

      const dispense = await DispenseModel.create(
        [{
          hospital: req.user.hospital,
          patient,
          prescription,
          items: processedItems,
          totalAmount,
          dispensedBy: req.user._id,
        }],
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

      if (account.isFrozen)
        throw new Error("Account is frozen");

      await LedgerModel.create(
        [{
          hospital: req.user.hospital,
          account: account._id,
          patient,
          type: "charge",
          amount: totalAmount,
          description: "Medication Dispense",
          createdBy: req.user._id,
        }],
        { session }
      );

      account.balance += totalAmount;
      await account.save({ session });
    });

    return res.status(201).json({
      success: true,
      message: "Medication dispensed. Bill added successfully.",
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
 * GET DISPENSE HISTORY
 */
const getDispenses = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const search = req.query.q?.trim();

    let filter = { hospital: req.user.hospital };

    const [records, total] = await Promise.all([
      DispenseModel.find(filter)
        .populate("patient", "firstName lastName")
        .populate("dispensedBy", "firstName lastName email")
        .populate("items.medication", "name batchNumber unitPrice")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      DispenseModel.countDocuments(filter),
    ]);

    const formatted = records.map((r) => ({
      ...r,
      dispensedBy: r.dispensedBy
        ? {
            ...r.dispensedBy,
            name: `${r.dispensedBy.firstName} ${r.dispensedBy.lastName}`,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      message: "DISPENSE HISTORY",
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
 * SEARCH DISPENSES
 */
const searchDispenses = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const matchConditions = [
      { "patient.firstName": { $regex: keyword, $options: "i" } },
      { "patient.lastName": { $regex: keyword, $options: "i" } },
      { "patient.registrationNumber": { $regex: keyword, $options: "i" } },
      { "medications.medication.name": { $regex: keyword, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(keyword) });
    }

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
        $lookup: {
          from: "users",
          localField: "dispensedBy",
          foreignField: "_id",
          as: "dispensedBy",
        },
      },
      { $unwind: { path: "$dispensedBy", preserveNullAndEmptyArrays: true } },

      // FIX: lookup medications
      {
        $lookup: {
          from: "medicationstocks",
          localField: "items.medication",
          foreignField: "_id",
          as: "medications",
        },
      },

      {
        $lookup: {
          from: "medications",
          localField: "medications.medication",
          foreignField: "_id",
          as: "medications.medication",
        },
      },

      { $match: { $or: matchConditions } },

      {
        $project: {
          totalAmount: 1,
          createdAt: 1,
          patient: {
            _id: "$patient._id",
            firstName: "$patient.firstName",
            lastName: "$patient.lastName",
          },
          dispensedBy: {
            _id: "$dispensedBy._id",
            name: {
              $trim: {
                input: {
                  $concat: ["$dispensedBy.firstName", " ", "$dispensedBy.lastName"],
                },
              },
            },
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
  searchDispenses
};