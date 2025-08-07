const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  class: { type: String, required: true },
  srNo: { type: String, required: true },
  uniqueId: { type: String, required: false },
  contactNo: { type: String, required: false },
  address: { type: String, required: false },
  bloodGroup: { type: String, required: false },
  schoolName: { type: String, required: true },
  photoFilename: { type: String, required: true }, // ✅ fixed to match API

  dateOfBirth: { type: Date, required: false } // New added field for Date of Birth
});

module.exports = mongoose.model('Student', studentSchema);

