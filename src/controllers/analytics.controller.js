const BedModel = require("../models/Bed");
const AdmissionModel = require("../models/Admission");

const getBedOccupancyAnalytics = async (req, res, next) => {
  try {
    // Total Beds
    const totalBeds = await BedModel.countDocuments();

    // Occupied Beds
    const occupiedBeds = await BedModel.countDocuments({
      isOccupied: true,
    });

    // Available Beds
    const availableBeds = totalBeds - occupiedBeds;

    // Occupancy Rate
    const occupancyRate =
      totalBeds === 0
        ? 0
        : ((occupiedBeds / totalBeds) * 100).toFixed(2);

    // Ward-Level Breakdown
    const wardBreakdown = await BedModel.aggregate([
      {
        $group: {
          _id: "$ward",
          totalBeds: { $sum: 1 },
          occupiedBeds: {
            $sum: {
              $cond: [{ $eq: ["$isOccupied", true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          ward: "$_id",
          totalBeds: 1,
          occupiedBeds: 1,
          availableBeds: {
            $subtract: ["$totalBeds", "$occupiedBeds"],
          },
          occupancyRate: {
            $cond: [
              { $eq: ["$totalBeds", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$occupiedBeds", "$totalBeds"] },
                  100,
                ],
              },
            ],
          },
        },
      },
    ]);

    // Average Length of Stay
    const avgLengthOfStayData = await AdmissionModel.aggregate([
      {
        $match: { status: "discharged" },
      },
      {
        $group: {
          _id: null,
          avgLengthOfStay: { $avg: "$lengthOfStay" },
        },
      },
    ]);

    const avgLengthOfStay =
  avgLengthOfStayData?.[0]?.avgLengthOfStay != null
    ? avgLengthOfStayData[0].avgLengthOfStay.toFixed(2)
    : "0.00";

    res.status(200).json({
      success: true,
      message: "Bed occupancy analytics",
      data: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: `${occupancyRate}%`,
        averageLengthOfStay: `${avgLengthOfStay} days`,
        wardBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBedOccupancyAnalytics,
};