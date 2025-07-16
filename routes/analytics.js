// analytics route for daily/weekly/monthly counts
const express = require('express');
const analyticsRouter = express.Router();
const forexModel = require('../models/forex'); // Adjust path if needed

const getDateRange = (type) => {
  const today = new Date();
  if (type === 'daily') {
    today.setHours(0, 0, 0, 0);
    return { $gte: today };
  } else if (type === 'weekly') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return { $gte: startOfWeek };
  } else if (type === 'monthly') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { $gte: startOfMonth };
  }
};

analyticsRouter.get('/analytics/:agentEmail', async (req, res) => {
  const { agentEmail } = req.params;
  try {
    const periods = ['daily', 'weekly', 'monthly'];
    const results = {};

    for (const period of periods) {
      const range = getDateRange(period);
      const baseQuery = {
        assignedTo: agentEmail,
        updatedAt: range,
      };

      const demoCount = await forexModel.countDocuments({ ...baseQuery, status: "demo" });
      const convertedCount = await forexModel.countDocuments({ ...baseQuery, status: "converted" });
      const othersCount = await forexModel.countDocuments({
        ...baseQuery,
        status: { $nin: ["demo", "converted"] },
      });

      results[period] = {
        demo: demoCount,
        converted: convertedCount,
        others: othersCount,
      };
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = analyticsRouter;
