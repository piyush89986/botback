import multer from 'multer';
import { uploadImage } from '../services/upload.service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const uploadMiddleware = upload.single('file');

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'products';
    const url = await uploadImage(req.file.buffer, folder);

    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
}
