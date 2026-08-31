import sharp from "sharp";
import { getCloudinary } from "../config/cloudinary.js";
import { ApiError } from "../utils/apiError.js";

export interface MediaUploadResult {
  image?: string;
  video?: string;
}

/**
 * Kompres gambar (jpg/webp) lalu upload ke Cloudinary. Mengembalikan URL aman.
 * Mendukung upload buffer dari multer (memory storage).
 */
export async function uploadMediaFile(opts: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}): Promise<MediaUploadResult> {
  const { buffer, mimetype, originalname } = opts;

  if (mimetype.startsWith("image/")) {
    // Kompres gambar dengan sharp: resize maks 1600px, kualitas 80, format webp.
    const optimized = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const cloudinary = getCloudinary();
    const uploadFolder = "bangpii-news/community";
    const baseName = (originalname.replace(/\.[^.]+$/, "") || "post").replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
    const publicId = `${uploadFolder}/${Date.now()}_${baseName}`;

    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: "image", folder: uploadFolder },
        (err, res) => (err ? reject(err) : resolve(res as { secure_url?: string }))
      ).end(optimized);
    });

    if (!result.secure_url) throw new ApiError(500, "Gagal mengunggah gambar");
    return { image: result.secure_url };
  }

  if (mimetype.startsWith("video/")) {
    const cloudinary = getCloudinary();
    const uploadFolder = "bangpii-news/community";
    const baseName = (originalname.replace(/\.[^.]+$/, "") || "video").replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );
    const publicId = `${uploadFolder}/${Date.now()}_${baseName}`;
    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: "video", folder: uploadFolder },
        (err, res) => (err ? reject(err) : resolve(res as { secure_url?: string }))
      ).end(buffer);
    });
    if (!result.secure_url) throw new ApiError(500, "Gagal mengunggah video");
    return { video: result.secure_url };
  }

  throw new ApiError(400, "Tipe media tidak didukung");
}
