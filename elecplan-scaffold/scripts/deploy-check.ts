import { prisma } from "../src/lib/prisma";

const errors: string[] = [];
const warnings: string[] = [];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} is required`);
  return value ?? "";
}

function optionalGroup(label: string, names: string[]) {
  const present = names.filter((name) => Boolean(process.env[name]?.trim()));
  if (present.length > 0 && present.length < names.length) {
    warnings.push(`${label} is partially configured (${present.join(", ")}); leave the group fully unset or configure every required variable.`);
  }
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const authSecret = requireEnv("AUTH_SECRET");
  const nextAuthUrl = requireEnv("NEXTAUTH_URL");

  if (authSecret && authSecret.length < 32) {
    errors.push("AUTH_SECRET must be at least 32 characters");
  }
  if (process.env.AUTH_TRUST_HOST !== "true") {
    warnings.push("AUTH_TRUST_HOST should be true in the Railway production service");
  }
  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl);
      if (url.protocol !== "https:") errors.push("NEXTAUTH_URL must use HTTPS in production");
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        errors.push("NEXTAUTH_URL must not point at localhost in production");
      }
    } catch {
      errors.push("NEXTAUTH_URL is not a valid URL");
    }
  }
  if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push("DATABASE_URL must be a PostgreSQL connection string");
  }

  optionalGroup("ClickSend SMS", ["CLICKSEND_USERNAME", "CLICKSEND_API_KEY"]);
  optionalGroup("Private storage", ["S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET", "S3_ENDPOINT"]);
  optionalGroup("Xero staging variables", ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET", "XERO_REDIRECT_URI", "XERO_TOKEN_ENCRYPTION_KEY"]);

  if (process.env.XERO_CLIENT_ID || process.env.XERO_CLIENT_SECRET || process.env.XERO_REDIRECT_URI || process.env.XERO_TOKEN_ENCRYPTION_KEY) {
    warnings.push("Xero variables are staged, but live OAuth/token/tenant/sync must remain disabled until the explicit Xero security gate is approved.");
  }

  if (errors.length === 0) {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      errors.push("Database connectivity check failed");
    }
  }

  for (const warning of warnings) console.warn(`WARN: ${warning}`);
  for (const error of errors) console.error(`ERROR: ${error}`);

  if (errors.length > 0) process.exitCode = 1;
  else console.log("Production preflight passed: required environment and database connectivity look healthy.");
}

main()
  .catch(() => {
    console.error("ERROR: production preflight failed unexpectedly");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
