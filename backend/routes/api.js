const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const exceljs = require('exceljs');
const archiver = require('archiver');
const Student = require('../models/student');
const School = require('../models/School');

const router = express.Router();

// Multer configuration for file uploads - accepts only images up to 2MB
const storage = multer.diskStorage({
  destination: './uploads/photos/',
  filename: function (req, file, cb) {
    cb(null, 'PHOTO-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png files are allowed'));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB size limit
});

// === API ENDPOINTS ===

// 1. Get a list of schools
router.get('/schools', async (req, res) => {
  try {
    const schools = await School.find({}, 'name').lean();
    res.json(schools.map(s => s.name));
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// 2. Handle new student registration (with photo upload and dateOfBirth handling)
router.post('/students', upload.single('studentPhoto'), async (req, res) => {
  try {
    const {
      studentName,
      fatherName,
      motherName,
      class: studentClass,
      srNo,
      uniqueId,
      contactNo,
      address,
      bloodGroup,
      schoolName,
      dateOfBirth
    } = req.body;

    // Validate required fields
    if (!studentName || !fatherName || !motherName || !studentClass || !srNo || !schoolName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required.' });
    }

    // Validate dateOfBirth if present
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;
    if (dob && isNaN(dob.getTime())) {
      return res.status(400).json({ message: 'Invalid date of birth' });
    }

    const newStudent = new Student({
      studentName,
      fatherName,
      motherName,
      class: studentClass,
      srNo,
      uniqueId,
      contactNo,
      address,
      bloodGroup,
      schoolName,
      photoFilename: req.file.filename,
      dateOfBirth: dob,
    });

    await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully!' });
  } catch (error) {
    console.error('Error registering student:', error);

    // Handle Multer file type or size errors explicitly
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: error.message });
    } else if (error.message === 'Only jpeg, jpg, png files are allowed') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server Error', error });
  }
});

// 3. Download Excel file for a school (with blood group, dateOfBirth, SR.NO header)
router.get('/admin/download/excel/:schoolName', async (req, res) => {
  try {
    const students = await Student.find({ schoolName: req.params.schoolName }).lean();
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'Name', key: 'studentName', width: 30 },
      { header: 'Father Name', key: 'fatherName', width: 30 },
      { header: 'Mother Name', key: 'motherName', width: 30 },
      { header: 'Class', key: 'class', width: 10 },
      { header: 'SR.NO', key: 'srNo', width: 15 }, // Updated header name
      { header: 'Unique ID', key: 'uniqueId', width: 20 },
      { header: 'Contact Number', key: 'contactNo', width: 15 },
      { header: 'Address', key: 'address', width: 50 },
      { header: 'Blood Group', key: 'bloodGroup', width: 15 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 20 },
      { header: 'Photo Filename', key: 'photoFilename', width: 40 },
    ];

    const formattedStudents = students.map(student => {
      if (student.dateOfBirth) {
        student.dateOfBirth = new Date(student.dateOfBirth).toISOString().split('T')[0];
      } else {
        student.dateOfBirth = '';
      }
      return student;
    });

    worksheet.addRows(formattedStudents);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${req.params.schoolName}-students.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ message: 'Error generating Excel file', error });
  }
});

// 4. Download ZIP of photos for a school
router.get('/admin/download/photos/:schoolName', async (req, res) => {
  try {
    const students = await Student.find({ schoolName: req.params.schoolName });

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${req.params.schoolName}-photos.zip"`
    );

    archive.pipe(res);

    students.forEach(student => {
      const filePath = path.join(__dirname, '../uploads/photos', student.photoFilename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: student.photoFilename });
      }
    });

    await archive.finalize();
  } catch (error) {
    console.error('Error generating ZIP:', error);
    res.status(500).json({ message: 'Error generating ZIP file', error });
  }
});

// 5. Add a new school
router.post('/schools', async (req, res) => {
  try {
    const { schoolName } = req.body;
    if (!schoolName) {
      return res.status(400).json({ message: 'School name is required' });
    }

    const existingSchool = await School.findOne({ name: schoolName });
    if (existingSchool) {
      return res.status(409).json({ message: 'School already exists' });
    }

    const newSchool = new School({ name: schoolName });
    await newSchool.save();

    res.status(201).json({ message: 'School added successfully', school: newSchool });
  } catch (error) {
    console.error('Error adding school:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
