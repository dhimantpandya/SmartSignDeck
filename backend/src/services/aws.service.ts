import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../config/config";

// Create an S3 client

let s3Client: S3Client | null = null;

const getClient = (): S3Client => {
  if (s3Client) return s3Client;

  const { region, accessKeyId, secretAccessKey } = config.aws;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("AWS configuration missing. Cannot perform S3 operations.");
  }

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
};

export const generatePresignedUrl = async (
  bucketName: string,
  key: string,
  expiresIn: number,
  operation: "putObject" | "getObject",
  mimeType: string = "",
): Promise<string> => {
  const client = getClient();
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
  return await getSignedUrl(client as any, command as any, { expiresIn });
};
