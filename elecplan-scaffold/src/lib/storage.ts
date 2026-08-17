import { createHash, createHmac, randomUUID } from "node:crypto";

const UPLOAD_TTL_SECONDS = 5 * 60;
const DOWNLOAD_TTL_SECONDS = 2 * 60;

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

type StorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: URL;
  region: string;
};

type UploadKind = "documents" | "project-photos";

type CommitPayload = {
  key: string;
  kind: UploadKind;
  contentType: string;
  sizeBytes: number;
  exp: number;
};

function config(): StorageConfig | null {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  const endpointRaw = process.env.S3_ENDPOINT?.trim();
  const region = process.env.S3_REGION?.trim() || "auto";
  if (!accessKeyId || !secretAccessKey || !bucket || !endpointRaw) return null;

  try {
    const endpoint = new URL(endpointRaw);
    if (endpoint.protocol !== "https:") return null;
    endpoint.pathname = endpoint.pathname.replace(/\/$/, "");
    return { accessKeyId, secretAccessKey, bucket, endpoint, region };
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

function presign(
  method: "GET" | "PUT",
  key: string,
  expiresSeconds: number,
  contentType?: string,
): string {
  const cfg = config();
  if (!cfg) throw new Error("Private storage is not configured");

  const now = new Date();
  const { full, short } = amzDate(now);
  const scope = `${short}/${cfg.region}/s3/aws4_request`;
  const host = cfg.endpoint.host;
  const pathname = `${cfg.endpoint.pathname}/${awsEncode(cfg.bucket)}/${encodedPath(key)}`.replace(/\/+/g, "/");
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
    ? `content-type:${contentType.trim().toLowerCase()}\nhost:${host}\n`
    : `host:${host}\n`;
  const canonicalRequest = [
    method,
    pathname,
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

  return `${cfg.endpoint.origin}${pathname}?${canonicalQuery}&X-Amz-Signature=${signature}`;
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
