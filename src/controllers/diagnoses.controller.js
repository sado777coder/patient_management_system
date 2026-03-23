const Diagnosis = require("../models/Diagnosis");
const Triage = require("../models/Triage");

// CREATE DIAGNOSIS
const createDiagnosis = async (req, res, next) => {
  try {
    const { visit } = req.body;

    const triageExists = await Triage.findOne({ 
      visit,
      hospital: req.user.hospital
    });

    if (!triageExists) {
      return res.status(400).json({
        success: false,
        message: "Patient vitals must be completed before diagnosis",
      });
    }

    // CHECK IF DIAGNOSIS ALREADY EXISTS
    const existingDiagnosis = await Diagnosis.findOne({
       visit,
       hospital: req.user.hospital,
       });

    if (existingDiagnosis) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis already exists for this visit. Please update instead.",
      });
    }

    const diagnosis = await Diagnosis.create({
  ...req.body,
  hospital: req.user.hospital,
  diagnosedBy: req.user._id,
});

const populatedDiagnosis = await Diagnosis.findById(diagnosis._id)
  .populate({
    path: "visit",
    populate: {
      path: "patient",
      select: "firstName lastName",
    },
  })
  .populate("diagnosedBy", "name email")
  .lean();

res.status(201).json({
  success: true,
  message: "Diagnosis created",
  data: populatedDiagnosis,
});

  } catch (error) {
    next(error);
  }
};

// GET ALL DIAGNOSES (PAGINATED)
const getAllDiagnoses = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const diagnoses = await Diagnosis.find({
  hospital: req.user.hospital,
})
  .populate({
    path: "visit",
    populate: {
      path: "patient",
      select: "firstName lastName",
    },
  })
  .populate("diagnosedBy", "name email")
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

    const total = await Diagnosis.countDocuments({
      hospital: req.user.hospital,
    });

    res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: diagnoses,
    });
  } catch (error) {
    next(error);
  }
};

// GET DIAGNOSIS BY ID
const getDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findOne({
  _id: req.params.id,
  hospital: req.user.hospital,
})
  .populate({
    path: "visit",
    populate: {
      path: "patient",
      select: "firstName lastName",
    },
  })
  .populate("diagnosedBy", "name email");

    if (!diagnosis)
      return res.status(404).json({ message: "Diagnosis not found" });

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

// GET ALL DIAGNOSES FOR A VISIT
const getVisitDiagnoses = async (req, res, next) => {
  try {
    const diagnoses = await Diagnosis.find({ visit: req.params.visitId ,
      hospital: req.user.hospital
    })
      .populate("diagnosedBy", "name email");
    res.json({ success: true, data: diagnoses });
  } catch (error) {
    next(error);
  }
};

// Search Diagnoses
const searchDiagnoses = async (req, res, next) => {
  try {
    const keyword = req.query.q?.trim();

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const diagnoses = await Diagnosis.find({
      hospital: req.user.hospital,
      $or: [
        { diagnosis: { $regex: keyword, $options: "i" } },
        { symptoms: { $regex: keyword, $options: "i" } },
      ],
    })
      .populate({
        path: "visit",
        populate: {
          path: "patient",
          select: "firstName lastName",
        },
      })
      .populate("diagnosedBy", "name email")
      .limit(20);

    res.json({
      success: true,
      data: diagnoses,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE DIAGNOSIS
const updateDiagnosis = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.hospital },
      { ...req.body },
      { new: true }
    );

    if (!diagnosis)
      return res.status(404).json({ message: "Diagnosis not found" });

    res.json({
      success: true,
      message: "Diagnosis updated",
      data: diagnosis,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
    createDiagnosis,
    getAllDiagnoses,
    getDiagnosis,
    getVisitDiagnoses,
    searchDiagnoses,
    updateDiagnosis
}