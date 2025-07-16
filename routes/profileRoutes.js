const express = require("express");
const Profile = require("../models/agentProfile");

const router = express.Router();

// 🔹 GET or CREATE profile by email
router.get("/profile", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    let profile = await Profile.findOne({ email });

    // Create if not exists
    if (!profile) {
      profile = new Profile({ email });
      await profile.save();
    }

    res.status(200).json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔹 UPDATE profile
router.post("/profile/update", async (req, res) => {
  const { email, name, designation, mobile, city, state, country, imageUri } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const updated = await Profile.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          designation,
          mobile,
          city,
          state,
          country,
          imageUri,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Profile updated", profile: updated });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
