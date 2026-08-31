import multer from "multer";
import path from "node:path";
import { ApiError } from "../utils/apiError.js";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB — cukup untuk gambar & video pendek.

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideo = ["video/mp4", "video/webm", "video/quicktime"];
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"].includes(ext);
    const okMime =
      allowedImage.includes(file.mimetype) || allowedVideo.includes(file.mimetype);
    if (!okExt || !okMime) {
      cb(new ApiError(400, "Tipe file tidak didukung."));
      return;
    }
    cb(null, true);
  },
});
