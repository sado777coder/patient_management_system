const VisitModel = require("../models/Visit");

const createVisit = async (req, res, next) => {
  try {
    const visit = await VisitModel.create(req.body);
    res.status(201).json({ data: visit });
  } catch (err) {
    next(err);
  }
};

const getVisits = async (req, res, next) => {
  try {
    const visits = await VisitModel.find()
      .populate("patient doctor");

    res.status(200).json({ data: visits });
  } catch (err) {
    next(err);
  }
};

const getVisitById = async (req, res, next) => {
  try {
    const visit = await VisitModel.findById(req.params.id)
      .populate("patient doctor");

    res.status(200).json({ data: visit });
  } catch (err) {
    next(err);
  }
};

const updateVisit = async (req, res, next) => {
  try {
    const visit = await VisitModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ data: visit });
  } catch (err) {
    next(err);
  }
};

const deleteVisit = async (req, res, next) => {
  try {
    await VisitModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createVisit,
  getVisits,
  getVisitById,
  updateVisit,
  deleteVisit,
};