// ─── Cloudflare R2 — image archival ──────────────────────────────────────────
// Downloads an image from a (temporary) source URL and uploads it to R2.
// R2 is S3-compatible, so we use the AWS SDK v3.
//
// Why we archive: Leonardo AI image URLs expire after a window. To keep them
// accessible from the chat history forever, we copy each generated image into
// our own R2 bucket and return the persistent public URL.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./env";

let _client: S3Client | null = null;
function getClient() {
  if (!_client) {
    if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
      throw new Error("R2 credentials are not configured");
    }
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
    });
  }
  return _client;
}

/**
 * Fetch an image from a remote URL and persist it to R2. Returns the public
 * URL on the R2-backed CDN (R2_PUBLIC_BASE_URL).
 *
 * If R2 isn't configured, returns the original URL unchanged (degraded mode).
 */
export async function archiveImageFromUrl(sourceUrl: string, keyPrefix = "danya"): Promise<string> {
  if (!ENV.r2AccountId || !ENV.r2PublicBaseUrl) {
    // R2 not configured — return source URL as-is (will expire eventually).
    return sourceUrl;
  }

  const res = await fetch(sourceUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch source image: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/png";
  const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";

  const key = `${keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${ENV.r2PublicBaseUrl.replace(/\/$/, "")}/${key}`;
}
