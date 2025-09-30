 const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Upload endpoint with role check
app.post('/upload', upload.single('file'), (req, res) => {
  const user = req.body.user ? JSON.parse(req.body.user) : null;

  if (!user || user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Only lecturers can upload files.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Read metadata.json
  const metaPath = path.join(__dirname, 'uploads', 'metadata.json');
  let metadata = [];
  try {
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading metadata:', err);
    return res.status(500).json({ error: 'Server error reading metadata.' });
  }

  // Save new entry
  const { title, dept, level } = req.body;
  const newEntry = {
    title,
    dept,
    level,
    filename: req.file.filename
  };
  metadata.push(newEntry);

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

  res.json({ message: 'Upload successful', filename: req.file.filename });
});

// Get files
app.get('/files', (req, res) => {
  const metaPath = path.join(__dirname, 'uploads', 'metadata.json');
  let metadata = [];
  try {
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading metadata:', err);
  }
  res.json(metadata);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
  
