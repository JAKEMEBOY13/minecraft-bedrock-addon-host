import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { validateAddon } from './validators/addonValidator';
import { packageAddon } from './services/packager';
import { scanForMalware } from './services/malwareScanner';

const app: Express = express();
const port = process.env.PORT || 3000;

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a ZIP file.'));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/upload', upload.single('addon'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, description, version, creator } = req.body;

    if (!name || !creator) {
      return res.status(400).json({
        error: 'Missing required fields: name, creator'
      });
    }

    const scanResult = await scanForMalware(req.file.path);
    if (!scanResult.safe) {
      await fs.unlink(req.file.path);
      return res.status(403).json({
        error: 'File flagged for malicious content',
        details: scanResult.details
      });
    }

    const validation = await validateAddon(req.file.path);
    if (!validation.valid) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: 'Invalid Bedrock add-on structure',
        details: validation.errors
      });
    }

    const packagedFiles = await packageAddon(req.file.path, {
      name,
      description,
      version: version || '1.0.0',
      creator,
      format: 'bedrock'
    });

    res.json({
      success: true,
      message: 'Add-on validated and packaged successfully',
      downloads: {
        mcpack: `/downloads/${packagedFiles.mcpack}`,
        mcworld: packagedFiles.mcworld ? `/downloads/${packagedFiles.mcworld}` : null
      },
      validation: validation.details
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Server error during processing',
      details: (error as Error).message
    });
  }
});

app.get('/api/addon/:id', async (req: Request, res: Response) => {
  try {
    const addonPath = path.join('data/addons', `${req.params.id}.json`);
    const metadata = JSON.parse(await fs.readFile(addonPath, 'utf-8'));
    res.json(metadata);
  } catch (error) {
    res.status(404).json({ error: 'Add-on not found' });
  }
});

app.get('/downloads/:filename', (req: Request, res: Response) => {
  const filepath = path.join('downloads', req.params.filename);
  res.download(filepath, (err) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

app.post('/api/validate', upload.single('addon'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const validation = await validateAddon(req.file.path);
    await fs.unlink(req.file.path);

    res.json({
      valid: validation.valid,
      errors: validation.errors,
      details: validation.details
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`🎮 Minecraft Bedrock Add-on Host running on http://localhost:${port}`);
});

export default app;
