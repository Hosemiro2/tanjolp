export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "change-me-to-a-long-random-secret",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "3000"),
  ownerEmail: process.env.OWNER_EMAIL ?? "",
};
