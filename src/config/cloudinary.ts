import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

export function ensureCloudinary() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return false;
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  return true;
}

export function getCloudinary() {
  if (!ensureCloudinary()) {
    throw new Error("Cloudinary tidak dikonfigurasi");
  }
  return cloudinary;
}
