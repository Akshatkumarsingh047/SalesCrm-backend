const express = require('express');
const connectDB = require('./database/db');
const forexModel = require('./models/forex');
const analyticsRouter = require('./routes/analytics'); // Adjust path if needed
const app = express();
const normalizeRoutes = require('./routes/normalize'); // Adjust path if needed
const profileRoutes = require("./routes/profileRoutes"); // Adjust path if needed

connectDB(process.env.MONGODB_URI).then(()=>{
  console.log("database connected successfully ✅✅")
  app.listen(process.env.PORT || 3000, () => console.log("🚀 Server running"));
}).catch(()=>console.log("error in connecting to Database❌❌"))
app.use(express.json());

const ALL_STATUSES = [
  "converted", "demo", "dnp", "wrong number", "call me later",
  "busy", "out of station", "not interested", "dormants", "emails"
];

// Get collection name
app.get('/crm-name', async (req, res) => {
  const name = await forexModel.collection.collectionName;
  res.json(name);
});

// Get lead by ID
app.get('/lead-by/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const lead = await forexModel.findById(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.status(200).json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Assign leads
app.put('/forex-leads/assign', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    const lead = await forexModel.findOneAndUpdate(
      { assignedTo: "", status: "" },
      { $set: { assignedTo: userId } },
      { new: true }
    );

    if (!lead) return res.status(404).json({ message: "No unassigned leads left" });
    res.status(200).json({ assignedLead: lead });
  } catch (error) {
    console.error("❌ Error assigning lead:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update status
app.put("/lead/update", async (req, res) => {
  const { userId, leadId, status } = req.body;
  if (!userId || !leadId || !status) {
    return res.status(400).json({ message: "userId, leadId and status are required." });
  }

  try {
    const updateSet = {
      status,
      updatedAt: new Date(),
    };
   

    const updatedLead = await forexModel.findOneAndUpdate(
      { assignedTo: userId, _id: leadId },
      { $set: updateSet },
      { new: true }
    );
    if (!updatedLead) return res.status(404).json({ message: "Lead not found or not assigned to this user." });
    res.status(200).json({ message: "Lead updated successfully", lead: updatedLead });
  } catch (err) {
    console.error("❌ Error updating lead:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Dashboard leads
app.post("/leads", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required." });

  try {
    const groupedLeads = await forexModel.aggregate([
      // 1. Match leads assigned to this user
      { $match: { assignedTo: userId } },

      // 2. Filter only valid statuses (exact match)
      {
        $match: {
          status: { $in: ALL_STATUSES }
        }
      },
     //imp sort
     { $sort: { updatedAt: -1 } },

      // 3. Group by status
      {
        $group: {
          _id: "$status",
          leads: { $push: "$$ROOT" }
        }
      }
    ]);

    // 4. Prepare grouped object with all statuses
    const grouped = Object.fromEntries(ALL_STATUSES.map(status => [status, []]));
    groupedLeads.forEach(group => {
      grouped[group._id] = group.leads;
    });

    res.status(200).json(grouped);
  } catch (err) {
    console.error("❌ Error fetching leads (aggregation):", err);
    res.status(500).json({ message: "Server Error" });
  }
});


// Add remark
app.put("/lead/add-remark", async (req, res) => {
  const { userId, leadId, commentText = "No remarks added" } = req.body;
  if (!userId || !leadId) return res.status(400).json({ message: "userId and leadId are required." });

  try {
    const setObj = {};
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      setObj.assignedTo = userId;
    }

    const updatedLead = await forexModel.findOneAndUpdate(
      { _id: leadId, assignedTo: userId },
      {
        $push: {
          Remarks: {
            $each: [{ comment: commentText, date: new Date() }],
            $position: 0
          }
        },
        $set: setObj
      },
      { new: true, runValidators: true }
    );

    if (!updatedLead) return res.status(404).json({ message: "Lead not found or not assigned to this user." });
    res.status(200).json(updatedLead);
  } catch (err) {
    console.error("❌ Error adding remark:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

//add a new lead
// Add new lead
// Add new lead
app.post("/lead/add-new", async (req, res) => {
  try {
    const {
      Company_name,
      Business_vol_Lakh_Per_Year,
      Address,
      Country,
      Mobile_no,
      Landline_no,
      E_mail_id,
      status,
      assignedTo,
      business_type,
      City,
      State,
      contact_person="",
      source
    } = req.body;

    const newLead = new forexModel({
      Company_name,Business_vol_Lakh_Per_Year,
      Address,
      City,
      Country,
      Mobile_no,
       Landline_no,
      E_mail_id,
      status,
      assignedTo,
      business_type,
      State,
      contact_person,
      source,
      updatedAt: new Date(),
    });

    await newLead.save();
    res.status(201).json({ message: "Lead added successfully!" });
  } catch (err) {
    console.error("❌ Error adding lead:", err);
    res.status(500).json({ error: "Failed to add lead" });
  }
});
//search by companies name
// routes/leadRoutes.js
 // your existing lead schema

// GET: Search company names
app.get('/search-companies', async (req, res) => {
  try {
    const { q, agentId } = req.query;

    if (!q || !agentId) {
      return res.status(400).json({ error: 'Both query "q" and "agentId" are required' });
    }

    // Skip special characters at beginning, then match
    const regex = new RegExp(`^[^a-zA-Z0-9]*${q}`, 'i');

    const results = await forexModel.find({
      Company_name: regex,
      assignedTo: agentId
    })
    .select('Company_name status') // include _id implicitly
    .limit(10);

    res.json(results);
  } catch (err) {
    console.error("❌ Error in /search-companies:", err);
    res.status(500).json({ error: err.message });
  }
});

//analytics route for daily/weekly/monthly counts
app.use('/api', analyticsRouter);


// get profile data
// GET /agentProfile?email=agent@example.com
app.use("/agentProfile", profileRoutes); // ✅ CORRECT
app.use("/agents",normalizeRoutes); // ✅ CORRECT


