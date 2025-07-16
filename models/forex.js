const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
  comment: { type: String },
  date: { type: Date, default: Date.now }
});

const forexSchema = new mongoose.Schema({
  Company_name: { type: String },
  Business_vol_Lakh_Per_Year: { type:String },
  Address: { type: String },
  City: { type: String },
  State: { type: String, default: "" },
  Country: { type: String, default: "" },
  Mobile_no: { type: String },
  Landline_no: { type: String },
  E_mail_id: { type: String },
  updatedAt: { type: Date, default: new Date("01/01/2025") },

  status: {
    type: String,
    enum: [
      "converted", "demo", "dnp", "wrong number", "call me later",
      "busy", "out of station", "not interested", "dormants", "emails"
    ]
  },
  Remarks: [remarkSchema],
  assignedTo: { type: String, default: null },

  // ✅ New fields
  business_type: { type: String, default: "" },
  contact_person: { type: String, default: "" },
  source: { type: String, default: "" },
});


module.exports = mongoose.model('Forex', forexSchema);
