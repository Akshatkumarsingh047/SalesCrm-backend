const express = require("express");
const Profile = require("../models/agentProfile");
const upload = require("../middleware/multer");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const router = express.Router();

// 🔹 GET or CREATE profile by email
// GET /api/profile/profile?email=agent@example.com
// Change from req.query to req.params
router.get("/fetch", async (req, res) => {
  
  
  const { email } = req.query; // Changed from req.query to req.params

  if (!email) { 
    console.log("No email provided in URL");
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    let profile = await Profile.findOne({ email });

    // Create if not exists
    if (!profile) {
      console.log("Profile not found, creating new one");
      profile = new Profile({ email });
      await profile.save();
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error("Error in profile route:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// 🔹 UPDATE profile with file upload
// POST /api/profile/update
router.post("/update", upload.single('profileImage'), async (req, res) => {
  const { email, name, designation, mobile, city, state, country } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
   

    // Find existing profile
    let profile = await Profile.findOne({ email });
    
    let imageUri = null;
    let imagePublicId = null;

    // Handle file upload if present
    if (req.file) {
      try {
        console.log("🔄 Uploading to Cloudinary...");
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: 'agent-profiles',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        imageUri = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;

        // Delete old image if exists
        if (profile && profile.imagePublicId) {
          try {
         
            await deleteFromCloudinary(profile.imagePublicId);
            console.log("✅ Old image deleted");
          } catch (deleteError) {
            console.error('❌ Error deleting old image:', deleteError);
            // Continue anyway - don't fail the update
          }
        }

      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          error: "Failed to upload image",
          details: uploadError.message 
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || '',
      designation: designation || '',
      mobile: mobile || '',
      city: city || '',
      state: state || '',
      country: country || '',
    };

    // Only update image fields if new image was uploaded
    if (imageUri) {
      updateData.imageUri = imageUri;
      updateData.imagePublicId = imagePublicId;
    }

   

    // Update profile
    const updated = await Profile.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, upsert: true }
    );

    console.log("✅ Profile updated successfully");

    res.status(200).json({ 
      message: "Profile updated successfully", 
      profile: updated 
    });

  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ 
      error: "Failed to update profile",
      details: err.message 
    });
  }
});

// 🔹 DELETE profile image
// DELETE /api/profile/delete-image
router.delete("/delete-image", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const profile = await Profile.findOne({ email });
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Delete from Cloudinary if exists
    if (profile.imagePublicId) {
      try {
       
        await deleteFromCloudinary(profile.imagePublicId);
        
      } catch (deleteError) {
        console.error('❌ Error deleting from Cloudinary:', deleteError);
        // Continue anyway - still remove from database
      }
    }

    // Remove image from database
    profile.imageUri = null;
    profile.imagePublicId = null;
    await profile.save();

    res.status(200).json({ 
      message: "Profile image deleted successfully",
      profile 
    });

  } catch (err) {
    console.error("❌ Error deleting profile image:", err);
    res.status(500).json({ error: "Failed to delete profile image" });
  }
});

// 🔹 GET profile by email (additional utility route)

module.exports = router;



//------------------------------------------------------------------------------
