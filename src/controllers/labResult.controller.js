const LabResultModel = require("../models/LabResult");
const BillingModel = require("../models/Billing");
const LedgerModel = require("../models/LedgerTransaction");
const LabOrder = require("../models/LabOrder");
const mongoose = require("mongoose");


const createLabResult = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let { patient, testName, amount, labOrder } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: "Charge amount is required",
      });
    }

    let createdResult;

    await session.withTransaction(async () => {

      //  IF LAB ORDER IS PROVIDED → AUTO-FILL DATA
      if (labOrder) {
        const order = await LabOrder.findById(labOrder)
          .populate({
            path: "diagnosis",
            populate: {
              path: "visit",
              populate: { path: "patient" },
            },
          })
          .session(session);

        if (!order) throw new Error("Lab order not found");

        patient = order.diagnosis.visit.patient._id;

        // If multiple tests → you may later loop, for now take first
        if (!testName) {
          testName = order.tests[0];
        }
      }

      //  CONVERT TO PESEWAS
      const amountInPesewas = Math.round(Number(amount) * 100);

      //  DUPLICATE BILLING PROTECTION
      const existingCharge = await LedgerModel.findOne({
        patient,
        description: `Lab Test - ${testName}`,
      }).session(session);

      if (existingCharge) {
        throw new Error("This lab test has already been billed");
      }

      //  ENSURE BILLING ACCOUNT
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

      if (account.isFrozen) {
        throw new Error("Account is frozen");
      }

      //  CREATE LEDGER ENTRY
      await LedgerModel.create(
        [{
          hospital: req.user.hospital,
          account: account._id,
          patient,
          type: "charge",
          amount: amountInPesewas,
          description: `Lab Test - ${testName}`,
          createdBy: req.user._id,
        }],
        { session }
      );

      // UPDATE BALANCE
      account.balance += amountInPesewas;
      await account.save({ session });

      //  CREATE LAB RESULT
      const result = await LabResultModel.create(
        [{
          ...req.body,
          patient,
          testName,
          labOrder: labOrder || null, // NEW FIELD
          amount: amountInPesewas,
          hospital: req.user.hospital,
        }],
        { session }
      );

      createdResult = result[0];
    });

    res.status(201).json({
      success: true,
      message: "Lab test billed and recorded successfully",
      data: {
        ...createdResult.toObject(),
        amount: createdResult.amount / 100,
      },
    });

  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * GET ALL
 */
const getLabResults = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const search = req.query.q?.trim();

    let filter = { hospital: req.user.hospital };

    let resultsQuery = LabResultModel.find(filter)
      .populate({
        path: "visit",
        populate: {
          path: "patient",
          select: "firstName lastName",
        },
      })
      .sort({ createdAt: -1 });

    if (search) {
      resultsQuery = resultsQuery.find({
        testName: { $regex: search, $options: "i" },
      });
    }

    const [results, total] = await Promise.all([
      resultsQuery.skip(skip).limit(limit).lean(),
      LabResultModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Results",
      data: results,
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
 * GET ONE
 */
const getLabResultById = async (req, res, next) => {
  try {
    const result = await LabResultModel.findOne({
      _id: req.params.id,
      hospital: req.user.hospital,
    }).populate("visit");

    if (!result)
      return res.status(404).json({ message: "Lab result not found" });

    res.status(200).json({
      success: true,
      message: "Result",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE
 */
const updateLabResult = async (req, res, next) => {
  try {
    const result = await LabResultModel.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user.hospital,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Lab result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab result updated",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SEARCH LAB RESULTS
 */
const searchLabResults = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const matchConditions = [
      { notes: { $regex: keyword, $options: "i" } },
      { status: { $regex: keyword, $options: "i" } },
      { "patient.registrationNumber": { $regex: keyword, $options: "i" } },
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(keyword) });
    }

    const results = await LabResultModel.aggregate([
      { $match: { hospital: req.user.hospital, isDeleted: false } },

      // FIX: join diagnosis → visit → patient
      {
        $lookup: {
          from: "diagnoses",
          localField: "diagnosis",
          foreignField: "_id",
          as: "diagnosis",
        },
      },
      { $unwind: "$diagnosis" },

      {
        $lookup: {
          from: "visits",
          localField: "diagnosis.visit",
          foreignField: "_id",
          as: "visit",
        },
      },
      { $unwind: "$visit" },

      {
        $lookup: {
          from: "patients",
          localField: "visit.patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "requestedBy",
        },
      },
      { $unwind: { path: "$requestedBy", preserveNullAndEmptyArrays: true } },

      { $match: { $or: matchConditions } },

      {
        $project: {
          tests: 1,
          status: 1,
          notes: 1,
          createdAt: 1,
          requestedBy: {
            _id: "$requestedBy._id",
            name: {
              $trim: {
                input: {
                  $concat: ["$requestedBy.firstName", " ", "$requestedBy.lastName"],
                },
              },
            },
          },
          patient: {
            _id: "$patient._id",
            firstName: "$patient.firstName",
            lastName: "$patient.lastName",
          },
        },
      },
    ]);

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE (admin only)
 */
const deleteLabResult = async (req, res, next) => {
  try {
    const result = await LabResultModel.findOneAndDelete({
      _id: req.params.id,
      hospital: req.user.hospital,
    });

    if (!result)
      return res.status(404).json({ message: "Lab result not found" });

    res.status(200).json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLabResult,
  getLabResults,
  getLabResultById,
  updateLabResult,
  searchLabResults,
  deleteLabResult,
};