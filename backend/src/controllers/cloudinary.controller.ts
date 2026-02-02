import httpStatus from "http-status";
import { type Request, type Response } from "express";
import catchAsync from "../utils/catchAsync";
import cloudinaryService from "../services/cloudinary.service";
import cloudinary from "../config/cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";

import successResponse from "../helpers/responses/successResponse";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/", // Temporary storage
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(httpStatus.BAD_REQUEST).send({ message: "No file uploaded" });
    return;
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinaryService.uploadFile(req.file.path, {
      folder: "smartsigndeck",
      resource_type: "auto",
    });

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    successResponse(res, "File uploaded successfully", httpStatus.OK, {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
    });
  } catch (error: any) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

const getSignature = catchAsync(async (req: Request, res: Response) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const finalParams = { ...req.query, timestamp };

  const signature = cloudinaryService.generateSignature(finalParams);

  successResponse(res, "Signature generated successfully", httpStatus.OK, {
    signature,
    timestamp,
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key,
  });
});

export default {
  upload,
  uploadFile,
  getSignature,
};
