const MedicationStock = require("../models/MedicationStock");
const {
  createMedicationStockValidator,
  updateMedicationStockValidator,
} = require("../validators/medicationStock.validator");

// CREATE
const createMedication = async (req, res) => {
  try {
    const { error } = createMedicationStockValidator.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const medication = await MedicationStock.create(req.body);
    res.status(201).json(medication);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL WITH PAGINATION
const getAllMedications = async (req, res) => {
  try {
    let { page = 1, limit = 20, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};
    if (search) {
      query.$text = { $search: search }; // text index on name, batchNumber, etc.
    }

    const total = await MedicationStock.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const medications = await MedicationStock.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      page,
      limit,
      total,
      totalPages,
      data: medications,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
const getMedicationById = async (req, res) => {
  try {
    const medication = await MedicationStock.findById(req.params.id);
    if (!medication)
      return res.status(404).json({ error: "Medication not found" });

    res.json(medication);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
const updateMedication = async (req, res) => {
  try {
    const { error } = updateMedicationStockValidator.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const medication = await MedicationStock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!medication)
      return res.status(404).json({ error: "Medication not found" });

    res.json(medication);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
const deleteMedication = async (req, res) => {
  try {
    const medication = await MedicationStock.findByIdAndDelete(req.params.id);

    if (!medication)
      return res.status(404).json({ error: "Medication not found" });

    res.json({ message: "Medication deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createMedication,
  getAllMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
};