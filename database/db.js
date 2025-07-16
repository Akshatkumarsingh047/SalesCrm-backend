const mongoose = require('mongoose');


const connectDB = async (URL) => {
  try {
    await mongoose.connect(URL);
    console.log('Connected to MongoDB ✅');
  } catch (error) {
    console.error('Error ❌ connecting to MongoDB:', error);
  }
};

module.exports = connectDB;
