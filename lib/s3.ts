import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * Returns configured AWS S3 client for Brio Media Vault.
 */
export function getS3Client(): S3Client {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS S3 credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) are not set."
    );
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Returns the configured bucket name.
 */
export function getBucketName(): string {
  return process.env.AWS_S3_BUCKET_NAME || "brio-media-vault-2026";
}

/**
 * Generates a clean, timestamped file key for S3 organization.
 */
export function generateS3FileKey(folder: string, originalName: string): string {
  const cleanName = originalName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9.-]/g, "_"); // Replace spaces/symbols with _

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${folder}/${timestamp}-${randomSuffix}-${cleanName}`;
}

/**
 * Uploads a Buffer to AWS S3.
 */
export async function uploadBufferToS3(params: {
  buffer: Buffer | Uint8Array;
  key: string;
  contentType: string;
}): Promise<{ fileUrl: string; fileKey: string }> {
  const client = getS3Client();
  const bucket = getBucketName();
  const region = process.env.AWS_REGION || "us-east-1";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType,
  });

  await client.send(command);

  // Standard AWS S3 URL format
  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
    params.key
  ).replace(/%2F/g, "/")}`;

  return {
    fileUrl,
    fileKey: params.key,
  };
}

/**
 * Deletes a file from AWS S3 by its key.
 */
export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const client = getS3Client();
    const bucket = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error(`[S3 Delete Error] Key: ${key}`, error);
    return false;
  }
}
