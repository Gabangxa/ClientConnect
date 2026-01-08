import { Router } from 'express';
import { storageService } from '../../services';
import path from 'path';
import fs from 'fs';

const router = Router();
const uploadDir = path.join(process.cwd(), "uploads");

// File download route for object storage
router.get("/download/:filePath(*)", async (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);

    // Check if file exists first
    const exists = await storageService.fileExists(filePath);
    if (!exists) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileStream = storageService.downloadFileStream(filePath);

    // Sanitize filename for Content-Disposition
    const fileName = path.basename(filePath) || 'download';
    // Remove quotes to prevent header injection
    const safeFileName = fileName.replace(/"/g, '');

    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to download file" });
      } else {
        res.end();
      }
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(404).json({ message: "File not found" });
  }
});

// Legacy file download route
router.get("/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: "Failed to download file" });
  }
});

export default router;
