import { createHash, createHmac, randomUUID } from "node:crypto";

const UPLOAD_TTL_SECONDS = 5 * 60;
const DOWNLOAD_TTL_SECONDS = 2 * 60;
const DELETE_TTL_SECONDS = 60;

export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

export const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UrlStyle = "virtual" | "path";

type StorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: URL;
  region: string;
  urlStyle: UrlStyle;
};

type UploadKind = "documents" | "project-photos";

export type CommitPayload = {
  key: string;
  kind: UploadKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  exp: number;
};

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function config(): StorageConfig | null {
  // Support Elecplan's original S3_* names, Railway bucket variable references,
  // Railway CLI/AWS-compatible names, and the BUCKET_* names used in Railway guides.
  const accessKeyId = firstEnv(
    "S3_ACCESS_KEY_ID",
    "ACCESS_KEY_ID",
    "AWS_ACCESS_KEY_ID",
    "BUCKET_ACCESS_KEY_ID",
  );
  const secretAccessKey = firstEnv(
    "S3_SECRET_ACCESS_KEY",
    "SECRET_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY",
    "BUCKET_SECRET_ACCESS_KEY",
  );
  const bucket = firstEnv(
    "S3_BUCKET",
    "BUCKET",
    "AWS_S3_BUCKET_NAME",
    "BUCKET_NAME",
  );
  const endpointRaw = firstEnv(
    "S3_ENDPOINT",
    "ENDPOINT",
    "AWS_ENDPOINT_URL",
    "BUCKET_ENDPOINT",
  );
  const region = firstEnv(
    "S3_REGION",
    "REGION",
    "AWS_DEFAULT_REGION",
    "AWS_REGION",
  ) || "auto";
  const styleRaw = firstEnv("S3_URL_STYLE", "AWS_S3_URL_STYLE", "BUCKET_URL_STYLE")?.toLowerCase();

  if (!accessKeyId || !secretAccessKey || !bucket || !endpointRaw) return null;

  try {
    const endpoint = new URL(endpointRaw);
    if (endpoint.protocol !== "https:") return null;
    endpoint.pathname = endpoint.pathname.replace(/\/$/, "");

    // Railway's current buckets use virtual-hosted URLs by default. Older
    // Railway buckets and other S3-compatible providers may still be path-style.
    const railwayBaseEndpoint = endpoint.hostname === "storage.railway.app";
    const endpointAlreadyContainsBucket = endpoint.hostname === `${bucket}.storage.railway.app`;
    const urlStyle: UrlStyle = styleRaw === "path"
      ? "path"
      : styleRaw === "virtual"
        ? "virtual"
        : railwayBaseEndpoint || endpointAlreadyContainsBucket
          ? "virtual"
          : "path";

    return { accessKeyId, secretAccessKey, bucket, endpoint, region, urlStyle };
  } catch {
    return null;
  }
}

export function storageConfigured(): boolean {
  return config() !== null && Boolean(process.env.AUTH_SECRET);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodedPath(key: string): string {
  return key.split("/").map(awsEncode).join("/");
}

function amzDate(now: Date): { full: string; short: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { full: iso, short: iso.slice(0, 8) };
}

function signingKey(secret: string, shortDate: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, shortDate);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function requestTarget(cfg: StorageConfig, key: string): { origin: string; host: string; pathname: string } {
  const encodedKey = encodedPath(key);

  if (cfg.urlStyle === "virtual") {
    const endpointAlreadyContainsBucket = cfg.endpoint.hostname.startsWith(`${cfg.bucket}.`);
    const host = endpointAlreadyContainsBucket
      ? cfg.endpoint.host
      : `${cfg.bucket}.${cfg.endpoint.host}`;
    const pathname = `${cfg.endpoint.pathname}/${encodedKey}`.replace(/\/+/g, "/");
    return {
      origin: `${cfg.endpoint.protocol}//${host}`,
      host,
      pathname,
    };
  }

  const host = cfg.endpoint.host;
  const pathname = `${cfg.endpoint.pathname}/${awsEncode(cfg.bucket)}/${encodedKey}`.replace(/\/+/g, "/");
  return {
    origin: cfg.endpoint.origin,
    host,
    pathname,
  };
}

function presign(
  method: "GET" | "PUT" | "DELETE",
  key: string,
  expiresSeconds: number,
  contentType?: string,
): string {
  const cfg = config();
  if (!cfg) throw new Error("Private storage is not configured");

  const now = new Date();
  const { full, short } = amzDate(now);
  const scope = `${short}/${cfg.region}/s3/aws4_request`;
  const target = requestTarget(cfg, key);
  const signedHeaders = contentType ? "content-type;host" : "host";

  const queryEntries: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${cfg.accessKeyId}/${scope}`],
    ["X-Amz-Date", full],
    ["X-Amz-Expires", String(expiresSeconds)],
    ["X-Amz-SignedHeaders", signedHeaders],
  ];
  const canonicalQuery = queryEntries
    .map(([k, v]) => [awsEncode(k), awsEncode(v)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const canonicalHeaders = contentType
    ? `content-type:${contentType.trim().toLowerCase()}\nhost:${target.host}\n`
    : `host:${target.host}\n`;
  const canonicalRequest = [
    method,
    target.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    full,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", signingKey(cfg.secretAccessKey, short, cfg.region))
    .update(stringToSign)
    .digest("hex");

  return `${target.origin}${target.pathname}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

function cleanExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/(\.[a-z0-9]{1,8})$/);
  return match?.[1] ?? "";
}

export function createUploadTicket(input: {
  kind: UploadKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) {
  if (!storageConfigured()) throw new Error("Private storage is not configured");
  const key = `${input.kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${cleanExtension(input.fileName)}`;
  const exp = Math.floor(Date.now() / 1000) + UPLOAD_TTL_SECONDS;
  const payload: CommitPayload = {
    key,
    kind: input.kind,
    fileName: input.fileName,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    exp,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", process.env.AUTH_SECRET!).update(encoded).digest("base64url");

  return {
    key,
    uploadUrl: presign("PUT", key, UPLOAD_TTL_SECONDS, input.contentType),
    uploadHeaders: { "Content-Type": input.contentType },
    commitToken: `${encoded}.${signature}`,
    expiresIn: UPLOAD_TTL_SECONDS,
  };
}

export function verifyCommitToken(token: string, expectedKind: UploadKind): CommitPayload | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  if (provided.length !== expected.length) return null;
  let mismatch = 0;
  for (let index = 0; index < provided.length; index += 1) {
    mismatch |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  if (mismatch !== 0) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CommitPayload;
    if (payload.kind !== expectedKind || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.key.startsWith(`${expectedKind}/`)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createDownloadUrl(key: string): string {
  return presign("GET", key, DOWNLOAD_TTL_SECONDS);
}

export async function deleteStoredObject(key: string): Promise<void> {
  if (!storageConfigured()) throw new Error("Private storage is not configured");
  if (!key.startsWith("documents/") && !key.startsWith("project-photos/")) {
    throw new Error("Invalid managed storage key");
  }

  const response = await fetch(presign("DELETE", key, DELETE_TTL_SECONDS), {
    method: "DELETE",
    cache: "no-store",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Private storage delete failed (${response.status})`);
  }
}
