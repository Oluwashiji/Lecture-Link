    require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve all static files in the root folder
app.use(express.static(path.join(__dirname)));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  res.json({
    message: 'File uploaded successfully!',
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

// List files route
app.get('/files', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Error reading uploads folder' });

    const allowedExtensions = ['.pdf', '.docx'];
    const filteredFiles = files
      .filter(file => allowedExtensions.includes(path.extname(file).toLowerCase()))
      .map(file => ({ name: file, url: `/uploads/${file}` }));

    res.json(filteredFiles);
  });
});

// Serve any HTML file in the root folder
app.get('/:htmlFile', (req, res, next) => {
  const fileName = req.params.htmlFile;
  const filePath = path.join(__dirname, fileName);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  next(); // If file doesn't exist, move to 404
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
