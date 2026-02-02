import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import audienceService from "../services/audience.service";
import successResponse from "../helpers/responses/successResponse";
import ApiError from "../utils/ApiError";

/**
 * Detect demographics from uploaded snapshot
 * @param {Request} req
 * @param {Response} res
 */
const detectDemographics = catchAsync(async (req: Request, res: Response) => {
    const { image } = req.body; // base64 image

    if (!image) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Image is required");
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64");

    const demographics = await audienceService.detectDemographics(buffer);

    successResponse(
        res,
        "Demographics detected successfully",
        httpStatus.OK,
        demographics || undefined
    );
});

export default {
    detectDemographics,
};
