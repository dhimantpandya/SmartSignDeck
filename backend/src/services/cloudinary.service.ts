import { type UploadApiResponse, type UploadApiOptions } from "cloudinary";
import cloudinary from "../config/cloudinary";
import logger from "../config/logger";

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {UploadApiOptions} options - Cloudinary upload options
 * @returns {Promise<UploadApiResponse>}
 */
const uploadFile = async (
  filePath: string,
  options: UploadApiOptions = {},
): Promise<UploadApiResponse> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      ...options,
    });
    return result;
  } catch (error) {
    logger.error("Cloudinary upload error:", error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<any>}
 */
const deleteFile = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error("Cloudinary delete error:", error);
    throw error;
  }
};

/**
 * Generate a signature for Cloudinary Widget
 * @param {Object} paramsToSign - Parameters to sign
 * @returns {string} - The generated signature
 */
const generateSignature = (paramsToSign: any): string => {
  return cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret!,
  );
};

const cloudinaryService = {
  uploadFile,
  deleteFile,
  generateSignature,
};

export default cloudinaryService;
