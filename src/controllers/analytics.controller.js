const BedModel = require("../models/Bed");
const AdmissionModel = require("../models/Admission");

const getBedOccupancyAnalytics = async (req, res, next) => {
  try {
    const hospital = req.user.hospital;

    //  Get month/year from query
    const { month, year } = req.query;

    let dateFilter = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      dateFilter = {
        createdAt: { $gte: start, $lte: end },
      };
    }

    const totalBeds = await BedModel.countDocuments({ hospital });

    const occupiedBeds = await BedModel.countDocuments({
      hospital,
      isOccupied: true,
    });

    const availableBeds = totalBeds - occupiedBeds;

    //  RETURN NUMBER 
    const occupancyRate =
      totalBeds === 0 ? 0 : (occupiedBeds / totalBeds) * 100;

    const wardBreakdown = await BedModel.aggregate([
      { $match: { hospital } },
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

    //  FILTER admissions by month
    const avgLengthOfStayData = await AdmissionModel.aggregate([
      {
        $match: {
          hospital,
          status: "discharged",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          avgLengthOfStay: { $avg: "$lengthOfStay" },
        },
      },
    ]);

    const avgLengthOfStay =
      avgLengthOfStayData?.[0]?.avgLengthOfStay ?? 0;

    res.status(200).json({
      success: true,
      data: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate, // ✅ NUMBER
        averageLengthOfStay: avgLengthOfStay, // ✅ NUMBER
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