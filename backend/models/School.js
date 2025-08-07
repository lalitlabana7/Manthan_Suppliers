//School.js
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
});

module.exports = mongoose.model('School', SchoolSchema);
