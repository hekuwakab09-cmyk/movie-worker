import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import { config } from '../config.js';

const s3 = new S3Client({
  region: config.s3.region || 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`, // Потрібно для Cloudflare R2
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

export async function uploadClipToS3(filePath, fileName) {
  const key = `clips/${fileName}`;
  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: 'video/mp4',
  }));
  
  // Повертаємо публічне посилання Cloudflare R2
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
