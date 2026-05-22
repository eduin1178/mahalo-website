import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import { getR2Client, getR2Config } from "./r2-client";

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array | Blob;
  contentType: string;
};

export type PutObjectResult = {
  key: string;
};

export async function putObject(input: PutObjectInput): Promise<PutObjectResult> {
  const { bucket } = getR2Config();
  const client = getR2Client();

  const body =
    input.body instanceof Blob
      ? Buffer.from(await input.body.arrayBuffer())
      : input.body;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: body,
      ContentType: input.contentType,
    }),
  );

  return { key: input.key };
}

export function getPublicUrl(key: string): string {
  const { publicBaseUrl } = getR2Config();
  const normalizedKey = key.replace(/^\/+/, "");
  return `${publicBaseUrl}/${normalizedKey}`;
}

export async function deleteObject(key: string): Promise<void> {
  const { bucket } = getR2Config();
  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (err) {
    if (err instanceof S3ServiceException) {
      const status = err.$metadata?.httpStatusCode;
      if (status === 404 || err.name === "NoSuchKey") {
        return;
      }
    }
    throw err;
  }
}
