import { type Request, type Response } from "express";
import httpStatus from "http-status";
import successResponse from "../helpers/responses/successResponse";
import catchAsync from "../utils/catchAsync";
import * as generalConstant from "../utils/constants/general.constants";
import { generatePresignedUrl } from "../services/aws.service";
import config from "../config/config";
import { unescape } from "querystring";

const generateS3PresignedViewURL = catchAsync(
  async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { object_keys } = req.body;
    const presignedUrls: Array<Record<string, string>> = [];

    for (const key of object_keys) {
      const url = await generatePresignedUrl(
        config.aws.bucketName,
        key,
        Number(config.aws.getURLExpires),
        "getObject",
      );
      if (url.length > 0) {
        presignedUrls.push({
          key,
          url: unescape(url),
        });
      }
    }

    successResponse(
      res,
      generalConstant.PRESIGNED_URL_GENERATED,
      httpStatus.CREATED,
      presignedUrls,
    );
  },
);

const generateS3PresignedUploadURL = catchAsync(
  async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { object_key, mime_type } = req.body;
    const url = await generatePresignedUrl(
      config.aws.bucketName,
      object_key,
      config.aws.putURLExpires,
      "putObject",
      mime_type,
    );
    if (url !== null) {
      successResponse(
        res,
        generalConstant.PRESIGNED_URL_GENERATED,
        httpStatus.CREATED,
        { url: unescape(url) },
      );
    }
  },
);

export { generateS3PresignedUploadURL, generateS3PresignedViewURL };
