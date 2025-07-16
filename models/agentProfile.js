const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  designation: { type: String, default: "" },
  mobile: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  country: { type: String, default: "" },
  imageUri: { type: String, default: "" } // base64 or image URL
});

module.exports = mongoose.model("Profile", profileSchema);
