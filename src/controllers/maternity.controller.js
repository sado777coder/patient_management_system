const PregnancyModel = require("../models/Pregnancy");
const DeliveryModel = require("../models/Delivery");

/**
 * REGISTER PREGNANCY
 */
const createPregnancy = async (req, res, next) => {
  try {
    const pregnancy = await PregnancyModel.create(req.body);

    res.status(201).json({
      success:true,
      message:"Maternal client created",
       data: pregnancy });
  } catch (err) {
    next(err);
  }
};

/**
 * GET PREGNANCIES
 */
const getPregnancies = async (req, res, next) => {
  try {
    const pregnancies = await PregnancyModel.find()
      .populate("patient");

    res.status(200).json({ 
      success:true,
      message:"Maternal women",
      data: pregnancies });
  } catch (err) {
    next(err);
  }
};

/**
 * RECORD DELIVERY
 */
const createDelivery = async (req, res, next) => {
  try {
    const delivery = await DeliveryModel.create(req.body);

    res.status(201).json({
      success:true,
      message:"Delivery created",
       data: delivery });
  } catch (err) {
    next(err);
  }
};

/**
 * GET DELIVERIES
 */
const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await DeliveryModel.find()
      .populate({
        path: "pregnancy",
        populate: "patient",
      });

    res.status(200).json({
      success:true,
      message:"Deliveries",
       data: deliveries });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPregnancy,
  getPregnancies,
  createDelivery,
  getDeliveries,
};