const express = require("express");
const router = express.Router();
const Lead = require("../models/forex"); // Update the path to your model

// Normalize route
router.post("/normalize", async (req, res) => {
  try {
    const result = await Lead.updateMany(
      {
        assignedTo: { $ne: "" },
        status: ""
      },
      {
        $set: {
          Remarks: [],
          assignedTo: "",
          status: ""
        }
      }
    );

    res.json({
      message: "Normalization complete",
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (err) {
    console.error("❌ Normalization error:", err.message);
    res.status(500).json({ error: "Server error during normalization" });
  }
});

module.exports = router;


//----------------------------------------------------------------------------------------------------
 