// models/agentProfile.js
const mongoose = require('mongoose');

const agentProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  designation: { type: String, default: '' },
  mobile: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  imageUri: { type: String, default: null },
  imagePublicId: { type: String, default: null }, // ADD THIS
}, { timestamps: true });

module.exports = mongoose.model('AgentProfile', agentProfileSchema);