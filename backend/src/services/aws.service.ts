import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../config/config";

// Create an S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export const generatePresignedUrl = async (
  bucketName: string,
  key: string,
  expiresIn: number,
  operation: "putObject" | "getObject",
  mimeType: string = "",
): Promise<string> => {
  let command;

  if (operation === "putObject") {
    command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: mimeType,
    });
  } else {
    command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
  }
  return await getSignedUrl(s3Client as any, command as any, { expiresIn });
};
