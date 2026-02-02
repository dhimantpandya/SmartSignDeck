import express from "express";
import auth from "../../middleware/auth";
import cloudinaryController from "../../controllers/cloudinary.controller";

const router = express.Router();

router
  .route("/upload")
  .post(
    auth("manageMedia"),
    cloudinaryController.upload.single("file"),
    cloudinaryController.uploadFile,
  );

router.route("/signature").get(auth("manageMedia"), cloudinaryController.getSignature);

export default router;
