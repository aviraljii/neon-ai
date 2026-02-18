const express = require('express');
const multer = require('multer');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const bindHost = process.env.BIND_HOST || '0.0.0.0';
const publicHost = process.env.PUBLIC_HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const nextApp = next({ dev, hostname: publicHost, port });
const handle = nextApp.getRequestHandler();

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

nextApp.prepare().then(() => {
  const server = express();

  server.use('/uploads', express.static(uploadsDir));

  server.post('/api/upload', (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Upload failed' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const forwardedHost = req.get('x-forwarded-host') || req.get('host');
      const host = forwardedHost || `${publicHost}:${port}`;
      const fileUrl = `${req.protocol}://${host}/uploads/${req.file.filename}`;

      res.status(201).json({
        success: true,
        fileName: req.file.filename,
        url: fileUrl,
      });
    });
  });

  server.all('*', (req, res) => handle(req, res));

  server.listen(port, bindHost, () => {
    console.log(`> Ready on http://${publicHost}:${port}`);
  });
});
