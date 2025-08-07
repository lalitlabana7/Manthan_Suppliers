// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// === 1. Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === 2. Ensure Uploads Directory Exists ===
const uploadDir = path.join(__dirname, 'uploads/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// === 3. MongoDB Connection ===
mongoose.connect('mongodb+srv://darshilchudasama22394:Z8A1cBlACLeV15o7@cluster0.kiv0fpe.mongodb.net/studentDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// === 4. API Routes ===
app.use('/api', apiRoutes);

// === 5. Static Files ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === 6. Start Server ===
app.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));
