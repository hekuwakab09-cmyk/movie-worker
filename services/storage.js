import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import { config } from '../config.js';

const s3 = new S3Client({
  region: config.s3.region,
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
    ACL: 'public-read',
  }));
  return `https://${config.s3.bucket}.s3.amazonaws.com/${key}`;
}
