import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = join(process.cwd(), "src");
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css"]);
const forbidden = [
  { label: "QLS", pattern: /\bQLS\b/i },
  { label: "Quality Landscape Solutions", pattern: /Quality\s+Landscape\s+Solutions/i },
  { label: "YourPlan", pattern: /\bYour\s*Plan\b|\bYourPlan\b|your-plan\.com\.au/i },
];

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const output: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesIn(path));
    else if (allowedExtensions.has(extname(entry.name))) output.push(path);
  }
  return output;
}

async function main() {
  const violations: string[] = [];
  for (const path of await filesIn(root)) {
    const source = await readFile(path, "utf8");
    for (const rule of forbidden) {
      if (rule.pattern.test(source)) violations.push(`${relative(process.cwd(), path)} contains ${rule.label}`);
    }
  }

  if (violations.length) {
    console.error("Elecplan product boundary check failed:");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log("Elecplan product boundary check passed.");
}

void main();
