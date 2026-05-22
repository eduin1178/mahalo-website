import { S3Client } from "@aws-sdk/client-s3";

const REQUIRED_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

function readConfig(): R2Config {
  const missing: RequiredVar[] = [];
  const values: Partial<Record<RequiredVar, string>> = {};

  for (const name of REQUIRED_VARS) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
      missing.push(name);
    } else {
      values[name] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required R2 environment variable(s): ${missing.join(", ")}`,
    );
  }

  return {
    accountId: values.R2_ACCOUNT_ID!,
    accessKeyId: values.R2_ACCESS_KEY_ID!,
    secretAccessKey: values.R2_SECRET_ACCESS_KEY!,
    bucket: values.R2_BUCKET!,
    publicBaseUrl: values.R2_PUBLIC_BASE_URL!.replace(/\/+$/, ""),
  };
}

export function getR2Config(): R2Config {
  if (!cachedConfig) {
    cachedConfig = readConfig();
  }
  return cachedConfig;
}

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const config = getR2Config();
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}
