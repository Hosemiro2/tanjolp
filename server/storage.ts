// ─── Storage Helper — AWS S3 / Cloudflare R2 ─────────────────────────────────
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let _s3: S3Client | null = null;

function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: ENV.s3Region,
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
      ...(ENV.s3Endpoint ? { endpoint: ENV.s3Endpoint, forcePathStyle: true } : {}),
    });
  }
  return _s3;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload bytes to S3 and return { key, url }.
 * url is a presigned GET URL valid for 1 hour.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const s3 = getS3();
  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), {
    expiresIn: 3600,
  });
  return { key, url };
}

/**
 * Get a presigned GET URL for an existing key.
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const s3 = getS3();
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), {
    expiresIn,
  });
  return { key, url };
}
