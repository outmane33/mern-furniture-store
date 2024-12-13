const express = require("express");
const {
  getAnalyticsData,
  getDailySalesData,
} = require("../services/analyticService");
const { protect, allowTo } = require("../services/authService");
const router = express.Router();

router.get("/", protect, allowTo("admin"), async (req, res) => {
  const analyticsData = await getAnalyticsData();

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dailySalesData = await getDailySalesData(startDate, endDate);

  res.json({
    analyticsData,
    dailySalesData,
  });
});

module.exports = router;
